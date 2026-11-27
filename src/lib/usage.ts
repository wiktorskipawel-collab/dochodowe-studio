// Licznik tokenów AI platformy i miesięczny limit na osobę. TYLKO SERWER (trasy w src/app/api).
// Baza: tabela public.ai_usage + funkcje get_ai_usage / add_ai_usage (supabase/migrations/0003_ai_usage.sql).
// - Przed wywołaniem AI trasa woła aiAccess(): to samo sprawdzenie logowania co signedIn() w supabase/server.ts
//   (getUser, odświeżenie sesji w ciasteczkach) + odczyt zużycia w tym miesiącu. Po przekroczeniu limitu → 429.
// - Po odpowiedzi trasa zapisuje realne zużycie (usage z OpenRouter; gdy go brak, szacunek z ai.ts) przez after().
//   Zapis nie blokuje odpowiedzi; błąd zapisu ignorujemy po cichu (bez logów i bez treści rozmów).
// - Gdy tabeli jeszcze nie ma (SQL nieuruchomiony) albo baza nie odpowiada: wszystko działa jak dawniej, bez licznika.
// Zmiana licznika jest możliwa tylko przez add_ai_usage (tylko zwiększa), więc z przeglądarki nie da się go cofnąć.
import "server-only";
import { cookies } from "next/headers";
import { after } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/** Domyślny miesięczny limit tokenów na osobę. DO ZATWIERDZENIA (Paweł). Zmiana bez wdrożenia kodu: AI_MONTHLY_TOKEN_LIMIT. */
export const DEFAULT_MONTHLY_TOKEN_LIMIT = 2_000_000;
/** Najwięcej tokenów z jednego wywołania (tyle samo przyjmuje add_ai_usage w SQL). */
const MAX_TOKENS_PER_CALL = 200_000;
/** Jak długo po odpowiedzi czekamy na koniec strumienia, zanim zapis zostanie pominięty. */
const MAX_WAIT_MS = 290_000;

export function monthlyLimit(): number {
  const raw = Number((process.env.AI_MONTHLY_TOKEN_LIMIT ?? "").replace(/[\s_]/g, ""));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MONTHLY_TOKEN_LIMIT;
}

/** Bieżący miesiąc 'YYYY-MM' w czasie polskim (tak samo liczy baza). */
function currentMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}`;
}

/** Odnowienie limitu: 1. dzień następnego miesiąca. date = 'YYYY-MM-DD', text = „1 grudnia 2026”. */
export function renewal(month: string): { date: string; text: string } {
  const [y, m] = (/^\d{4}-\d{2}$/.test(month) ? month : currentMonth()).split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const text = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(ny, nm - 1, 1, 12)));
  return { date: `${ny}-${String(nm).padStart(2, "0")}-01`, text };
}

const supabaseEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
};

type Env = NonNullable<ReturnType<typeof supabaseEnv>>;

/** Zalogowana osoba z ciasteczek: getUser (sprawdza sesję w Supabase, w razie potrzeby ją odświeża) → token dostępu. */
async function sessionToken(env: Env): Promise<string | null> {
  const store = await cookies();
  const sb = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // odświeżenie sesji zapisze przeglądarka przy następnym wejściu
        }
      },
    },
  });
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return null;
  const { data: s } = await sb.auth.getSession();
  return s.session?.access_token ?? null;
}

/** Klient bazy z samym tokenem osoby (bez odświeżania sesji): bezpieczny także po wysłaniu odpowiedzi. */
const tokenClient = (env: Env, token: string) =>
  createClient(env.url, env.key, { accessToken: async () => token });

type DbClient = ReturnType<typeof tokenClient>;
type Row = { month: string; tokens: number; requests: number };

/** Zużycie w tym miesiącu. error: brak tabeli/funkcji (SQL nieuruchomiony) albo baza nie odpowiada. */
async function readUsage(db: DbClient): Promise<{ row: Row } | { error: "missing" | "auth" | "other" }> {
  try {
    const { data, error } = await db.rpc("get_ai_usage").abortSignal(AbortSignal.timeout(5000));
    if (error) {
      const code = String(error.code ?? "");
      // PGRST202/PGRST205: funkcji/tabeli nie ma w schemacie; 42883/42P01: to samo z Postgresa; PGRST30x: zły/wygasły token
      if (["PGRST202", "PGRST205", "42883", "42P01"].includes(code)) return { error: "missing" };
      if (code.startsWith("PGRST30")) return { error: "auth" };
      return { error: "other" };
    }
    const r = (Array.isArray(data) ? data[0] : data) as Partial<Row> | null;
    return { row: { month: typeof r?.month === "string" ? r.month : currentMonth(), tokens: Number(r?.tokens ?? 0) || 0, requests: Number(r?.requests ?? 0) || 0 } };
  } catch {
    return { error: "other" };
  }
}

/** Dopisuje zużycie (tylko zwiększa). Każdy błąd = cisza: zapis nie może popsuć odpowiedzi. */
async function writeUsage(db: DbClient, tokens: number): Promise<void> {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  const p_tokens = Math.min(MAX_TOKENS_PER_CALL, Math.max(1, Math.ceil(tokens)));
  try {
    await db.rpc("add_ai_usage", { p_tokens }).abortSignal(AbortSignal.timeout(5000));
  } catch {
    // brak tabeli, sieć, wygasły token: pomijamy ten jeden zapis
  }
}

// ---------- DLA STRONY USTAWIEŃ (GET /api/usage) ----------

export type UsageInfo =
  | { status: "ok"; tokens: number; requests: number; limit: number; month: string; renewsOn: string; renewsText: string }
  | { status: "not-configured"; limit: number; renewsOn: string; renewsText: string }
  | { status: "error"; limit: number; renewsOn: string; renewsText: string }
  | { status: "signed-out" };

/** Zużycie zalogowanej osoby w tym miesiącu i limit z serwera. */
export async function getUsage(): Promise<UsageInfo> {
  const limit = monthlyLimit();
  const env = supabaseEnv();
  const { date: renewsOn, text: renewsText } = renewal(currentMonth());
  if (!env) return { status: "not-configured", limit, renewsOn, renewsText }; // prototyp bez bazy: licznika nie ma
  const token = await sessionToken(env);
  if (!token) return { status: "signed-out" };
  const res = await readUsage(tokenClient(env, token));
  if ("error" in res) {
    if (res.error === "auth") return { status: "signed-out" };
    if (res.error === "missing") return { status: "not-configured", limit, renewsOn, renewsText };
    return { status: "error", limit, renewsOn, renewsText };
  }
  const r = renewal(res.row.month);
  return { status: "ok", tokens: res.row.tokens, requests: res.row.requests, limit, month: res.row.month, renewsOn: r.date, renewsText: r.text };
}

// ---------- DLA TRAS AI ----------

export type AiAccess =
  | { ok: true; addUsage: (tokens: number) => Promise<void> }
  | { ok: false; reason: "signed-out" }
  | { ok: false; reason: "limit"; message: string };

const noop = async () => {};

/** Czy ta osoba może teraz użyć AI platformy: zalogowana i poniżej miesięcznego limitu.
 *  Bez kluczy Supabase (prototyp lokalny) zawsze tak, bez licznika — jak signedIn(). */
export async function aiAccess(): Promise<AiAccess> {
  const env = supabaseEnv();
  if (!env) return { ok: true, addUsage: noop };
  const token = await sessionToken(env);
  if (!token) return { ok: false, reason: "signed-out" };
  const db = tokenClient(env, token);
  const res = await readUsage(db);
  // Brak tabeli (SQL nieuruchomiony) albo chwilowy błąd bazy: działamy jak dawniej, bez licznika.
  if ("error" in res) return { ok: true, addUsage: res.error === "missing" ? noop : (t) => writeUsage(db, t) };
  if (res.row.tokens >= monthlyLimit()) {
    const { text } = renewal(res.row.month);
    const thisYear = res.row.month.slice(0, 4);
    const when = text.endsWith(thisYear) ? text.slice(0, -thisYear.length).trim() : text;
    return { ok: false, reason: "limit", message: `Wykorzystano miesięczny limit asystenta. Odnowi się ${when}.` };
  }
  return { ok: true, addUsage: (t) => writeUsage(db, t) };
}

/** Zapis zużycia po odpowiedzi. report(tokens) woła ai.ts na końcu strumienia (raz), cancel() — trasa, gdy AI w ogóle
 *  nie odpowiedziało. after() pilnuje, żeby serwer dokończył zapis po wysłaniu odpowiedzi. */
export function recordUsage(addUsage: (tokens: number) => Promise<void>) {
  let settle: (tokens: number) => void = () => {};
  const done = new Promise<number>((resolve) => (settle = resolve));
  after(async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tokens = await Promise.race([done, new Promise<number>((resolve) => (timer = setTimeout(() => resolve(0), MAX_WAIT_MS)))]);
    clearTimeout(timer);
    if (tokens > 0) await addUsage(tokens).catch(() => {});
  });
  return { report: (tokens: number) => settle(tokens), cancel: () => settle(0) };
}
