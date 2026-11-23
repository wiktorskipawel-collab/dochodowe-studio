// Szyfrowane ciasteczka (AES-GCM) tylko po stronie serwera — tu trzymamy klucz AI uczestnika.
// Przeglądarka dostaje ciasteczko httpOnly, którego JavaScript strony nie może odczytać.
// Docelowo (Supabase) klucz trafi zaszyfrowany do bazy.
import { cookies } from "next/headers";

export const AI_COOKIE = "mos_ai";
export const PKCE_COOKIE = "mos_pkce";

const enc = new TextEncoder();
const dec = new TextDecoder();
let cachedKey: Promise<CryptoKey> | null = null;

function secret(): string {
  const s = process.env.COOKIE_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") throw new Error("Brak COOKIE_SECRET (min. 32 znaki) w ustawieniach serwera.");
  return "dev-only-marketing-os-cookie-secret-change-me"; // tylko lokalnie
}

function key() {
  cachedKey ??= crypto.subtle.digest("SHA-256", enc.encode(secret())).then((raw) =>
    crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]),
  );
  return cachedKey;
}

const b64u = (buf: Uint8Array) => Buffer.from(buf).toString("base64url");
const unb64u = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));

export async function seal(data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), enc.encode(JSON.stringify(data))));
  return `${b64u(iv)}.${b64u(ct)}`;
}

export async function unseal<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const [iv, ct] = token.split(".");
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await key(), unb64u(ct));
    return JSON.parse(dec.decode(plain)) as T;
  } catch {
    return null;
  }
}

export type AiSecret = { provider: "openai" | "anthropic" | "openrouter"; key: string };

const opts = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge });

export async function readAiSecret() {
  const store = await cookies();
  return unseal<AiSecret>(store.get(AI_COOKIE)?.value);
}

export async function writeAiSecret(secretData: AiSecret) {
  const store = await cookies();
  store.set(AI_COOKIE, await seal(secretData), opts(60 * 60 * 24 * 180));
}

export async function clearAiSecret() {
  const store = await cookies();
  store.delete(AI_COOKIE);
}

export async function writePkce(data: { verifier: string; state: string; model: string }) {
  const store = await cookies();
  store.set(PKCE_COOKIE, await seal(data), opts(600));
}

export async function takePkce() {
  const store = await cookies();
  const data = await unseal<{ verifier: string; state: string; model: string }>(store.get(PKCE_COOKIE)?.value);
  store.delete(PKCE_COOKIE);
  return data;
}
