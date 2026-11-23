// Start logowania „jednym kliknięciem”: OAuth PKCE w OpenRouter (docs: openrouter.ai/docs/guides/overview/auth/oauth).
// Weryfikator PKCE i `state` zostają zaszyfrowane w ciasteczku httpOnly na 10 minut.
import { createHash, randomBytes } from "node:crypto";
import { isAllowedModel } from "@/lib/models";
import { writePkce } from "@/lib/secure-cookie";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("model") ?? "";
  const model = isAllowedModel("openrouter", requested) ? requested : "openai/gpt-5-mini";

  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");
  await writePkce({ verifier, state, model });

  const auth = new URL("https://openrouter.ai/auth");
  auth.searchParams.set("callback_url", `${url.origin}/api/polacz/openrouter/callback`);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");
  auth.searchParams.set("state", state);
  auth.searchParams.set("key_label", "Marketing OS · Dochodowe Studio");
  auth.searchParams.set("limit", "10"); // bezpiecznik: klucz wyda maksymalnie 10 USD, uczestnik może to zmienić w OpenRouter
  return Response.redirect(auth.toString(), 302);
}
