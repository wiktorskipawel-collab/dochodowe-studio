"use client";

// Pole wiadomości dla rozmów z asystentem (szybkie akcje i krok ścieżki): tekst, dyktowanie, zdjęcia, nagranie, transkrypcja.
// - Dyktowanie: rozpoznawanie mowy w przeglądarce (Web Speech API, pl-PL), tekst pojawia się w polu na żywo.
//   Uwaga: w Chrome i Edge mowę rozpoznaje usługa przeglądarki (Google / Microsoft), nie nasz serwer.
//   Gdy przeglądarka tego nie umie (np. Firefox): nagranie (MediaRecorder) → /api/transkrypcja → tekst w polu.
// - Zdjęcia: do 3, zmniejszane w przeglądarce do 1600 px (JPEG, poniżej ok. 0,9 MB). Idą tylko z tą jedną wiadomością,
//   w historii zostaje dopisek „[Dołączone zdjęcia: N…]” (zdjęć nie zapisujemy).
// - Nagranie (mp3, m4a, wav, ogg, webm, do 4 MB) → /api/transkrypcja → „Transkrypcja rozmowy:” w polu, do poprawienia.
// - „Wklej transkrypcję rozmowy”: duże pole, np. na tekst z Fathom.
// - Pod polem stała linijka: rozmowy obsługuje zewnętrzny model AI, bez danych zdrowotnych i kontaktowych klientów (link do polityki).
import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch, type DragEvent, type ReactNode, type RefObject, type SetStateAction } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion } from "motion/react";
import { AudioLines, FileText, ImagePlus, LoaderCircle, Mic, Send, Square, X, Image as ImageIcon } from "lucide-react";
import { AUDIO_ACCEPT, IMAGE_NOTE_RE, MEDIA_LIMITS, audioFormat, imageNote } from "@/lib/models";
import { DialogCloseButton, MotionDialog } from "@/components/ToolIntro";

export type ImageDraft = { id: string; url: string };
export type ComposerFeatures = { images: boolean; audio: boolean; transcript: boolean };

const TRANSCRIPT_HEAD = "Transkrypcja rozmowy:\n";
const AUDIO_MB = Math.round(MEDIA_LIMITS.audioMaxBytes / 1024 / 1024);
const LONG_HINT = "Przy dłuższej rozmowie wklej transkrypcję (np. z Fathom) albo nagraj krótszy fragment.";

const fmt = (n: number) => n.toLocaleString("pl-PL");
const join = (cur: string, block: string) => (cur.trim() ? `${cur.replace(/\s+$/, "")}\n\n${block}` : block);

// ---------- Wiadomość do wysłania i do zapisania ----------

/** stored: tekst do historii (z dopiskiem o zdjęciach), request: to, co idzie do /api/assistant (ze zdjęciami). */
export function composeUserMessage(text: string, images: ImageDraft[]) {
  const t = text.trim();
  if (!images.length) return { stored: t, request: { role: "user" as const, content: t } };
  return {
    stored: `${t}${t ? "\n\n" : ""}${imageNote(images.length)}`,
    request: { role: "user" as const, content: t || "Zobacz zdjęcia.", images: images.map((i) => i.url) },
  };
}

/** Treść wiadomości uczestnika w dymku: tekst + plakietka zamiast dopisku o zdjęciach (+ miniatury w tej sesji). */
export function UserMessageBody({ text, pictures }: { text: string; pictures?: string[] }) {
  const m = IMAGE_NOTE_RE.exec(text);
  const body = m ? text.slice(0, m.index) : text;
  const n = m ? Number(m[1]) : 0;
  return (
    <span className="flex flex-col gap-2">
      {body.trim() ? <span className="whitespace-pre-wrap leading-relaxed">{body}</span> : null}
      {pictures?.length ? (
        <span className="flex flex-wrap gap-1.5">
          {pictures.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- miniatura z pamięci przeglądarki (data URL)
            <img key={i} src={src} alt={`Dołączone zdjęcie ${i + 1}`} className="size-16 rounded-lg object-cover ring-1 ring-white/20" />
          ))}
        </span>
      ) : null}
      {n ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1 text-xs text-white/80">
          <ImageIcon className="size-3.5" aria-hidden="true" />
          {n === 1 ? "1 zdjęcie" : `${n} zdjęcia`} · nie zapisujemy
        </span>
      ) : null}
    </span>
  );
}

// ---------- Zdjęcia: zmniejszanie w przeglądarce ----------

const dataUrlBytes = (u: string) => Math.floor(((u.length - u.indexOf(",") - 1) * 3) / 4);

async function loadImage(file: File) {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** JPEG, dłuższy bok najwyżej 1600 px, poniżej ok. 0,9 MB (najpierw niższa jakość, potem mniejszy wymiar). */
async function compressImage(file: File): Promise<string> {
  const img = await loadImage(file);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) throw new Error("empty");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  let side: number = MEDIA_LIMITS.imageMaxSide;
  let last = "";
  for (let round = 0; round < 5; round++) {
    const scale = Math.min(1, side / Math.max(w0, h0));
    canvas.width = Math.max(1, Math.round(w0 * scale));
    canvas.height = Math.max(1, Math.round(h0 * scale));
    ctx.fillStyle = "#ffffff"; // przezroczyste PNG na białym tle
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.85, 0.75, 0.65]) {
      last = canvas.toDataURL("image/jpeg", q);
      if (dataUrlBytes(last) <= MEDIA_LIMITS.imageMaxBytes) return last;
    }
    side = Math.round(side * 0.75);
  }
  if (last && last.length <= MEDIA_LIMITS.imageDataUrlMaxChars) return last;
  throw new Error("too-big");
}

// ---------- Rozpoznawanie mowy (Web Speech API) ----------

type SpeechResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: SpeechResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function speechRecognition(): (new () => Recognition) | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const SPEECH_ERRORS: Record<string, string> = {
  "not-allowed": "Przeglądarka nie ma dostępu do mikrofonu. Zezwól na mikrofon (ikona kłódki obok adresu strony) i spróbuj jeszcze raz.",
  "service-not-allowed": "Przeglądarka nie pozwala tu na dyktowanie. Możesz dodać nagranie albo pisać.",
  "no-speech": "Nic nie słychać. Sprawdź mikrofon i spróbuj jeszcze raz.",
  "audio-capture": "Nie widzę mikrofonu. Podłącz go albo wybierz w ustawieniach przeglądarki.",
  network: "Dyktowanie w tej przeglądarce potrzebuje internetu. Sprawdź połączenie.",
  "language-not-supported": "Ta przeglądarka nie rozpoznaje mowy po polsku. Możesz dodać nagranie albo pisać.",
};

function recorderMime() {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

const extFor = (mime: string) => (mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm");

// ---------- Komponent ----------

type Busy = { kind: "rozmowa" | "dyktowanie"; chars: number } | null;
type Problem = { text: string; transcript?: boolean } | null;

export function ChatComposer({
  id, label, value, setValue, images, setImages, onSubmit, busy, maxChars, placeholder, features, fieldRef, rows = 3, footer,
}: {
  id: string;
  label: string;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  images: ImageDraft[];
  setImages: Dispatch<SetStateAction<ImageDraft[]>>;
  onSubmit: () => void;
  busy: boolean;
  maxChars: number;
  placeholder: string;
  features: ComposerFeatures;
  fieldRef?: RefObject<HTMLTextAreaElement | null>;
  rows?: number;
  footer?: ReactNode;
}) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const field = fieldRef ?? ownRef;
  const valueRef = useRef(value);
  const recognition = useRef<Recognition | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const upload = useRef<AbortController | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState<number | null>(null); // sekundy nagrania (zastępstwo dyktowania)
  const [transcribing, setTranscribing] = useState<Busy>(null);
  const [preparing, setPreparing] = useState(false); // zmniejszanie zdjęć
  const [problem, setProblem] = useState<Problem>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Wyjście z rozmowy zatrzymuje mikrofon i przerywa wysyłanie nagrania.
  useEffect(() => () => {
    recognition.current?.abort();
    if (recorder.current?.state === "recording") {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    if (timer.current) clearInterval(timer.current);
    upload.current?.abort();
  }, []);

  const working = !!transcribing || recording !== null || preparing;

  /** discard: przy wysyłaniu — spóźnione wyniki nie mogą wrócić do pustego już pola. */
  function stopListening(discard = false) {
    const rec = recognition.current;
    if (!rec) return;
    if (discard) {
      rec.onresult = null;
      rec.abort();
    } else rec.stop();
  }

  // ----- Dyktowanie -----
  async function toggleDictation() {
    setProblem(null);
    setNote(null);
    if (listening) return stopListening();
    if (recording !== null) {
      recorder.current?.stop();
      return;
    }
    const SR = speechRecognition();
    if (SR) {
      const rec = new SR();
      rec.lang = "pl-PL";
      rec.interimResults = true;
      rec.continuous = !/Android/i.test(navigator.userAgent); // Chrome na Androidzie dubluje wyniki w trybie ciągłym
      const base = valueRef.current;
      const sep = base && !/\s$/.test(base) ? " " : "";
      rec.onresult = (e) => {
        let done = "";
        let live = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) done += r[0].transcript;
          else live += r[0].transcript;
        }
        setValue((base + sep + done + live).slice(0, maxChars));
      };
      rec.onerror = (e) => {
        if (e.error !== "aborted") setProblem({ text: SPEECH_ERRORS[e.error] ?? "Dyktowanie przerwane. Spróbuj jeszcze raz." });
      };
      rec.onend = () => {
        recognition.current = null;
        setListening(false);
        field.current?.focus();
      };
      recognition.current = rec;
      try {
        rec.start();
        setListening(true);
      } catch {
        recognition.current = null;
        setProblem({ text: "Nie udało się włączyć dyktowania. Spróbuj jeszcze raz." });
      }
      return;
    }
    // Bez rozpoznawania mowy: nagrywamy i zamieniamy na tekst na serwerze.
    const mime = recorderMime();
    if (mime === null || !navigator.mediaDevices?.getUserMedia) {
      setProblem({ text: "Ta przeglądarka nie obsługuje dyktowania. Na telefonie użyj mikrofonu na klawiaturze albo pisz." });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setProblem({ text: SPEECH_ERRORS["not-allowed"] });
      return;
    }
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32_000 } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      recorder.current = null;
      setRecording(null);
      const type = rec.mimeType || mime || "audio/webm";
      const blob = new Blob(chunks, { type });
      if (blob.size) void transcribe(blob, `dyktowanie.${extFor(type)}`, "dyktowanie");
    };
    recorder.current = rec;
    rec.start(1000);
    let seconds = 0;
    setRecording(0);
    timer.current = setInterval(() => {
      seconds += 1;
      setRecording(seconds);
      if (seconds >= MEDIA_LIMITS.dictationMaxSeconds && rec.state === "recording") rec.stop();
    }, 1000);
  }

  // ----- Nagranie → tekst -----
  async function transcribe(file: Blob, name: string, kind: "rozmowa" | "dyktowanie") {
    setProblem(null);
    setNote(null);
    const form = new FormData();
    form.append("plik", file, name);
    form.append("rodzaj", kind);
    const ctrl = new AbortController();
    upload.current = ctrl;
    setTranscribing({ kind, chars: 0 });
    try {
      const res = await fetch("/api/transkrypcja", { method: "POST", body: form, signal: ctrl.signal });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        setProblem({ text: msg || "Nie udało się zamienić nagrania na tekst.", transcript: kind === "rozmowa" && features.transcript });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        text += decoder.decode(chunk, { stream: true });
        setTranscribing({ kind, chars: text.length });
      }
      text = (text + decoder.decode()).trim();
      if (!text || /^\[Brak mowy w nagraniu\]$/.test(text)) {
        setProblem({ text: "W nagraniu nie słychać mowy. Sprawdź plik albo mikrofon." });
        return;
      }
      const block = kind === "rozmowa" ? TRANSCRIPT_HEAD + text : text;
      const cur = valueRef.current;
      const joined = kind === "rozmowa" ? join(cur, block) : cur + (cur && !/\s$/.test(cur) ? " " : "") + block;
      if (joined.length > maxChars) setNote(`Tekst był dłuższy niż ${fmt(maxChars)} znaków, więc końcówka została ucięta. ${LONG_HINT}`);
      else if (kind === "rozmowa") setNote("Transkrypcja jest w polu wiadomości. Przeczytaj ją, popraw imiona i usuń dane, których AI nie potrzebuje.");
      setValue(joined.slice(0, maxChars));
      requestAnimationFrame(() => field.current?.focus());
    } catch {
      if (!ctrl.signal.aborted) setProblem({ text: "Brak połączenia z serwerem. Spróbuj jeszcze raz." });
    } finally {
      if (upload.current === ctrl) upload.current = null;
      setTranscribing(null);
    }
  }

  function onAudioFile(f: File | undefined) {
    if (!f) return;
    setProblem(null);
    if (!audioFormat(f.type, f.name)) {
      setProblem({ text: "Tego pliku nie da się odczytać. Dodaj nagranie MP3, M4A, WAV, OGG albo WEBM." });
      return;
    }
    if (f.size > MEDIA_LIMITS.audioMaxBytes) {
      setProblem({ text: `To nagranie ma ${(f.size / 1024 / 1024).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} MB, a limit to ${AUDIO_MB} MB. ${LONG_HINT}`, transcript: features.transcript });
      return;
    }
    void transcribe(f, f.name, "rozmowa");
  }

  // ----- Zdjęcia -----
  async function addImages(files: File[]) {
    setProblem(null);
    setNote(null);
    const pics = files.filter((f) => f.type.startsWith("image/"));
    if (!pics.length) return;
    const room = MEDIA_LIMITS.maxImages - images.length;
    if (room <= 0) {
      setProblem({ text: `Najwyżej ${MEDIA_LIMITS.maxImages} zdjęcia w jednej wiadomości. Usuń któreś albo wyślij je osobno.` });
      return;
    }
    setPreparing(true);
    const added: ImageDraft[] = [];
    let failed = 0;
    for (const f of pics.slice(0, room)) {
      try {
        added.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, url: await compressImage(f) });
      } catch {
        failed++;
      }
    }
    setPreparing(false);
    if (added.length) setImages((cur) => [...cur, ...added].slice(0, MEDIA_LIMITS.maxImages));
    if (failed) setProblem({ text: "Nie da się odczytać tego zdjęcia. Zrób zrzut ekranu (PNG albo JPG) i dodaj go jeszcze raz." });
    else if (pics.length > room) setNote(`Dodano ${added.length} z ${pics.length}: w jednej wiadomości mieszczą się ${MEDIA_LIMITS.maxImages} zdjęcia.`);
  }

  function onDrop(e: DragEvent<HTMLFormElement>) {
    const files = [...e.dataTransfer.files];
    if (!files.length) return;
    e.preventDefault();
    const audio = files.find((f) => f.type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg|oga|opus|webm|aac|flac)$/i.test(f.name));
    if (audio && features.audio) onAudioFile(audio);
    else if (features.images) void addImages(files);
  }

  // ----- Transkrypcja wklejana -----
  const pasteRoom = Math.max(0, maxChars - value.length - TRANSCRIPT_HEAD.length - 2);
  function insertTranscript() {
    const t = pasteText.trim();
    if (!t) return;
    setValue((cur) => join(cur, TRANSCRIPT_HEAD + t).slice(0, maxChars));
    setPasteText("");
    setPasteOpen(false);
    setNote("Transkrypcja jest w polu wiadomości. Możesz dopisać pytanie, np. „Oceń tę rozmowę”, i wysłać.");
    requestAnimationFrame(() => field.current?.focus());
  }

  function submit() {
    if (busy || working || (!value.trim() && !images.length)) return;
    if (listening) stopListening(true);
    setProblem(null);
    setNote(null);
    onSubmit();
  }

  const status = listening
    ? { icon: <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex size-2.5 rounded-full bg-red-400" /></span>, text: "Słucham… mów spokojnie, tekst pojawia się w polu. Kliknij mikrofon, żeby skończyć.", stop: { label: "Zakończ dyktowanie", run: () => stopListening() } }
    : recording !== null
      ? { icon: <span className="size-2.5 rounded-full bg-red-400" />, text: `Nagrywam ${Math.floor(recording / 60)}:${String(recording % 60).padStart(2, "0")} (najwyżej ${MEDIA_LIMITS.dictationMaxSeconds / 60} min). Po zakończeniu zamienię nagranie na tekst.`, stop: { label: "Zakończ nagrywanie", run: () => recorder.current?.stop() } }
      : transcribing
        ? { icon: <LoaderCircle className="size-4 animate-spin text-brand" aria-hidden="true" />, text: `${transcribing.kind === "rozmowa" ? "Spisuję nagranie" : "Zamieniam mowę na tekst"}…${transcribing.chars ? ` ${fmt(transcribing.chars)} znaków` : " To może potrwać do minuty."}`, stop: { label: "Anuluj", run: () => upload.current?.abort() } }
        : preparing
          ? { icon: <LoaderCircle className="size-4 animate-spin text-brand" aria-hidden="true" />, text: "Przygotowuję zdjęcia…", stop: null }
          : null;

  const toolBtn = "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40";

  return (
    <>
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
        onDrop={onDrop}
        className="glass-card flex flex-col gap-1 rounded-2xl p-2"
      >
        <AnimatePresence initial={false}>
          {images.length ? (
            <motion.ul key="pics" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2 px-2 pt-2" aria-label="Zdjęcia do wysłania">
              {images.map((img, i) => (
                <motion.li key={img.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- podgląd z pamięci przeglądarki (data URL) */}
                  <img src={img.url} alt={`Zdjęcie ${i + 1} do wysłania`} className="size-20 rounded-xl object-cover ring-1 ring-white/20" />
                  <button type="button" onClick={() => setImages((cur) => cur.filter((x) => x.id !== img.id))} aria-label={`Usuń zdjęcie ${i + 1}`}
                    className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/30 hover:bg-red-500/90 focus-visible:outline-2">
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <label htmlFor={id} className="sr-only">{label}</label>
          <textarea
            id={id}
            ref={field}
            value={value}
            rows={rows}
            readOnly={listening} // podczas dyktowania tekst wpisuje mikrofon; pisanie wraca po „Zakończ”
            maxLength={maxChars}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Na komputerze Enter wysyła, Shift+Enter to nowa linia. Na telefonie Enter zawsze robi nową linię.
              if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
              if (window.matchMedia("(pointer: coarse)").matches) return;
              e.preventDefault();
              submit();
            }}
            onPaste={(e) => {
              // Zrzut ekranu ze schowka (Ctrl+V) = zdjęcie. Gdy w schowku jest też tekst, wklejamy tekst jak zwykle.
              if (!features.images) return;
              const files = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
              if (files.length && !e.clipboardData.getData("text/plain")) {
                e.preventDefault();
                void addImages(files);
              }
            }}
            placeholder={placeholder}
            aria-describedby={`${id}-help`}
            className={`field-sizing-content max-h-72 flex-1 resize-y rounded-xl bg-transparent px-3 py-2 text-white placeholder:text-white/50 focus:outline-none ${rows > 2 ? "min-h-20" : "min-h-14"}`}
          />
          <button type="submit" disabled={busy || working || (!value.trim() && !images.length)} aria-label="Wyślij" className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink disabled:opacity-40">
            {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 px-1" role="toolbar" aria-label="Dodaj do wiadomości">
          <button type="button" onClick={() => void toggleDictation()} disabled={!!transcribing || preparing} aria-pressed={listening || recording !== null}
            aria-label={listening || recording !== null ? "Zakończ dyktowanie" : "Dyktuj (mikrofon)"}
            className={`${toolBtn} ${listening || recording !== null ? "bg-red-500/20 text-red-100 ring-1 ring-red-400/50 hover:bg-red-500/30" : ""}`}>
            {listening || recording !== null ? <Square className="size-4 fill-current" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{listening || recording !== null ? "Zakończ" : "Dyktuj"}</span>
          </button>
          {features.images ? (
            <>
              <button type="button" onClick={() => imageInput.current?.click()} disabled={working || images.length >= MEDIA_LIMITS.maxImages} aria-label={`Dodaj zdjęcie albo zrzut ekranu (najwyżej ${MEDIA_LIMITS.maxImages})`} className={toolBtn}>
                <ImagePlus className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Zdjęcie</span>
              </button>
              <input ref={imageInput} type="file" accept="image/*" multiple hidden tabIndex={-1} aria-hidden="true"
                onChange={(e) => { void addImages([...(e.target.files ?? [])]); e.target.value = ""; }} />
            </>
          ) : null}
          {features.audio ? (
            <>
              <button type="button" onClick={() => audioInput.current?.click()} disabled={working} aria-label={`Dodaj nagranie (MP3, M4A, WAV, OGG, do ${AUDIO_MB} MB)`} className={toolBtn}>
                <AudioLines className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Nagranie</span>
              </button>
              <input ref={audioInput} type="file" accept={AUDIO_ACCEPT} hidden tabIndex={-1} aria-hidden="true"
                onChange={(e) => { onAudioFile(e.target.files?.[0]); e.target.value = ""; }} />
            </>
          ) : null}
          {features.transcript ? (
            <button type="button" onClick={() => setPasteOpen(true)} disabled={working} className={toolBtn}>
              <FileText className="size-4" aria-hidden="true" /><span className="sm:hidden">Transkrypcja</span><span className="hidden sm:inline">Wklej transkrypcję rozmowy</span>
            </button>
          ) : null}
          {value.length > maxChars - 1500 ? (
            <span className={`ml-auto px-2 text-xs ${value.length >= maxChars ? "text-amber-300" : "text-white/55"}`}>{fmt(value.length)}/{fmt(maxChars)} znaków</span>
          ) : null}
        </div>

        <AnimatePresence initial={false}>
          {status ? (
            <motion.div key="status" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="mx-1 flex flex-wrap items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-sm text-white/85">
              {status.icon}
              <span className="flex-1">{status.text}</span>
              {status.stop ? (
                <button type="button" onClick={status.stop.run} className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-3 text-sm font-semibold hover:bg-white/10">{status.stop.label}</button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {problem ? (
          <div role="alert" className="mx-1 flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
            <span className="flex-1">{problem.text}</span>
            {problem.transcript ? (
              <button type="button" onClick={() => { setProblem(null); setPasteOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-neutral-900 hover:bg-white/90">
                <FileText className="size-4" aria-hidden="true" />Wklej transkrypcję
              </button>
            ) : null}
            <button type="button" onClick={() => setProblem(null)} aria-label="Zamknij komunikat" className="grid size-11 place-items-center rounded-xl text-amber-100/80 hover:bg-white/10"><X className="size-4" aria-hidden="true" /></button>
          </div>
        ) : note ? (
          <p role="status" className="mx-1 rounded-xl bg-brand/10 px-3 py-2 text-sm text-white/85">{note}</p>
        ) : null}

        <div id={`${id}-help`} className="flex flex-col gap-1 px-3 pb-1 text-xs text-white/55">
          {/* Stała informacja o AI i danych (audyt UX W9): zawsze widoczna, niezależnie od stopki. */}
          <p>
            Rozmowy obsługuje zewnętrzny model AI. Nie wpisuj danych zdrowotnych ani danych kontaktowych klientów.{" "}
            <Link href="/polityka-prywatnosci#ai" target="_blank" rel="noopener noreferrer" className="font-semibold text-white/75 underline underline-offset-2 hover:text-white">
              Więcej<span className="sr-only"> o tym, co trafia do AI (polityka prywatności, w nowej karcie)</span>
            </Link>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 empty:hidden">
            {footer ?? <span className="pointer-coarse:hidden">Na komputerze: Enter wysyła, Shift+Enter to nowa linia.{features.images ? " Zrzut ekranu wkleisz też przez Ctrl+V." : ""}</span>}
          </div>
        </div>
      </form>

      <MotionDialog open={pasteOpen} onClose={() => setPasteOpen(false)} initialFocus={pasteRef} className="max-w-3xl p-5 md:p-6">
        <DialogCloseButton />
        <Dialog.Title className="pr-10 text-xl font-bold">Wklej transkrypcję rozmowy</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-white/70">
          Tekst z Fathom, Zoom, Google Meet, dyktafonu albo Twoje notatki. Zamiast nazwisk zostaw imiona, usuń numery telefonów i informacje o zdrowiu.
        </Dialog.Description>
        <label htmlFor={`${id}-paste`} className="sr-only">Transkrypcja rozmowy</label>
        <textarea
          id={`${id}-paste`}
          ref={pasteRef}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          maxLength={pasteRoom}
          rows={14}
          placeholder={"Osoba 1: Dzień dobry, dzwonię w sprawie formularza…\nOsoba 2: …"}
          className="mt-4 min-h-64 w-full resize-y rounded-2xl border border-white/15 bg-black/30 p-4 text-sm leading-relaxed text-white placeholder:text-white/35 focus:border-brand focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
          <span>{fmt(pasteText.length)}/{fmt(pasteRoom)} znaków{pasteRoom < 1000 ? " · pole wiadomości jest prawie pełne" : ""}</span>
          {pasteText.length >= pasteRoom && pasteRoom > 0 ? <span className="text-amber-300">To limit jednej wiadomości. Wklej najważniejszy fragment rozmowy.</span> : null}
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Dialog.Close className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white">Anuluj</Dialog.Close>
          <button type="button" onClick={insertTranscript} disabled={!pasteText.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink hover:brightness-110 disabled:opacity-40">
            <FileText className="size-4" aria-hidden="true" />Wstaw do wiadomości
          </button>
        </div>
      </MotionDialog>
    </>
  );
}
