// Rozmowa z Marketing OS: przeglądarka → nasz serwer → OpenAI → strumień tekstu z powrotem.
// Przeglądarka nigdy nie widzi klucza OpenAI. Treści rozmów nie są logowane ani zapisywane u OpenAI (store: false).
import { APIError } from "openai";
import { AI_CONFIG, getOpenAI } from "@/lib/ai";
import { MARKETING_OS_INSTRUCTIONS } from "@/lib/prompts";

type ChatMessage = { role: "user" | "assistant"; content: string };

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const raw = (body as { messages: unknown[] }).messages;
  const messages: ChatMessage[] = [];
  for (const m of raw.slice(-AI_CONFIG.maxMessages)) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, AI_CONFIG.maxCharsPerMessage);
    if (text) messages.push({ role, content: text });
  }
  return messages.length && messages[messages.length - 1].role === "user" ? messages : null;
}

const text = (msg: string, status: number) =>
  new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const openai = getOpenAI();
  if (!openai) {
    return text("Marketing OS nie jest jeszcze połączony z AI. Dodaj klucz OPENAI_API_KEY w pliku .env.local i uruchom aplikację ponownie.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return text("Nieprawidłowe zapytanie.", 400);
  }
  const messages = parseMessages(body);
  if (!messages) return text("Nieprawidłowa rozmowa: ostatnia wiadomość musi być Twoja.", 400);

  try {
    const stream = await openai.responses.create({
      model: AI_CONFIG.chatModel,
      instructions: MARKETING_OS_INSTRUCTIONS,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      max_output_tokens: AI_CONFIG.maxOutputTokens,
      ...(AI_CONFIG.reasoningEffort ? { reasoning: { effort: AI_CONFIG.reasoningEffort } } : {}),
      prompt_cache_key: "marketing-os-modul-00",
      store: false,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            } else if (event.type === "response.failed" || event.type === "error") {
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

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof APIError) {
      if (err.status === 401) return text("Klucz OpenAI jest nieprawidłowy. Sprawdź OPENAI_API_KEY w .env.local.", 502);
      if (err.status === 429) return text("Limit zapytań albo brak środków na koncie OpenAI. Spróbuj za chwilę.", 503);
      if (err.status === 404) return text(`Model „${AI_CONFIG.chatModel}” jest niedostępny. Zmień OPENAI_MODEL_CHAT w .env.local.`, 502);
    }
    return text("Nie udało się połączyć z AI. Spróbuj jeszcze raz za chwilę.", 502);
  }
}
