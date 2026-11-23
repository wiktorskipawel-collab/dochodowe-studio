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

export function isAllowedModel(provider: Provider, model: string) {
  return PROVIDERS[provider].models.some((m) => m.id === model);
}

export function modelLabel(provider: ConnectionMode | null, model: string) {
  if (!provider || provider === "manual") return "";
  return PROVIDERS[provider].models.find((m) => m.id === model)?.label ?? model;
}
