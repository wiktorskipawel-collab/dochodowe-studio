// Lista AI, które uczestnik może podłączyć. Wspólna dla przeglądarki i serwera (bez kluczy).
export type Provider = "openai" | "anthropic" | "openrouter";
export type ConnectionMode = Provider | "manual";

export const PROVIDERS: Record<Provider, {
  name: string;
  keyUrl: string;
  keyPrefix: string;
  models: { id: string; label: string; note: string; family: "gpt" | "claude" }[];
}> = {
  // Logowanie jednym kliknięciem (OAuth PKCE). Jedno konto = modele GPT i Claude.
  openrouter: {
    name: "OpenRouter",
    keyUrl: "https://openrouter.ai/settings/keys",
    keyPrefix: "sk-or-",
    models: [
      { id: "openai/gpt-5-mini", label: "GPT-5 mini", note: "szybki i tani", family: "gpt" },
      { id: "openai/gpt-5.5", label: "GPT-5.5", note: "najlepsza jakość GPT", family: "gpt" },
      { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", note: "świetny do tekstów", family: "claude" },
      { id: "anthropic/claude-haiku-5.5", label: "Claude Haiku 5.5", note: "najtańszy", family: "claude" },
      { id: "anthropic/claude-opus-5.5", label: "Claude Opus 5.5", note: "najlepsza jakość Claude", family: "claude" },
    ],
  },
  openai: {
    name: "ChatGPT (OpenAI)",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    models: [
      { id: "gpt-5-mini", label: "GPT-5 mini", note: "dobry stosunek jakości do ceny", family: "gpt" },
      { id: "gpt-5.5", label: "GPT-5.5", note: "najlepsza jakość, droższy", family: "gpt" },
      { id: "gpt-5-nano", label: "GPT-5 nano", note: "najtańszy", family: "gpt" },
    ],
  },
  anthropic: {
    name: "Claude (Anthropic)",
    keyUrl: "https://platform.claude.com/settings/keys",
    keyPrefix: "sk-ant-",
    models: [
      { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "najlepsza jakość, droższy", family: "claude" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "dobry stosunek jakości do ceny", family: "claude" },
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "najtańszy", family: "claude" },
    ],
  },
};

/** AI PLATFORMY (wygląd docelowy, decyzja Pawła 2026-11-27): jeden klucz OpenRouter na serwerze (OPENROUTER_API_KEY),
 *  uczestnik niczego nie łączy i nie korzysta z własnego ChatGPT. Model: NEXT_PUBLIC_AI_MODEL, domyślnie DeepSeek V3.2. */
export const PLATFORM_MODEL = process.env.NEXT_PUBLIC_AI_MODEL || "deepseek/deepseek-v3.2";
export const platformAi = true;

/** Zdjęcia w wiadomości (np. zrzut rozmowy z Instagrama). DeepSeek nie czyta obrazów, więc wiadomość ze zdjęciem
 *  idzie do modelu z obsługą obrazu (OpenRouter, części `image_url`). Sprawdzone na liście modeli OpenRouter 2026-11-27:
 *  google/gemini-2.5-flash wygasa 2026-12-01, dlatego domyślnie Gemini 3.8 Flash. DO ZATWIERDZENIA (Paweł): model i koszt. */
export const VISION_MODEL = process.env.NEXT_PUBLIC_AI_VISION_MODEL || "google/gemini-3.8-flash";
/** Zamiana nagrania na tekst (OpenRouter, część `input_audio` w chat completions). Tani model Gemini z wejściem audio. */
export const AUDIO_MODEL = process.env.NEXT_PUBLIC_AI_AUDIO_MODEL || "google/gemini-3.5-flash-lite";

/** Limity długości jednej wiadomości (przeglądarka i /api/assistant). Długi limit: narzędzia, do których wkleja się transkrypcje. */
export const CHAT_LIMITS = { message: 12_000, longMessage: 40_000 } as const;

/** Limity zdjęć i nagrań. Vercel przyjmuje najwyżej 4,5 MB w jednym zapytaniu. */
export const MEDIA_LIMITS = {
  maxImages: 3,
  imageMaxSide: 1600, // px, dłuższy bok po zmniejszeniu w przeglądarce
  imageMaxBytes: 900_000, // JPEG po kompresji
  imageDataUrlMaxChars: 1_300_000, // ok. 950 kB w base64 (sprawdza serwer)
  audioMaxBytes: 4 * 1024 * 1024, // 4 MB
  requestMaxBytes: 4_500_000,
  dictationMaxSeconds: 180, // nagrywanie zamiast dyktowania (przeglądarki bez rozpoznawania mowy)
} as const;

/** Dopisek w zapisanej wiadomości zamiast samych zdjęć (zdjęć nie zapisujemy; AI wie, że były). */
export const imageNote = (n: number) => `[Dołączone zdjęcia: ${n}. Zdjęć nie zapisujemy.]`;
export const IMAGE_NOTE_RE = /\n*\[Dołączone zdjęcia: (\d+)\. Zdjęć nie zapisujemy\.\]\s*$/;

/** Formaty nagrań: rozszerzenie pliku → format dla OpenRouter (`input_audio.format`). */
export const AUDIO_FORMATS: Record<string, string> = {
  mp3: "mp3", m4a: "m4a", mp4: "m4a", aac: "aac", wav: "wav", ogg: "ogg", oga: "ogg", opus: "ogg", webm: "webm", flac: "flac",
};
export const AUDIO_ACCEPT = "audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus,.webm,.flac";

/** Format nagrania z typu MIME albo z rozszerzenia nazwy (null = nieobsługiwany). */
export function audioFormat(mime: string, name: string): string | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (AUDIO_FORMATS[ext]) return AUDIO_FORMATS[ext];
  const sub = mime.toLowerCase().split(";")[0].replace(/^audio\//, "").replace(/^x-/, "");
  const byMime: Record<string, string> = { mpeg: "mp3", mp3: "mp3", mp4: "m4a", m4a: "m4a", aac: "aac", wav: "wav", wave: "wav", ogg: "ogg", opus: "ogg", webm: "webm", flac: "flac" };
  return byMime[sub] ?? null;
}

/** Z jakiego AI korzysta teraz uczestnik: AI platformy albo własne połączenie (null = jeszcze nic). */
export function activeAi(ai: { mode: ConnectionMode | null; model: string }): { mode: ConnectionMode; model: string } | null {
  if (platformAi) return { mode: "openrouter", model: PLATFORM_MODEL };
  return ai.mode ? { mode: ai.mode, model: ai.model } : null;
}

export function isAllowedModel(provider: Provider, model: string) {
  if (provider === "openrouter" && platformAi && model === PLATFORM_MODEL) return true;
  return PROVIDERS[provider].models.some((m) => m.id === model);
}

export function modelLabel(provider: ConnectionMode | null, model: string) {
  if (!provider || provider === "manual") return "";
  return PROVIDERS[provider].models.find((m) => m.id === model)?.label ?? model;
}
