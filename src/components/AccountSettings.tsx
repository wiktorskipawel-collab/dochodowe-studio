"use client";

// Strona „Ustawienia konta” (/ustawienia): konto, hasło, wykorzystanie AI w tym miesiącu, preferencje, kontakt, wylogowanie.
// - Hasło zmienia przeglądarka WPROST w Supabase (supabase.auth.updateUser): nie przechodzi przez nasze API,
//   nie jest nigdzie zapisywane ani logowane; po udanej zmianie pola się czyszczą.
// - Licznik AI czyta GET /api/usage (zużycie z bazy i limit z serwera, src/lib/usage.ts). Limit pilnuje serwer.
// - Tryb demo i wersja bez bazy kont: hasło nieaktywne z wyjaśnieniem, imię zmienia się tylko w tej przeglądarce.
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarClockIcon, CheckIcon, CircleIcon, CompassIcon, EyeIcon, EyeOffIcon, GaugeIcon, ImageIcon, InfoIcon, KeyRoundIcon, LogOutIcon,
  MailIcon, MessagesSquareIcon, MicIcon, RefreshCwIcon, SlidersHorizontalIcon, SparklesIcon, UserRoundIcon, Volume2Icon, VolumeXIcon,
  type LucideIcon,
} from "lucide-react";
import { useJourney } from "@/lib/store";
import { getSupabase, supabaseEnabled } from "@/lib/supabase/client";
import type { UsageInfo } from "@/lib/usage";
import { startTour } from "@/components/Onboarding";
import { useSoundSetting } from "@/components/SoundSetting";
import { ContactBubble } from "@/components/ContactBubble";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/** Orientacyjny koszt jednej odpowiedzi asystenta (instrukcja kroku + dokumenty + rozmowa + odpowiedź). DO ZATWIERDZENIA (Paweł). */
const TOKENS_PER_ANSWER = 8_000;
const MIN_PASSWORD = 8;
const MAX_NAME = 60;

const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-bold text-brand-ink shadow-[0_12px_30px_-12px_rgba(114,196,28,.6)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100";
const BTN_GHOST =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/85 hover:border-brand/50 hover:text-white";

const compact = new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("pl-PL");

/** 1 zapytanie, 2–4 zapytania, 5+ zapytań (12–14 zapytań). */
function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const d = n % 10;
  const t = n % 100;
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
}

// ---------- WSPÓLNE ----------

function Section({ id, icon: Icon, title, desc, delay = 0, children }: { id: string; icon: LucideIcon; title: string; desc?: ReactNode; delay?: number; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id={id}
      aria-labelledby={`${id}-h`}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, delay }}
      className="glass-card scroll-mt-20 rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-h`} className="text-lg font-bold leading-tight">{title}</h2>
          {desc ? <p className="mt-0.5 text-sm text-white/65">{desc}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "good" }) {
  const map = {
    info: "border-white/15 bg-white/[0.04] text-white/80",
    warn: "border-amber-300/40 bg-amber-300/10 text-amber-100",
    good: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  } as const;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${map[tone]}`}>
      <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Błąd Supabase Auth → prosty komunikat. Rozpoznajemy po kodzie (supabase-js 2.x), a dla starszych odpowiedzi po treści. */
type AuthErr = { code?: string; message?: string; status?: number; name?: string; reasons?: string[] };

function authMessage(err: AuthErr, what: "password" | "name"): string {
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  if (code === "same_password" || msg.includes("different from the old password")) return "Nowe hasło musi się różnić od obecnego.";
  if (code === "weak_password" || err.name === "AuthWeakPasswordError") {
    if (err.reasons?.includes("pwned")) return "To hasło wyciekło kiedyś z innej strony i jest na listach znanych haseł. Wybierz inne.";
    if (err.reasons?.includes("length")) return "Hasło jest za krótkie. Wydłuż je i spróbuj jeszcze raz.";
    return "Hasło jest za słabe. Dodaj wielkie i małe litery, cyfry i znak specjalny albo wydłuż je.";
  }
  if (["reauthentication_needed", "reauth_nonce_missing", "reauthentication_not_valid"].includes(code) || msg.includes("reauthentication")) {
    return "Ze względów bezpieczeństwa zmiana hasła wymaga świeżego logowania. Wyloguj się, zaloguj ponownie i od razu zmień hasło.";
  }
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || err.status === 429) return "Za dużo prób w krótkim czasie. Spróbuj ponownie za kilka minut.";
  if (["session_not_found", "user_not_found", "session_expired", "refresh_token_not_found"].includes(code) || err.name === "AuthSessionMissingError") {
    return "Sesja wygasła. Zaloguj się ponownie i spróbuj jeszcze raz.";
  }
  if (err.name === "AuthRetryableFetchError" || (typeof navigator !== "undefined" && !navigator.onLine)) return "Brak połączenia z internetem. Sprawdź połączenie i spróbuj jeszcze raz.";
  return what === "password" ? "Nie udało się zmienić hasła. Spróbuj jeszcze raz za chwilę." : "Nie udało się zapisać imienia. Spróbuj jeszcze raz za chwilę.";
}

// ---------- KONTO ----------

function AccountSection({ cloud, providers }: { cloud: boolean; providers: string[] | null }) {
  const { state, setProfileName } = useJourney();
  const saved = state.profile?.name ?? "";
  const email = state.profile?.email ?? "";
  const [name, setName] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameId = useId();
  const emailId = useId();
  const clean = name.replace(/\s+/g, " ").trim();
  const dirty = clean !== saved;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!clean) return setError("Wpisz imię.");
    if (clean.length > MAX_NAME) return setError(`Imię może mieć najwyżej ${MAX_NAME} znaków.`);
    setError(null);
    setBusy(true);
    try {
      const sb = cloud ? getSupabase() : null;
      if (sb) {
        const { error: err } = await sb.auth.updateUser({ data: { full_name: clean } });
        if (err) {
          setError(authMessage(err, "name"));
          return;
        }
      }
      setProfileName(clean);
      setName(clean);
      toast("Imię zapisane", { description: cloud ? "Zobaczysz je w menu i w powitaniach." : "Zmiana zostaje w tej przeglądarce." });
    } catch {
      setError("Brak połączenia z internetem. Sprawdź połączenie i spróbuj jeszcze raz.");
    } finally {
      setBusy(false);
    }
  }

  const login = providers?.length
    ? providers.map((p) => (p === "email" ? "e-mail i hasło" : p === "google" ? "Google" : p)).join(" · ")
    : null;

  return (
    <form onSubmit={save} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-semibold">Imię</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={nameId}
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            autoComplete="given-name"
            maxLength={MAX_NAME + 20}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${nameId}-err` : `${nameId}-hint`}
            className="h-11 shrink-0 text-base sm:flex-1"
          />
          <button type="submit" disabled={!dirty || busy} className={BTN_PRIMARY}>
            {busy ? <Spinner /> : <CheckIcon className="size-4" aria-hidden="true" />}
            Zapisz imię
          </button>
        </div>
        {error ? (
          <p id={`${nameId}-err`} role="alert" className="text-sm text-red-300">{error}</p>
        ) : (
          <p id={`${nameId}-hint`} className="text-xs text-white/55">Tak zwraca się do Ciebie asystent i tak podpisujemy Twoje konto w menu.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={emailId} className="text-sm font-semibold">E-mail <span className="font-normal text-white/55">(tylko do podglądu)</span></label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" aria-hidden="true" />
          <Input id={emailId} value={email} readOnly aria-readonly="true" aria-describedby={`${emailId}-hint`} className="h-11 cursor-default pl-9 text-base text-white/80" />
        </div>
        <p id={`${emailId}-hint`} className="text-xs text-white/55">
          Adres, którym się logujesz. Tutaj go nie zmienisz.{login ? <> Logowanie: <span className="font-semibold text-white/75">{login}</span>.</> : null}
        </p>
      </div>
    </form>
  );
}

// ---------- HASŁO ----------

const COMMON = /^(password|haslo|hasło|qwerty|qwertyuiop|admin|letmein|12345678|123456789|1234567890|11111111|00000000|abcd1234|zaq12wsx)$/i;

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** Siła hasła 0–4: długość, wielkie i małe litery, cyfra, znak specjalny. Popularne hasła = słabe. */
function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: "" };
  if (pw.length < MIN_PASSWORD) return { score: 1, label: "Za krótkie" };
  if (COMMON.test(pw) || /^(.)\1+$/.test(pw)) return { score: 1, label: "Słabe (popularne hasło)" };
  const points = [pw.length >= 12, /\p{Ll}/u.test(pw) && /\p{Lu}/u.test(pw), /\d/.test(pw), /[^\p{L}\d]/u.test(pw)].filter(Boolean).length;
  if (points <= 1) return { score: 1, label: "Słabe" };
  if (points === 2) return { score: 2, label: "Średnie" };
  if (points === 3) return { score: 3, label: "Dobre" };
  return { score: 4, label: "Mocne" };
}

const STRENGTH_COLOR = ["bg-white/15", "bg-red-400", "bg-amber-300", "bg-lime-400", "bg-brand"] as const;

function PasswordField({ id, label, value, onChange, onBlur, error, describedBy, autoFocusRef }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  describedBy?: string;
  autoFocusRef?: React.Ref<HTMLInputElement>;
}) {
  const [show, setShow] = useState(false);
  const ids = [error ? `${id}-err` : null, describedBy].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <div className="relative">
        <Input
          ref={autoFocusRef}
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete="new-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids}
          className="h-11 pr-12 text-base"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-controls={id}
          aria-label={show ? `Ukryj: ${label.toLowerCase()}` : `Pokaż: ${label.toLowerCase()}`}
          title={show ? "Ukryj hasło" : "Pokaż hasło"}
          className="absolute right-0 top-0 grid size-11 place-items-center rounded-lg text-white/60 hover:text-white"
        >
          {show ? <EyeOffIcon className="size-4" aria-hidden="true" /> : <EyeIcon className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? <p id={`${id}-err`} role="alert" className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

function PasswordSection({ cloud, demo, providers }: { cloud: boolean; demo: boolean; providers: string[] | null }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [touched, setTouched] = useState({ pw: false, pw2: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);
  const pw2Ref = useRef<HTMLInputElement>(null);
  const base = useId();
  const id1 = `${base}-nowe`;
  const id2 = `${base}-powtorz`;
  const strength = passwordStrength(pw);
  const pwError = touched.pw && pw.length < MIN_PASSWORD ? `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.` : null;
  const pw2Error = touched.pw2 && pw2 !== pw ? "Hasła się różnią. Wpisz dwa razy to samo hasło." : null;
  const googleOnly = !!providers?.includes("google") && !providers.includes("email");

  const rules = [
    { ok: pw.length >= MIN_PASSWORD, text: `Co najmniej ${MIN_PASSWORD} znaków (wymagane)` },
    { ok: /\p{Ll}/u.test(pw) && /\p{Lu}/u.test(pw), text: "Wielkie i małe litery" },
    { ok: /\d/.test(pw), text: "Cyfra" },
    { ok: /[^\p{L}\d]/u.test(pw), text: "Znak specjalny, np. ! ? # %" },
    { ok: pw.length >= 12, text: "12 znaków i więcej" },
  ];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setDone(false);
    setError(null);
    setTouched({ pw: true, pw2: true });
    if (pw.length < MIN_PASSWORD) return pwRef.current?.focus();
    if (pw !== pw2) return pw2Ref.current?.focus();
    const sb = cloud ? getSupabase() : null;
    if (!sb) return;
    setBusy(true);
    try {
      // Hasło idzie tylko do Supabase (HTTPS) i nigdzie nie jest zapisywane ani logowane.
      const { error: err } = await sb.auth.updateUser({ password: pw });
      if (err) {
        setError(authMessage(err as AuthErr, "password"));
        return;
      }
      setPw("");
      setPw2("");
      setTouched({ pw: false, pw2: false });
      setDone(true);
      toast("Hasło zmienione", { description: "Przy następnym logowaniu e-mailem użyj nowego hasła." });
    } catch {
      setError("Brak połączenia z internetem. Sprawdź połączenie i spróbuj jeszcze raz.");
    } finally {
      setBusy(false);
    }
  }

  if (!cloud) {
    return (
      <Note>
        {demo ? (
          <><span className="font-semibold">W trybie demo hasła nie zmienisz:</span> to przykładowe konto. Zaloguj się na swoje konto, a zmiana hasła będzie tutaj.</>
        ) : (
          <><span className="font-semibold">Ta wersja działa bez bazy kont</span> (konto jest zapisane tylko w tej przeglądarce), więc nie ma hasła do zmiany.</>
        )}
      </Note>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {googleOnly ? <Note>Konto założone przez Google. Ustawienie hasła pozwoli logować się też e-mailem i hasłem.</Note> : null}
      <PasswordField
        id={id1}
        label="Nowe hasło"
        value={pw}
        onChange={(v) => { setPw(v); setDone(false); setError(null); }}
        onBlur={() => pw && setTouched((t) => ({ ...t, pw: true }))}
        error={pwError}
        describedBy={`${base}-sila ${base}-zasady`}
        autoFocusRef={pwRef}
      />

      {/* Wskaźnik siły: 4 kreski + słowo (nie tylko kolor) */}
      <div className="-mt-1 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className={`block h-full rounded-full ${STRENGTH_COLOR[strength.score]}`}
                  initial={false}
                  animate={{ width: strength.score >= i ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </span>
            ))}
          </div>
          <p id={`${base}-sila`} className="min-w-24 text-right text-xs font-semibold text-white/75">
            {strength.label ? <><span className="sr-only">Siła hasła: </span>{strength.label}</> : <span className="text-white/45">Siła hasła</span>}
          </p>
        </div>
        <ul id={`${base}-zasady`} className="grid gap-1 text-xs text-white/60 sm:grid-cols-2" aria-label="Wskazówki do hasła">
          {rules.map((r) => (
            <li key={r.text} className={`flex items-center gap-1.5 ${r.ok ? "text-emerald-300" : ""}`}>
              {r.ok ? <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" /> : <CircleIcon className="size-3 shrink-0 opacity-60" aria-hidden="true" />}
              <span>{r.text}<span className="sr-only">{r.ok ? ": spełnione" : ": jeszcze nie"}</span></span>
            </li>
          ))}
        </ul>
      </div>

      <PasswordField
        id={id2}
        label="Powtórz nowe hasło"
        value={pw2}
        onChange={(v) => { setPw2(v); setDone(false); setError(null); }}
        onBlur={() => pw2 && setTouched((t) => ({ ...t, pw2: true }))}
        error={pw2Error}
        autoFocusRef={pw2Ref}
      />

      {error ? <p role="alert" className="rounded-xl border border-red-300/40 bg-red-400/10 px-3.5 py-3 text-sm text-red-100">{error}</p> : null}
      {done ? (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3.5 py-3 text-sm text-emerald-100">
          <CheckIcon className="size-4 shrink-0" aria-hidden="true" />Hasło zmienione.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || (!pw && !pw2)} className={BTN_PRIMARY}>
          {busy ? <Spinner /> : <KeyRoundIcon className="size-4" aria-hidden="true" />}
          Zmień hasło
        </button>
        <p className="text-xs text-white/55">Hasło trafia prosto do bezpiecznego logowania (Supabase). Nie zapisujemy go nigdzie.</p>
      </div>
    </form>
  );
}

// ---------- WYKORZYSTANIE AI ----------

type UsageView = { kind: "loading" } | { kind: "demo" } | { kind: "failed" } | { kind: "data"; info: UsageInfo };

async function fetchUsage(): Promise<UsageView> {
  try {
    const res = await fetch("/api/usage", { cache: "no-store" });
    if (res.status === 401) return { kind: "data", info: { status: "signed-out" } };
    if (!res.ok) return { kind: "failed" };
    const info = (await res.json()) as UsageInfo;
    return info && typeof info === "object" && "status" in info ? { kind: "data", info } : { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

const SPENDERS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: MessagesSquareIcon, title: "Rozmowy w krokach", text: "Każda odpowiedź asystenta i „Przygotuj dokument z rozmowy”." },
  { icon: SparklesIcon, title: "Narzędzia AI", text: "Szybkie akcje (np. analiza reklam, scenariusz VSL) i lokal z ogłoszenia." },
  { icon: ImageIcon, title: "Zdjęcia", text: "Zrzuty ekranu dołączone do wiadomości." },
  { icon: MicIcon, title: "Transkrypcje", text: "Nagrania rozmów i notatki głosowe zamieniane na tekst." },
];

function UsageBody({ info, onRetry }: { info: UsageInfo; onRetry: () => void }) {
  const reduce = useReducedMotion();
  if (info.status === "signed-out") return <Note>Zaloguj się ponownie, żeby zobaczyć licznik.</Note>;
  if (info.status === "not-configured") {
    return (
      <Note>
        <span className="font-semibold">Licznik ruszy po konfiguracji bazy.</span> Asystent działa normalnie. Miesięczny limit: {compact.format(info.limit)} tokenów, odnawia się 1. dnia miesiąca.
      </Note>
    );
  }
  if (info.status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <Note tone="warn">Nie udało się teraz wczytać licznika. Asystent działa normalnie.</Note>
        <button type="button" onClick={onRetry} className={BTN_GHOST}><RefreshCwIcon className="size-4" aria-hidden="true" />Spróbuj jeszcze raz</button>
      </div>
    );
  }

  const used = Math.max(0, info.tokens);
  const left = Math.max(0, info.limit - used);
  const leftPct = info.limit > 0 ? Math.round((left / info.limit) * 100) : 0;
  const usedPct = 100 - leftPct;
  const answers = Math.floor(left / TOKENS_PER_ANSWER);
  const over = left <= 0;
  const low = !over && leftPct < 15;
  const bar = over ? "bg-red-400" : low ? "bg-amber-300" : "bg-[linear-gradient(90deg,var(--green-strong),var(--brand))]";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-white/65">W tym miesiącu zostało</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 tabular-nums" title={`${full.format(left)} z ${full.format(info.limit)} tokenów`}>
          <span className={`text-4xl font-extrabold tracking-tight ${over ? "text-red-300" : "text-brand"}`}>{compact.format(left)}</span>
          <span className="text-lg font-semibold text-white/75">z {compact.format(info.limit)} tokenów</span>
          <span className="sr-only">({full.format(left)} z {full.format(info.limit)})</span>
        </p>
      </div>

      <div
        role="meter"
        aria-label="Pozostały limit AI w tym miesiącu"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={leftPct}
        aria-valuetext={`Zostało ${leftPct}% limitu`}
        className="h-3.5 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10"
      >
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={reduce ? false : { width: "0%" }}
          animate={{ width: `${Math.max(leftPct, over ? 0 : 2)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.2 }}
        />
      </div>
      <p className="-mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-white/60">
        <span>Wykorzystano {usedPct}% ({compact.format(used)} tokenów)</span>
        <span>{full.format(info.requests)} {plural(info.requests, "zapytanie", "zapytania", "zapytań")} do AI w tym miesiącu</span>
      </p>

      {over ? (
        <Note tone="warn">
          <span className="font-semibold">Limit na ten miesiąc został wykorzystany.</span> Asystent wróci {info.renewsText}. Lekcje, dokumenty i mapa ścieżki działają jak zwykle.
        </Note>
      ) : low ? (
        <Note tone="warn">Zostało niewiele. Limit odnowi się {info.renewsText}.</Note>
      ) : null}

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
          <CalendarClockIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <dt className="text-xs text-white/60">Odnowienie limitu</dt>
            <dd className="font-semibold"><time dateTime={info.renewsOn}>{info.renewsText}</time></dd>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
          <MessagesSquareIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <dt className="text-xs text-white/60">Na ile wystarczy</dt>
            <dd className="font-semibold">
              {answers >= 1 ? `ok. ${full.format(answers)} ${answers === 1 ? "odpowiedź" : "odpowiedzi"} asystenta` : over ? "Do odnowienia limitu" : "Mniej niż jedna odpowiedź"}
            </dd>
          </div>
        </div>
      </dl>
      <p className="text-xs text-white/55">
        Orientacyjnie: średnio ok. {compact.format(TOKENS_PER_ANSWER)} tokenów na jedną odpowiedź. Przy długiej rozmowie i wielu dokumentach odpowiedź kosztuje więcej, bo asystent za każdym razem czyta instrukcję kroku, Twoje dokumenty i całą rozmowę.
      </p>
    </div>
  );
}

function UsageSection({ demo }: { demo: boolean }) {
  const [view, setView] = useState<UsageView>(demo ? { kind: "demo" } : { kind: "loading" });

  useEffect(() => {
    if (demo) return;
    let alive = true;
    void fetchUsage().then((v) => { if (alive) setView(v); });
    return () => { alive = false; };
  }, [demo]);

  const reload = useCallback(() => {
    setView({ kind: "loading" });
    void fetchUsage().then(setView);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div aria-live="polite" aria-busy={view.kind === "loading"}>
        {view.kind === "loading" ? (
          <div className="flex flex-col gap-3" role="status">
            <span className="sr-only">Wczytuję licznik…</span>
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-9 w-64 animate-pulse rounded bg-white/10" />
            <div className="h-3.5 w-full animate-pulse rounded-full bg-white/10" />
          </div>
        ) : view.kind === "demo" ? (
          <Note>
            <span className="font-semibold">W trybie demo licznik nie działa:</span> to przykładowe konto. Po zalogowaniu zobaczysz tu, ile tokenów zostało w tym miesiącu i kiedy limit się odnowi.
          </Note>
        ) : view.kind === "failed" ? (
          <UsageBody info={{ status: "error", limit: 0, renewsOn: "", renewsText: "" }} onRetry={reload} />
        ) : (
          <UsageBody info={view.info} onRetry={reload} />
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold">Co zużywa tokeny</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {SPENDERS.map((s) => (
            <li key={s.title} className="flex items-start gap-2.5 rounded-xl p-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-brand"><s.icon className="size-4" aria-hidden="true" /></span>
              <span className="min-w-0 text-sm">
                <span className="font-semibold">{s.title}</span>
                <span className="block text-xs text-white/60">{s.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-white/55">Lekcje, mapa ścieżki i pobieranie dokumentów nie zużywają tokenów.</p>
      </div>
    </div>
  );
}

// ---------- PREFERENCJE ----------

function Switch({ on, onToggle, labelledBy, describedBy }: { on: boolean; onToggle: () => void; labelledBy: string; describedBy?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={onToggle}
      className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full px-0.5"
    >
      <span className={`flex h-7 w-12 items-center rounded-full p-0.5 ring-1 transition-colors ${on ? "justify-end bg-brand ring-brand" : "justify-start bg-white/15 ring-white/20"}`}>
        <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 36 }} className="size-6 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.35)]" />
      </span>
    </button>
  );
}

function PreferencesSection() {
  const router = useRouter();
  const [sound, toggleSound] = useSoundSetting();
  const base = useId();
  return (
    <ul className="flex flex-col divide-y divide-white/10">
      <li className="flex items-center gap-3 pb-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-orange">
          {sound ? <Volume2Icon className="size-4" aria-hidden="true" /> : <VolumeXIcon className="size-4" aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p id={`${base}-dzwiek`} className="font-semibold">Dźwięki nagród</p>
          <p id={`${base}-dzwiek-opis`} className="text-xs text-white/60">Krótkie „dzyń” przy XP, odznakach i nowym poziomie.</p>
        </div>
        <span className="hidden text-xs font-semibold text-white/65 sm:inline" aria-hidden="true">{sound ? "Włączone" : "Wyłączone"}</span>
        <Switch on={sound} onToggle={toggleSound} labelledBy={`${base}-dzwiek`} describedBy={`${base}-dzwiek-opis`} />
      </li>
      <li className="flex flex-wrap items-center gap-3 pt-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-brand"><CompassIcon className="size-4" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Powitanie i przewodnik</p>
          <p className="text-xs text-white/60">Obejrzyj jeszcze raz powitanie i krótki przewodnik po pulpicie.</p>
        </div>
        <button type="button" onClick={() => { router.push("/"); startTour(); }} className={BTN_GHOST}>
          <CompassIcon className="size-4" aria-hidden="true" />Pokaż
        </button>
      </li>
    </ul>
  );
}

// ---------- STRONA ----------

export function AccountSettings() {
  const router = useRouter();
  const { state, signOut } = useJourney();
  const demo = !!state.demo;
  const cloud = supabaseEnabled && !demo; // prawdziwe konto w Supabase
  const [providers, setProviders] = useState<string[] | null>(null);

  // Sposób logowania (e-mail i hasło / Google): tylko do podpowiedzi przy haśle.
  useEffect(() => {
    if (!cloud) return;
    let alive = true;
    getSupabase()
      ?.auth.getUser()
      .then(({ data }) => {
        const meta = data.user?.app_metadata?.providers as unknown;
        const list = Array.isArray(meta) ? meta.filter((p): p is string => typeof p === "string") : (data.user?.identities ?? []).map((i) => i.provider);
        if (alive && list.length) setProviders(list);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [cloud]);

  const logoutText = demo
    ? "Wyjście z demo. Przykładowe dane znikną."
    : supabaseEnabled
      ? "Postęp zostaje zapisany na koncie. Wrócisz do niego po zalogowaniu."
      : "W tej wersji postęp zostaje w tej przeglądarce.";

  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-5">
        <Section id="konto" icon={UserRoundIcon} title="Konto" desc={demo ? "Przykładowe konto demo: zmiany zostają w tej przeglądarce." : "Imię i adres, którym się logujesz."}>
          <AccountSection cloud={cloud} providers={providers} />
        </Section>
        <Section id="haslo" icon={KeyRoundIcon} title="Zmiana hasła" desc="Nowe hasło działa od razu, także na innych urządzeniach." delay={0.05}>
          <PasswordSection cloud={cloud} demo={demo} providers={providers} />
        </Section>
        <Section id="preferencje" icon={SlidersHorizontalIcon} title="Preferencje" delay={0.11}>
          <PreferencesSection />
        </Section>
      </div>

      <div className="flex flex-col gap-5">
        <Section id="ai" icon={GaugeIcon} title="Wykorzystanie AI w tym miesiącu" desc="Asystent ma miesięczny limit tokenów (tokeny to kawałki tekstu, które czyta i pisze AI)." delay={0.08}>
          <UsageSection demo={demo} />
        </Section>
        <motion.section
          id="kontakt"
          aria-labelledby="kontakt-h"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.14 }}
          className="scroll-mt-20"
        >
          <h2 id="kontakt-h" className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Kontakt</h2>
          <ContactBubble />
        </motion.section>
        <Section id="wyloguj" icon={LogOutIcon} title="Wyloguj się" desc={logoutText} delay={0.17}>
          <button
            type="button"
            onClick={() => { signOut(); router.push("/logowanie"); }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300/40 bg-red-400/[0.06] px-5 font-semibold text-red-100 hover:border-red-300/70 hover:bg-red-400/15"
          >
            <LogOutIcon className="size-4" aria-hidden="true" />Wyloguj
          </button>
        </Section>
        <nav aria-label="Dokumenty prawne" className="flex flex-wrap items-center gap-x-1 px-1 text-sm text-white/60">
          <Link href="/regulamin" className="inline-flex min-h-11 items-center px-2 font-semibold text-white/75 underline underline-offset-4 hover:text-white">Regulamin</Link>
          <span aria-hidden="true">·</span>
          <Link href="/polityka-prywatnosci" className="inline-flex min-h-11 items-center px-2 font-semibold text-white/75 underline underline-offset-4 hover:text-white">Polityka prywatności</Link>
        </nav>
      </div>
    </div>
  );
}
