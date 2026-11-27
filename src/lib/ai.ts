// Jedyne miejsce, w którym platforma łączy się z zewnętrznym AI uczestnika (ChatGPT albo Claude).
// Wszystko inne (ścieżka, postęp, dokumenty, panel) zostaje u nas.
// Klucz uczestnika jest zaszyfrowany w ciasteczku httpOnly (secure-cookie.ts); nie trafia do logów ani do przeglądarki.
import OpenAI, { APIError as OpenAIError } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Provider } from "@/lib/models";
import { readAiSecret } from "@/lib/secure-cookie";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const LIMITS = { maxMessages: 40, maxCharsPerMessage: 6000, maxContextChars: 24000, maxOutputTokens: 16000 };

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Klucz: najpierw uczestnika (z zaszyfrowanego ciasteczka), a jeśli go nie ma — klucz platformy z .env.local / Vercel.
 *  platform = true: płaci platforma, więc trasa musi sprawdzić, czy pyta zalogowana osoba. */
export async function resolveKey(provider: Provider): Promise<{ key: string | undefined; platform: boolean }> {
  const secret = await readAiSecret();
  if (secret?.provider === provider) return { key: secret.key, platform: false };
  if (provider === "openai") return { key: process.env.OPENAI_API_KEY, platform: true };
  if (provider === "anthropic") return { key: process.env.ANTHROPIC_API_KEY, platform: true };
  return { key: process.env.OPENROUTER_API_KEY, platform: true };
}

const encoder = new TextEncoder();

export async function streamAssistant(opts: {
  provider: Provider;
  model: string;
  apiKey: string;
  staticSystem: string; // stałe instrukcje kroku — buforowane, więc tańsze
  dynamicSystem: string; // kontekst uczestnika: etap, zatwierdzone dokumenty
  messages: ChatMessage[];
  cacheKey: string;
}): Promise<ReadableStream<Uint8Array>> {
  if (opts.provider === "openrouter") return streamOpenRouter(opts);
  return opts.provider === "openai" ? streamOpenAI(opts) : streamClaude(opts);
}

// OpenRouter: jedno konto uczestnika, modele GPT i Claude, API zgodne z OpenAI (chat completions).
async function streamOpenRouter(opts: Parameters<typeof streamAssistant>[0]) {
  const client = new OpenAI({
    apiKey: opts.apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "X-Title": "Marketing OS · Dochodowe Studio" },
  });
  try {
    // provider.data_collection = "deny": OpenRouter wybiera tylko dostawców, którzy nie zapisują i nie trenują na rozmowach
    // (dla DeepSeeka wyklucza to serwery w Chinach). Pole spoza typów SDK OpenAI — OpenRouter je odczytuje.
    const params = {
      model: opts.model,
      messages: [
        { role: "system" as const, content: `${opts.staticSystem}\n\n${opts.dynamicSystem}` },
        ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: LIMITS.maxOutputTokens,
      stream: true as const,
      provider: { data_collection: "deny" },
    };
    const stream = await client.chat.completions.create(params);
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch {
          controller.enqueue(encoder.encode("\n\n[Połączenie z AI zostało przerwane. Spróbuj jeszcze raz.]"));
        } finally {
          controller.close();
        }
      },
    });
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.status === 401) throw new AiError(401, "Połączenie z AI wygasło albo zostało cofnięte. Połącz się ponownie w „Połącz AI”.");
      if (err.status === 402) throw new AiError(402, "Skończyły się środki albo limit klucza AI. Konto OpenRouter trzeba doładować.");
      if (err.status === 429) throw new AiError(429, "Za dużo zapytań naraz. Spróbuj za chwilę.");
      if (err.status === 404 || err.status === 400) throw new AiError(400, `Model „${opts.model}” jest teraz niedostępny. Wybierz inny w „Połącz AI”.`);
    }
    throw new AiError(502, "Nie udało się połączyć z AI. Spróbuj jeszcze raz za chwilę.");
  }
}

async function streamOpenAI(opts: Parameters<typeof streamAssistant>[0]) {
  const client = new OpenAI({ apiKey: opts.apiKey });
  try {
    const stream = await client.responses.create({
      model: opts.model,
      instructions: `${opts.staticSystem}\n\n${opts.dynamicSystem}`,
      input: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: LIMITS.maxOutputTokens,
      reasoning: { effort: "low" },
      prompt_cache_key: opts.cacheKey,
      store: false,
      stream: true,
    });
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") controller.enqueue(encoder.encode(event.delta));
            else if (event.type === "response.failed" || event.type === "error") {
              controller.enqueue(encoder.encode("\n\n[Przerwano odpowiedź. Spróbuj jeszcze raz.]"));
              break;
            }
          }
        } catch {
          controller.enqueue(encoder.encode("\n\n[Połączenie z AI zostało przerwane. Spróbuj jeszcze raz.]"));
        } finally {
          controller.close();
        }
      },
    });
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.status === 401) throw new AiError(401, "Klucz ChatGPT (OpenAI) jest nieprawidłowy. Sprawdź go w ustawieniach AI.");
      if (err.status === 429) throw new AiError(429, "Limit zapytań albo brak środków na koncie OpenAI. Doładuj konto lub spróbuj za chwilę.");
      if (err.status === 404) throw new AiError(400, `Twoje konto OpenAI nie ma dostępu do modelu „${opts.model}”. Wybierz inny model.`);
    }
    throw new AiError(502, "Nie udało się połączyć z ChatGPT. Spróbuj jeszcze raz za chwilę.");
  }
}

async function streamClaude(opts: Parameters<typeof streamAssistant>[0]) {
  const client = new Anthropic({ apiKey: opts.apiKey });
  // Opus i Sonnet: przy odmowie z powodów bezpieczeństwa API samo przełącza się na model zapasowy.
  const withFallback = opts.model !== "claude-haiku-5-5";
  const stream = client.beta.messages.stream({
    model: opts.model,
    max_tokens: LIMITS.maxOutputTokens,
    system: [
      { type: "text", text: opts.staticSystem },
      { type: "text", text: opts.dynamicSystem },
    ],
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    cache_control: { type: "ephemeral" },
    output_config: { effort: "low" },
    ...(withFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });

  // Czekamy na pierwszy znak życia, żeby błędy klucza zgłosić jako normalny komunikat, a nie urwany strumień.
  const iterator = stream[Symbol.asyncIterator]();
  let first: IteratorResult<unknown>;
  try {
    first = await iterator.next();
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AiError(401, "Klucz Claude jest nieprawidłowy. Sprawdź go w ustawieniach AI.");
    if (err instanceof Anthropic.PermissionDeniedError) throw new AiError(403, "Twoje konto Claude nie ma dostępu do tego modelu. Wybierz inny model.");
    if (err instanceof Anthropic.RateLimitError) throw new AiError(429, "Limit zapytań albo brak środków na koncie Claude. Doładuj konto lub spróbuj za chwilę.");
    if (err instanceof Anthropic.NotFoundError) throw new AiError(400, `Model „${opts.model}” jest niedostępny. Wybierz inny model.`);
    throw new AiError(502, "Nie udało się połączyć z Claude. Spróbuj jeszcze raz za chwilę.");
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const handle = (event: unknown) => {
        const e = event as { type?: string; delta?: { type?: string; text?: string } };
        if (e.type === "content_block_delta" && e.delta?.type === "text_delta" && e.delta.text) {
          controller.enqueue(encoder.encode(e.delta.text));
        }
      };
      try {
        if (!first.done) handle(first.value);
        for (;;) {
          const next = await iterator.next();
          if (next.done) break;
          handle(next.value);
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n[Asystent nie może pomóc w tej sprawie. Zadaj pytanie inaczej albo wróć do zadania z tego kroku.]"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n[Odpowiedź była za długa i została ucięta. Poproś o krótszą wersję.]"));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n[Połączenie z Claude zostało przerwane. Spróbuj jeszcze raz.]"));
      } finally {
        controller.close();
      }
    },
  });
}
