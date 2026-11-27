// Asystent Marketing OS: przeglądarka → nasz serwer → AI (platformy albo uczestnika) → strumień tekstu.
// Dwa tryby: krok ścieżki (`stepId`) albo szybka akcja z /narzedzia (`tool`, instrukcja narzędzia tylko na serwerze).
import { AiError, LIMITS, resolveKey, streamAssistant, type ChatMessage } from "@/lib/ai";
import { isAllowedModel, platformAi, type Provider } from "@/lib/models";
import { signedIn } from "@/lib/supabase/server";
import { buildSystem, buildToolSystem } from "@/lib/assistant";
import { findTool } from "@/lib/tools";

const plain = (msg: string, status: number) =>
  new Response(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

type Body = {
  provider?: unknown;
  model?: unknown;
  stepId?: unknown;
  tool?: unknown; // id szybkiej akcji z src/lib/tools.ts; gdy jest, stepId i mode są pomijane
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
  if (!body || typeof body !== "object" || Array.isArray(body)) return plain("Nieprawidłowe zapytanie.", 400);

  const provider = body.provider;
  if (provider !== "openai" && provider !== "anthropic" && provider !== "openrouter") return plain("Najpierw podłącz swoje AI (ChatGPT albo Claude).", 400);
  const model = typeof body.model === "string" ? body.model : "";
  if (!isAllowedModel(provider as Provider, model)) return plain("Wybierz model z listy w ustawieniach AI.", 400);

  // Szybka akcja: tylko znane id z tools.ts. Każda inna wartość pola `tool` (pusta, liczba, null, nieznane id) → 400.
  // Sprawdzane przed kluczem i logowaniem: błędne zapytanie nie kosztuje nawet sprawdzenia sesji.
  const tool = body.tool === undefined ? null : typeof body.tool === "string" ? (findTool(body.tool) ?? null) : null;
  if (body.tool !== undefined && !tool) return plain("Nieznane narzędzie.", 400);

  const { key: apiKey, platform } = await resolveKey(provider);
  if (!apiKey) {
    return platformAi
      ? plain("Asystent jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.", 503)
      : plain("Twoje AI nie jest połączone. Wejdź w „Połącz AI” i zaloguj się.", 401);
  }
  // Za AI platformy płacimy my: rozmawiać mogą tylko zalogowani uczestnicy.
  if (platform && !(await signedIn())) return plain("Zaloguj się, żeby rozmawiać z asystentem.", 401);

  const stepId = typeof body.stepId === "string" ? body.stepId : "";
  const mode = !tool && body.mode === "document" ? "document" : "chat";
  const ctx = {
    stage: typeof body.context?.stage === "string" ? body.context.stage.slice(0, 200) : undefined,
    documents: parseDocuments(body.context?.documents),
  };
  const system = tool ? buildToolSystem(tool, ctx) : buildSystem(stepId, mode, ctx);
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
      cacheKey: tool ? `marketing-os-tool-${tool.id}` : `marketing-os-${stepId}-${mode}`,
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AiError) return plain(err.message, err.status);
    return plain("Coś poszło nie tak po stronie serwera. Spróbuj jeszcze raz.", 500);
  }
}
