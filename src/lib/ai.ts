// Jedyne miejsce, w którym platforma łączy się z zewnętrznym AI (OpenAI).
// Wszystko inne (dane, postęp, karty, panel) zostaje na naszych serwerach.
// Klucz jest tylko po stronie serwera (.env.local) i nigdy nie trafia do przeglądarki.
import OpenAI from "openai";
import type { ReasoningEffort } from "openai/resources/shared";

export const AI_CONFIG = {
  provider: "openai" as const,
  chatModel: process.env.OPENAI_MODEL_CHAT || "gpt-5-mini",
  writerModel: process.env.OPENAI_MODEL_WRITER || "gpt-5-mini",
  reasoningEffort: (process.env.OPENAI_REASONING_EFFORT || "low") as ReasoningEffort,
  maxOutputTokens: 4000,
  // Ograniczenia kosztów na jedno zapytanie
  maxMessages: 24,
  maxCharsPerMessage: 4000,
};

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client ??= new OpenAI({ apiKey });
  return client;
}
