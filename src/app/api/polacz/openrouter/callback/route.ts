// Powrót z OpenRouter: sprawdzamy `state`, wymieniamy kod na klucz (po stronie serwera) i zapisujemy go zaszyfrowany.
import { takePkce, writeAiSecret } from "@/lib/secure-cookie";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (params: Record<string, string>) => Response.redirect(`${url.origin}/polacz?${new URLSearchParams(params)}`, 302);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const pkce = await takePkce();
  if (!code) return back({ blad: "anulowano" });
  if (!pkce || !state || state !== pkce.state) return back({ blad: "sesja" });

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: pkce.verifier, code_challenge_method: "S256" }),
      cache: "no-store",
    });
    if (!res.ok) return back({ blad: res.status === 403 ? "kod" : "wymiana" });
    const data = (await res.json()) as { key?: unknown };
    if (typeof data.key !== "string" || !data.key.startsWith("sk-or-")) return back({ blad: "wymiana" });
    await writeAiSecret({ provider: "openrouter", key: data.key });
    return back({ polaczono: "openrouter", model: pkce.model });
  } catch {
    return back({ blad: "siec" });
  }
}
