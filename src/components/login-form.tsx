"use client";

// Logowanie (/logowanie): Google albo e-mail i hasło, „Nie pamiętasz hasła?” i wejście do demo.
// Reset hasła: przeglądarka prosi Supabase o link (resetPasswordForEmail). Link z maila wraca przez /auth/callback
// (sesja w ciasteczkach) na /nowe-haslo, gdzie przeglądarka ustawia hasło wprost w Supabase (updateUser).
// Hasło nigdy nie przechodzi przez nasze API. Supabase nie zdradza, czy konto z danym adresem istnieje, my też nie.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useJourney } from "@/lib/store";
import { signInWithGoogle, signInWithPassword, supabaseEnabled } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";

const URL_ERRORS: Record<string, string> = {
  anulowano: "Logowanie zostało anulowane.",
  kod: "Link logowania wygasł. Spróbuj jeszcze raz.",
  sesja: "Nie udało się dokończyć logowania. Spróbuj jeszcze raz.",
  konfiguracja: "Logowanie przez Google nie jest jeszcze skonfigurowane.",
  reset: "Link do ustawienia hasła wygasł, był już użyty albo otwarto go w innej przeglądarce. Wyślij nowy.",
};

/** Adres, na który wraca link z maila „Ustaw nowe hasło” (musi być w Redirect URLs w Supabase, WDROZENIE.md). */
const resetRedirect = () => `${window.location.origin}/auth/callback?next=/nowe-haslo`;

export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- statyczny logotyp */}
      <img src="/logo-ds.png" alt="Dochodowe Studio" width={168} height={96} className="h-20 w-auto drop-shadow-[0_8px_24px_rgba(114,196,28,.4)]" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Marketing OS</p>
    </div>
  );
}

const LEGAL_LINK = "font-semibold text-white/80 underline underline-offset-4 hover:text-white";

/** Linki do regulaminu i polityki prywatności (otwierają się w nowej karcie, żeby nie zgubić wpisanych danych). */
export function LegalLink({ href, children }: { href: "/regulamin" | "/polityka-prywatnosci"; children: React.ReactNode }) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className={LEGAL_LINK}>
      {children}<span className="sr-only"> (w nowej karcie)</span>
    </Link>
  );
}

/** Przycisk „Kontynuuj z Google” (logowanie i rejestracja). `guard` może zatrzymać logowanie (np. brak zgody na regulamin). */
export function GoogleButton({ label = "Kontynuuj z Google", onError, guard }: { label?: string; onError: (msg: string) => void; guard?: () => boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="outline" type="button" size="lg" disabled={!supabaseEnabled || busy} title={supabaseEnabled ? undefined : "Zadziała po podłączeniu bazy danych"}
      onClick={async () => { if (guard && !guard()) return; setBusy(true); const r = await signInWithGoogle(); if (r.error) { setBusy(false); onError(r.error); } }}>
      {busy ? <Spinner /> : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" /></svg>
      )}
      {supabaseEnabled ? label : `${label} (wkrótce)`}
    </Button>
  );
}

type AuthErr = { code?: string; status?: number; name?: string };

function resetMessage(err: AuthErr): string {
  const code = err.code ?? "";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || err.status === 429) {
    return "Link można wysłać ponownie dopiero za chwilę. Odczekaj minutę i spróbuj jeszcze raz.";
  }
  if (code === "email_address_invalid" || code === "validation_failed") return "Sprawdź adres e-mail i spróbuj jeszcze raz.";
  if (err.name === "AuthRetryableFetchError" || !navigator.onLine) return "Brak połączenia z internetem. Sprawdź połączenie i spróbuj jeszcze raz.";
  return "Nie udało się wysłać linku. Spróbuj jeszcze raz za chwilę.";
}

/** „Nie pamiętasz hasła?”: e-mail → link z Supabase. */
function ResetRequest({ initialEmail, initialError, onBack }: { initialEmail: string; initialError: string | null; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (sentTo ? backRef : emailRef).current?.focus();
  }, [sentTo]);

  async function send(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const sb = getSupabase();
    if (!sb) return setError("Reset hasła zadziała po podłączeniu bazy kont.");
    const mail = email.trim().toLowerCase();
    setBusy(true);
    try {
      // Do Supabase idzie tylko adres e-mail. Odpowiedź jest taka sama, czy konto istnieje, czy nie.
      const { error: err } = await sb.auth.resetPasswordForEmail(mail, { redirectTo: resetRedirect() });
      if (err) setError(resetMessage(err as AuthErr));
      else setSentTo(mail);
    } catch {
      setError("Brak połączenia z internetem. Sprawdź połączenie i spróbuj jeszcze raz.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{sentTo ? "Sprawdź skrzynkę" : "Nowe hasło"}</CardTitle>
        <CardDescription>
          {sentTo
            ? `Jeśli konto z adresem ${sentTo} istnieje, wysłaliśmy na nie link do ustawienia nowego hasła. Link jest ważny przez godzinę.`
            : "Podaj e-mail swojego konta. Wyślemy link, który pozwoli ustawić nowe hasło."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sentTo ? (
          <FieldGroup>
            <p role="status" className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
              Otwórz link na tym samym urządzeniu i w tej samej przeglądarce. Nie widzisz maila? Sprawdź folder „Spam” albo „Oferty”.
            </p>
            <Field>
              <Button ref={backRef} type="button" size="lg" className="font-bold" onClick={onBack}>Wróć do logowania</Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => setSentTo(null)}>Wyślij link jeszcze raz</Button>
            </Field>
          </FieldGroup>
        ) : (
          <form onSubmit={send}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reset-email">E-mail</FieldLabel>
                <Input ref={emailRef} id="reset-email" type="email" autoComplete="email" placeholder="ty@twojestudio.pl" required value={email} onChange={(e) => setEmail(e.target.value)} />
                <FieldDescription>Konto założone przez Google? Wystarczy przycisk „Kontynuuj z Google” na stronie logowania.</FieldDescription>
              </Field>
              {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
              <Field>
                <Button type="submit" size="lg" className="font-bold" disabled={busy}>{busy ? <Spinner /> : null}Wyślij link</Button>
                <Button type="button" variant="ghost" size="lg" onClick={onBack}>Wróć do logowania</Button>
              </Field>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { state, signIn, loadDemo } = useJourney();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [reset, setReset] = useState<{ error: string | null } | null>(null); // „Nie pamiętasz hasła?” otwarte
  const forgotRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const blad = q.get("blad");
    const message = blad ? (URL_ERRORS[blad] ?? "Nie udało się zalogować.") : null;
    // Wygasły link do nowego hasła (?blad=reset) albo ?reset=1: od razu formularz nowego linku.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- komunikat po powrocie z logowania Google / linku z maila
    if (supabaseEnabled && (blad === "reset" || q.get("reset") === "1")) setReset({ error: blad === "reset" ? message : null });
    else if (message) setError(message);
    if (q.get("info") === "potwierdzono") setInfo("E-mail potwierdzony. Zaloguj się swoim hasłem.");
  }, []);

  // Z Supabase: po zalogowaniu czekamy, aż konto i postęp wczytają się z bazy.
  useEffect(() => {
    if (busy && supabaseEnabled && state.profile?.email.toLowerCase() === email.trim().toLowerCase()) router.push("/");
  }, [busy, state.profile, email, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const mail = email.trim().toLowerCase();
    if (!supabaseEnabled) {
      const known = state.profile?.email.toLowerCase() === mail ? state.profile.name : mail.split("@")[0];
      signIn({ name: known, email: mail });
      router.push("/");
      return;
    }
    setBusy(true);
    const r = await signInWithPassword(mail, password);
    if (r.error) {
      setBusy(false);
      setError(r.error);
    }
  }

  function backToLogin() {
    setReset(null);
    requestAnimationFrame(() => forgotRef.current?.focus());
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <BrandLogo />
      {reset ? (
        <ResetRequest initialEmail={email} initialError={reset.error} onBack={backToLogin} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Zaloguj się</CardTitle>
            <CardDescription>Wróć do swojej ścieżki marketingu studia.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <GoogleButton onError={setError} />
                </Field>
                <FieldSeparator>albo e-mailem</FieldSeparator>
                <Field>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input id="email" type="email" autoComplete="email" placeholder="ty@twojestudio.pl" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="password">Hasło</FieldLabel>
                    {supabaseEnabled ? (
                      <button ref={forgotRef} type="button" onClick={() => { setError(null); setInfo(null); setReset({ error: null }); }}
                        className="-my-3 inline-flex min-h-11 items-center text-sm font-medium text-white/70 underline-offset-4 hover:text-white hover:underline">
                        Nie pamiętasz hasła?
                      </button>
                    ) : null}
                  </div>
                  <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                {info ? <p role="status" className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">{info}</p> : null}
                {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
                <Field>
                  <Button type="submit" size="lg" className="font-bold" disabled={busy}>{busy ? <Spinner /> : null}Zaloguj się</Button>
                  <FieldDescription className="text-center">
                    Nie masz konta? <Link href="/rejestracja">Załóż konto</Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}
      <button type="button" onClick={() => { loadDemo(); router.push("/"); }} className="min-h-11 text-sm font-semibold text-white/65 underline-offset-4 hover:text-white hover:underline">
        Zobacz demo z przykładowym postępem
      </button>
      {!supabaseEnabled ? <p className="text-center text-xs text-white/50">Wersja testowa: konto zapisuje się tylko w tej przeglądarce.</p> : null}
      <p className="text-center text-xs leading-relaxed text-white/55">
        Logując się, akceptujesz <LegalLink href="/regulamin">Regulamin</LegalLink> i <LegalLink href="/polityka-prywatnosci">Politykę prywatności</LegalLink>.
      </p>
    </div>
  );
}
