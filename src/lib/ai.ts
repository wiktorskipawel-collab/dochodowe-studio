// Jedyne miejsce, w którym platforma łączy się z zewnętrznym AI uczestnika (ChatGPT albo Claude).
// Wszystko inne (ścieżka, postęp, dokumenty, panel) zostaje u nas.
// Klucz uczestnika przychodzi z jego przeglądarki przy każdym zapytaniu i NIE jest nigdzie zapisywany ani logowany.
import OpenAI, { APIError as OpenAIError } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Provider } from "@/lib/models";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const LIMITS = { maxMessages: 40, maxCharsPerMessage: 6000, maxContextChars: 24000, maxOutputTokens: 16000 };

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Klucz: najpierw uczestnika (BYOK), a jeśli go nie podał — klucz platformy z .env.local (np. na pokaz dla Bartka). */
export function resolveKey(provider: Provider, userKey?: string) {
  const fromUser = userKey?.trim();
  if (fromUser) return fromUser;
  return provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
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
  return opts.provider === "openai" ? streamOpenAI(opts) : streamClaude(opts);
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
