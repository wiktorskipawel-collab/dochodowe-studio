// Lista AI, które uczestnik może podłączyć. Wspólna dla przeglądarki i serwera (bez kluczy).
export type Provider = "openai" | "anthropic";
export type ConnectionMode = Provider | "manual";

export const PROVIDERS: Record<Provider, {
  name: string;
  keyUrl: string;
  keyPrefix: string;
  models: { id: string; label: string; note: string }[];
}> = {
  openai: {
    name: "ChatGPT (OpenAI)",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    models: [
      { id: "gpt-5-mini", label: "GPT-5 mini", note: "dobry stosunek jakości do ceny" },
      { id: "gpt-5.5", label: "GPT-5.5", note: "najlepsza jakość, droższy" },
      { id: "gpt-5-nano", label: "GPT-5 nano", note: "najtańszy" },
    ],
  },
  anthropic: {
    name: "Claude (Anthropic)",
    keyUrl: "https://platform.claude.com/settings/keys",
    keyPrefix: "sk-ant-",
    models: [
      { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "najlepsza jakość, droższy" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "dobry stosunek jakości do ceny" },
      { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "najtańszy" },
    ],
  },
};

export function isAllowedModel(provider: Provider, model: string) {
  return PROVIDERS[provider].models.some((m) => m.id === model);
}
