// Nagranie → tekst (transkrypcja rozmowy sprzedażowej albo notatka głosowa / dyktowanie bez rozpoznawania mowy w przeglądarce).
// POST multipart/form-data: plik (nagranie, do 4 MB), rodzaj ("rozmowa" | "dyktowanie"). Odpowiedź: strumień tekstu.
// Prywatność: plik żyje tylko w pamięci na czas zapytania i trafia wyłącznie do OpenRouter (data_collection: deny).
// Nic nie zapisujemy na dysku, w bazie ani w logach (żadnego console.log z treścią).
import { AiError, resolveKey, streamTranscription, type TranscriptKind } from "@/lib/ai";
import { AUDIO_MODEL, MEDIA_LIMITS, audioFormat, platformAi } from "@/lib/models";
import { signedIn } from "@/lib/supabase/server";

// Dłuższe nagranie to dłuższe spisywanie (Gemini oddaje tekst strumieniem).
export const maxDuration = 120;

const plain = (msg: string, status: number) =>
  new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

const MB = Math.round(MEDIA_LIMITS.audioMaxBytes / 1024 / 1024);
const TOO_BIG = `Nagranie ma więcej niż ${MB} MB. Wklej transkrypcję (np. z Fathom) albo nagraj krótszy fragment, najlepiej do kilku minut.`;
const BAD_TYPE = "Tego pliku nie da się odczytać. Dodaj nagranie MP3, M4A, WAV, OGG albo WEBM.";

/** Rozpoznanie formatu po pierwszych bajtach pliku (nie ufamy samej nazwie ani typowi z przeglądarki). */
function sniff(b: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b.length < 12) return null;
  if (ascii(0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) !== 0)) return "mp3"; // ramka MPEG Layer III
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return "aac"; // ADTS
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return "wav";
  if (ascii(0, 4) === "OggS") return "ogg";
  if (ascii(0, 4) === "fLaC") return "flac";
  if (ascii(4, 8) === "ftyp") return "m4a";
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "webm";
  return null;
}

export async function POST(request: Request) {
  // Najpierw rozmiar z nagłówka: nie czytamy pliku, który i tak jest za duży (limit Vercel to 4,5 MB na zapytanie).
  if (Number(request.headers.get("content-length") ?? 0) > MEDIA_LIMITS.requestMaxBytes) return plain(TOO_BIG, 413);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) return plain("Nieprawidłowe zapytanie.", 400);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return plain("Nieprawidłowe zapytanie.", 400);
  }
  const file = form.get("plik");
  const kind: TranscriptKind = form.get("rodzaj") === "dyktowanie" ? "dyktowanie" : "rozmowa";
  if (!(file instanceof File) || !file.size) return plain("Dodaj plik z nagraniem.", 400);
  if (file.size > MEDIA_LIMITS.audioMaxBytes) return plain(TOO_BIG, 413);
  // Typ z przeglądarki bywa pusty albo „video/mp4” dla .m4a, dlatego decyduje sygnatura pliku (sniff).
  if (file.type && !/^(audio\/|video\/(webm|mp4|ogg)|application\/octet-stream)/i.test(file.type)) return plain(BAD_TYPE, 415);
  const declared = audioFormat(file.type, file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = sniff(bytes);
  if (!declared || !format) return plain(BAD_TYPE, 415);

  // Te same zasady co w rozmowie z asystentem: klucz platformy na serwerze, tylko zalogowani.
  const { key: apiKey, platform } = await resolveKey("openrouter");
  if (!apiKey) {
    return platformAi
      ? plain("Asystent jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.", 503)
      : plain("Twoje AI nie jest połączone. Wejdź w „Połącz AI” i zaloguj się.", 401);
  }
  if (platform && !(await signedIn())) return plain("Zaloguj się, żeby rozmawiać z asystentem.", 401);

  try {
    const stream = await streamTranscription({ apiKey, model: AUDIO_MODEL, audio: Buffer.from(bytes).toString("base64"), format, kind });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AiError) return plain(err.message, err.status);
    return plain("Coś poszło nie tak po stronie serwera. Spróbuj jeszcze raz.", 500);
  }
}
