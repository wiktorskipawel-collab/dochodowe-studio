// Jedna odpowiedź AI w formacie JSON (bez strumienia) — np. „wyciągnij pola z ogłoszenia”.
// Uzupełnia src/lib/ai.ts (tam jest rozmowa strumieniowa); klucz wybiera resolveKey z ai.ts, model PLATFORM_MODEL.
// TYLKO SERWER (importują go wyłącznie trasy w src/app/api). Nie zapisujemy ani nie logujemy treści zapytań i odpowiedzi.
import OpenAI, { APIError as OpenAIError } from "openai";
import { AiError, type UsageReport } from "@/lib/ai";

export type JsonRequest = {
  apiKey: string;
  model: string;
  system: string; // instrukcja (stała)
  user: string; // dane do przetworzenia (np. treść ogłoszenia)
  maxTokens?: number;
  timeoutMs?: number;
  onUsage?: UsageReport; // zużyte tokeny (licznik miesięczny, src/lib/usage.ts); wołane, gdy AI odpowiedziało
};

/** Wyciąga obiekt JSON z odpowiedzi modelu: sam JSON, JSON w bloku ```json``` albo pierwszy {...} w tekście. */
export function parseJsonObject(text: string): Record<string, unknown> | null {
  const candidates: string[] = [text.trim()];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1].trim());
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(text.slice(start, end + 1));
  for (const c of candidates) {
    try {
      const v: unknown = JSON.parse(c);
      if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    } catch {
      // następny kandydat
    }
  }
  return null;
}

/** OpenRouter (API zgodne z OpenAI), odpowiedź jako obiekt JSON. Błędy klucza/limitu → AiError z polskim komunikatem. */
export async function completeJson(req: JsonRequest): Promise<Record<string, unknown>> {
  const client = new OpenAI({
    apiKey: req.apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "X-Title": "Marketing OS · Dochodowe Studio" },
    timeout: req.timeoutMs ?? 45_000,
    maxRetries: 1,
  });
  // provider.data_collection = "deny": tylko dostawcy, którzy nie zapisują i nie trenują na zapytaniach.
  // Pole spoza typów SDK OpenAI — OpenRouter je odczytuje (tak samo jak w ai.ts).
  const params = {
    model: req.model,
    messages: [
      { role: "system" as const, content: `${req.system}\n\nOdpowiedz wyłącznie jednym obiektem JSON, bez komentarzy i bez bloku kodu.` },
      { role: "user" as const, content: req.user },
    ],
    max_tokens: req.maxTokens ?? 2000,
    temperature: 0,
    response_format: { type: "json_object" as const },
    stream: false as const,
    provider: { data_collection: "deny" },
  };
  let text: string;
  try {
    const res = await client.chat.completions.create(params);
    text = res.choices[0]?.message?.content ?? "";
    // OpenRouter zawsze zwraca `usage`; gdy go brak — szacunek ok. 3,5 znaku na token (wejście + odpowiedź).
    const total = res.usage?.total_tokens ?? 0;
    try {
      req.onUsage?.(total > 0 ? total : Math.ceil((params.messages[0].content.length + req.user.length + text.length) / 3.5));
    } catch {
      // licznik nie może zepsuć odpowiedzi
    }
  } catch (err) {
    if (err instanceof OpenAIError) {
      if (err.status === 401) throw new AiError(503, "Asystent jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.");
      if (err.status === 402) throw new AiError(503, "Asystent jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.");
      if (err.status === 429) throw new AiError(429, "Za dużo zapytań naraz. Spróbuj za chwilę.");
    }
    throw new AiError(502, "Nie udało się połączyć z AI. Spróbuj jeszcze raz za chwilę.");
  }
  const obj = parseJsonObject(text);
  if (!obj) throw new AiError(502, "AI zwróciło odpowiedź w złym formacie. Spróbuj jeszcze raz.");
  return obj;
}
