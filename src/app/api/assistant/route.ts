// Asystent Marketing OS: przeglądarka → nasz serwer → AI uczestnika (ChatGPT albo Claude) → strumień tekstu.
import { AiError, LIMITS, resolveKey, streamAssistant, type ChatMessage } from "@/lib/ai";
import { isAllowedModel, type Provider } from "@/lib/models";
import { buildSystem } from "@/lib/assistant";

const plain = (msg: string, status: number) =>
  new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

type Body = {
  provider?: unknown;
  model?: unknown;
  stepId?: unknown;
  mode?: unknown; // "chat" | "document"
  messages?: unknown;
  context?: { stage?: unknown; documents?: unknown };
};

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessage[] = [];
  for (const m of raw.slice(-LIMITS.maxMessages)) {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, LIMITS.maxCharsPerMessage);
    if (text) out.push({ role, content: text });
  }
  // Rozmowa musi zaczynać się od uczestnika — powitanie asystenta dokładamy do instrukcji, nie do historii.
  while (out.length && out[0].role !== "user") out.shift();
  return out;
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
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return plain("Nieprawidłowe zapytanie.", 400);
  }

  const provider = body.provider;
  if (provider !== "openai" && provider !== "anthropic" && provider !== "openrouter") return plain("Najpierw podłącz swoje AI (ChatGPT albo Claude).", 400);
  const model = typeof body.model === "string" ? body.model : "";
  if (!isAllowedModel(provider as Provider, model)) return plain("Wybierz model z listy w ustawieniach AI.", 400);

  const apiKey = await resolveKey(provider);
  if (!apiKey) return plain("Twoje AI nie jest połączone. Wejdź w „Połącz AI” i zaloguj się.", 401);

  const stepId = typeof body.stepId === "string" ? body.stepId : "";
  const mode = body.mode === "document" ? "document" : "chat";
  const system = buildSystem(stepId, mode, {
    stage: typeof body.context?.stage === "string" ? body.context.stage.slice(0, 200) : undefined,
    documents: parseDocuments(body.context?.documents),
  });
  if (!system) return plain("Nieznany krok ścieżki.", 400);

  const messages = parseMessages(body.messages);
  if (!messages) return plain("Nieprawidłowa rozmowa.", 400);
  if (mode === "document") {
    messages.push({ role: "user", content: "Na podstawie naszej rozmowy przygotuj teraz gotowy dokument dokładnie według szablonu z instrukcji. Bez wstępu i komentarzy." });
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") return plain("Ostatnia wiadomość musi być Twoja.", 400);

  try {
    const stream = await streamAssistant({
      provider,
      model,
      apiKey,
      staticSystem: system.staticText,
      dynamicSystem: system.dynamicText,
      messages,
      cacheKey: `marketing-os-${stepId}-${mode}`,
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AiError) return plain(err.message, err.status);
    return plain("Coś poszło nie tak po stronie serwera. Spróbuj jeszcze raz.", 500);
  }
}
