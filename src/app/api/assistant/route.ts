// Asystent Marketing OS: przeglądarka → nasz serwer → AI (platformy albo uczestnika) → strumień tekstu.
// Dwa tryby: krok ścieżki (`stepId`) albo szybka akcja z /narzedzia (`tool`, instrukcja narzędzia tylko na serwerze).
// Zdjęcia (zrzuty ekranu) mogą być tylko w ostatniej wiadomości uczestnika: idą prosto do OpenRouter (model z obsługą
// obrazu, data_collection: deny) i nie są nigdzie zapisywane ani logowane. Przeglądarka zapisuje w historii sam tekst.
import { AiError, LIMITS, MEDIA_RULES, resolveKey, streamAssistant, type ChatMessage } from "@/lib/ai";
import { CHAT_LIMITS, MEDIA_LIMITS, VISION_MODEL, isAllowedModel, platformAi, type Provider } from "@/lib/models";
import { signedIn } from "@/lib/supabase/server";
import { buildSystem, buildToolSystem } from "@/lib/assistant";
import { findTool } from "@/lib/tools";

const plain = (msg: string, status: number) =>
  new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

const TOO_BIG = "Wiadomość jest za duża. Dodaj mniej zdjęć albo mniejsze zrzuty ekranu, a bardzo długi tekst podziel na części.";

type Body = {
  provider?: unknown;
  model?: unknown;
  stepId?: unknown;
  tool?: unknown; // id szybkiej akcji z src/lib/tools.ts; gdy jest, stepId i mode są pomijane
  mode?: unknown; // "chat" | "document"
  messages?: unknown;
  context?: { stage?: unknown; documents?: unknown };
};

// Zdjęcie = data URL JPEG/PNG/WebP; początek danych musi pasować do zadeklarowanego typu (sygnatura pliku w base64).
const IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const SIGNATURE: Record<string, string> = { jpeg: "/9j/", png: "iVBORw0KGgo", webp: "UklGR" };

function validImage(x: unknown): x is string {
  if (typeof x !== "string" || x.length > MEDIA_LIMITS.imageDataUrlMaxChars) return false;
  const m = IMAGE_RE.exec(x);
  return !!m && m[2].startsWith(SIGNATURE[m[1]]);
}

type Parsed = { ok: true; messages: ChatMessage[] } | { ok: false; error: string };

function parseMessages(raw: unknown, maxChars: number): Parsed {
  const bad: Parsed = { ok: false, error: "Nieprawidłowa rozmowa." };
  if (!Array.isArray(raw)) return bad;
  const list = raw.slice(-LIMITS.maxMessages);
  const out: ChatMessage[] = [];
  for (let i = 0; i < list.length; i++) {
    const { role, content, images } = (list[i] ?? {}) as { role?: unknown; content?: unknown; images?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return bad;
    let pics: string[] | undefined;
    if (images !== undefined) {
      if (role !== "user" || i !== list.length - 1 || !Array.isArray(images)) return { ok: false, error: "Zdjęcia można dołączyć tylko do nowej wiadomości." };
      if (images.length > MEDIA_LIMITS.maxImages) return { ok: false, error: `Najwyżej ${MEDIA_LIMITS.maxImages} zdjęcia w jednej wiadomości.` };
      if (!images.every(validImage)) return { ok: false, error: "Zdjęcie jest za duże albo ma nieobsługiwany format. Dodaj zrzut ekranu JPG albo PNG." };
      if (images.length) pics = images;
    }
    const text = content.trim().slice(0, maxChars);
    if (text || pics) out.push({ role, content: text || "Zobacz zdjęcia.", ...(pics ? { images: pics } : {}) });
  }
  // Cała rozmowa ma limit znaków: zostają najnowsze wiadomości (ostatnia zawsze).
  let budget = LIMITS.maxHistoryChars;
  let start = out.length;
  while (start > 0 && (start === out.length || budget >= out[start - 1].content.length)) {
    budget -= out[start - 1].content.length;
    start--;
  }
  const messages = out.slice(start);
  // Rozmowa musi zaczynać się od uczestnika — powitanie asystenta dokładamy do instrukcji, nie do historii.
  while (messages.length && messages[0].role !== "user") messages.shift();
  return { ok: true, messages };
}

function parseDocuments(raw: unknown): { title: string; content: string }[] {
  if (!Array.isArray(raw)) return [];
  let budget = LIMITS.maxContextChars;
  const docs: { title: string; content: string }[] = [];
  for (const d of raw) {
    const { title, content } = (d ?? {}) as { title?: unknown; content?: unknown };
    if (typeof title !== "string" || typeof content !== "string" || !content.trim()) continue;
    const text = content.trim().slice(0, budget);
    budget -= text.length;
    docs.push({ title: title.slice(0, 120), content: text });
    if (budget <= 0) break;
  }
  return docs;
}

export async function POST(request: Request) {
  // Vercel i tak nie przyjmie więcej niż 4,5 MB; tu odpowiadamy zrozumiałym komunikatem, zanim zaczniemy czytać treść.
  if (Number(request.headers.get("content-length") ?? 0) > MEDIA_LIMITS.requestMaxBytes) return plain(TOO_BIG, 413);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return plain("Nieprawidłowe zapytanie.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return plain("Nieprawidłowe zapytanie.", 400);

  const provider = body.provider;
  if (provider !== "openai" && provider !== "anthropic" && provider !== "openrouter") return plain("Najpierw podłącz swoje AI (ChatGPT albo Claude).", 400);
  const model = typeof body.model === "string" ? body.model : "";
  if (!isAllowedModel(provider as Provider, model)) return plain("Wybierz model z listy w ustawieniach AI.", 400);

  // Szybka akcja: tylko znane id z tools.ts. Każda inna wartość pola `tool` (pusta, liczba, null, nieznane id) → 400.
  // Wszystko sprawdzamy przed kluczem i logowaniem: błędne zapytanie nie kosztuje nawet sprawdzenia sesji.
  const tool = body.tool === undefined ? null : typeof body.tool === "string" ? (findTool(body.tool) ?? null) : null;
  if (body.tool !== undefined && !tool) return plain("Nieznane narzędzie.", 400);

  const stepId = typeof body.stepId === "string" ? body.stepId : "";
  const mode = !tool && body.mode === "document" ? "document" : "chat";
  const ctx = {
    stage: typeof body.context?.stage === "string" ? body.context.stage.slice(0, 200) : undefined,
    documents: parseDocuments(body.context?.documents),
  };
  const system = tool ? buildToolSystem(tool, ctx) : buildSystem(stepId, mode, ctx);
  if (!system) return plain("Nieznany krok ścieżki.", 400);

  const parsed = parseMessages(body.messages, tool ? tool.maxChars : CHAT_LIMITS.message);
  if (!parsed.ok) return plain(parsed.error, 400);
  const messages = parsed.messages;
  if (mode === "document") {
    messages.push({ role: "user", content: "Na podstawie naszej rozmowy przygotuj teraz gotowy dokument dokładnie według szablonu z instrukcji. Bez wstępu i komentarzy." });
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") return plain("Ostatnia wiadomość musi być Twoja.", 400);

  // Zdjęcia czyta tylko model z obsługą obrazu przez OpenRouter (DeepSeek ich nie widzi).
  const withImages = messages.some((m) => m.images?.length);
  if (withImages && provider !== "openrouter") return plain("Zdjęcia działają tylko z AI platformy. Wklej tekst rozmowy.", 400);

  const { key: apiKey, platform } = await resolveKey(provider);
  if (!apiKey) {
    return platformAi
      ? plain("Asystent jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.", 503)
      : plain("Twoje AI nie jest połączone. Wejdź w „Połącz AI” i zaloguj się.", 401);
  }
  // Za AI platformy płacimy my: rozmawiać mogą tylko zalogowani uczestnicy.
  if (platform && !(await signedIn())) return plain("Zaloguj się, żeby rozmawiać z asystentem.", 401);

  try {
    const stream = await streamAssistant({
      provider,
      model: withImages ? VISION_MODEL : model,
      apiKey,
      staticSystem: system.staticText,
      dynamicSystem: `${system.dynamicText}\n\n${MEDIA_RULES}`,
      messages,
      cacheKey: tool ? `marketing-os-tool-${tool.id}` : `marketing-os-${stepId}-${mode}`,
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AiError) return plain(err.message, err.status);
    return plain("Coś poszło nie tak po stronie serwera. Spróbuj jeszcze raz.", 500);
  }
}
