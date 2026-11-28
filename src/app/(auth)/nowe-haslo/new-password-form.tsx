"use client";

// /nowe-haslo: ustawienie nowego hasła po kliknięciu linku z maila „Ustaw nowe hasło”.
// - /auth/callback zamienił link z maila na sesję (ciasteczka). Gdy link trafi tu wprost (?code=…), klient Supabase
//   wymienia go na sesję sam przy starcie (detectSessionInUrl w @supabase/ssr), a getUser() na to czeka.
// - Hasło ustawia przeglądarka WPROST w Supabase (updateUser): nie przechodzi przez nasze API i nie jest nigdzie zapisywane.
// - Bez ważnej sesji (stary albo użyty link, inna przeglądarka): prośba o nowy link (/logowanie?reset=1).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { BrandLogo } from "@/components/login-form";
import { getSupabase, supabaseEnabled } from "@/lib/supabase/client";

const MIN_PASSWORD = 8;

type Phase = "checking" | "ready" | "expired" | "local";
type AuthErr = { code?: string; message?: string; status?: number; name?: string; reasons?: string[] };

const SESSION_ERRORS = ["session_not_found", "session_expired", "user_not_found", "refresh_token_not_found", "bad_jwt"];

function passwordMessage(err: AuthErr): string {
  const code = err.code ?? "";
  if (code === "same_password") return "Nowe hasło musi się różnić od poprzedniego.";
  if (code === "weak_password" || err.name === "AuthWeakPasswordError") {
    if (err.reasons?.includes("pwned")) return "To hasło wyciekło kiedyś z innej strony i jest na listach znanych haseł. Wybierz inne.";
    if (err.reasons?.includes("length")) return "Hasło jest za krótkie. Wydłuż je i spróbuj jeszcze raz.";
    return "Hasło jest za słabe. Dodaj wielkie i małe litery, cyfry i znak specjalny albo wydłuż je.";
  }
  if (code === "over_request_rate_limit" || err.status === 429) return "Za dużo prób w krótkim czasie. Spróbuj ponownie za kilka minut.";
  if (err.name === "AuthRetryableFetchError" || !navigator.onLine) return "Brak połączenia z internetem. Sprawdź połączenie i spróbuj jeszcze raz.";
  return "Nie udało się ustawić hasła. Spróbuj jeszcze raz za chwilę.";
}

function PasswordField({ id, label, value, onChange, error, hint, inputRef }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error: string | null; hint?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [show, setShow] = useState(false);
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input ref={inputRef} id={id} type={show ? "text" : "password"} autoComplete="new-password" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          required value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy}
          className="h-11 pr-12 text-base" />
        <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-controls={id}
          aria-label={show ? `Ukryj: ${label.toLowerCase()}` : `Pokaż: ${label.toLowerCase()}`} title={show ? "Ukryj hasło" : "Pokaż hasło"}
          className="absolute right-0 top-0 grid size-11 place-items-center rounded-lg text-white/60 hover:text-white">
          {show ? <EyeOffIcon className="size-4" aria-hidden="true" /> : <EyeIcon className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      {error ? <p id={`${id}-err`} role="alert" className="text-sm text-red-300">{error}</p> : null}
    </Field>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(supabaseEnabled ? "checking" : "local");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const pw2Ref = useRef<HTMLInputElement>(null);

  // Czy link z maila dał sesję? (getUser czeka, aż klient Supabase skończy start i ewentualną wymianę ?code=…)
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    sb.auth
      .getUser()
      .then(({ data }) => {
        if (!alive) return;
        setEmail(data.user?.email ?? "");
        setPhase(data.user ? "ready" : "expired");
      })
      .catch(() => { if (alive) setPhase("expired"); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (phase === "ready") pwRef.current?.focus();
  }, [phase]);

  const pwError = touched && pw.length < MIN_PASSWORD ? `Hasło musi mieć co najmniej ${MIN_PASSWORD} znaków.` : null;
  const pw2Error = touched && pw.length >= MIN_PASSWORD && pw2 !== pw ? "Hasła się różnią. Wpisz dwa razy to samo hasło." : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched(true);
    if (pw.length < MIN_PASSWORD) return pwRef.current?.focus();
    if (pw !== pw2) return pw2Ref.current?.focus();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    try {
      // Hasło idzie tylko do Supabase (HTTPS) i nigdzie nie jest zapisywane ani logowane.
      const { error: err } = await sb.auth.updateUser({ password: pw });
      if (err) {
        const e2 = err as AuthErr;
        if (SESSION_ERRORS.includes(e2.code ?? "") || e2.name === "AuthSessionMissingError") setPhase("expired");
        else setError(passwordMessage(e2));
        return;
      }
      setPw("");
      setPw2("");
      toast("Hasło ustawione", { description: "Przy następnym logowaniu e-mailem użyj nowego hasła." });
      router.replace("/");
    } catch {
      setError("Brak połączenia z internetem. Sprawdź połączenie i spróbuj jeszcze raz.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BrandLogo />
      {phase === "checking" ? (
        <Card>
          <CardContent>
            <p role="status" className="flex items-center justify-center gap-3 py-6 text-sm text-white/75"><Spinner />Sprawdzam link z maila…</p>
          </CardContent>
        </Card>
      ) : phase === "ready" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ustaw nowe hasło</CardTitle>
            <CardDescription>{email ? <>Konto: <span className="font-semibold text-white/85">{email}</span></> : "Wpisz nowe hasło do swojego konta."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} noValidate>
              {/* dla menedżerów haseł: do którego konta zapisać nowe hasło */}
              <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
              <FieldGroup>
                <PasswordField id="nowe-haslo" label="Nowe hasło" value={pw} onChange={setPw} error={pwError} hint={`Co najmniej ${MIN_PASSWORD} znaków.`} inputRef={pwRef} />
                <PasswordField id="powtorz-haslo" label="Powtórz hasło" value={pw2} onChange={setPw2} error={pw2Error} inputRef={pw2Ref} />
                {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
                <Field>
                  <Button type="submit" size="lg" className="font-bold" disabled={busy}>{busy ? <Spinner /> : null}Zapisz hasło i przejdź dalej</Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : phase === "expired" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Link nie działa</CardTitle>
            <CardDescription>
              Link do ustawienia hasła jest ważny przez godzinę i działa raz, w tej przeglądarce, w której poproszono o nowe hasło. Wyślij nowy link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <Link href="/logowanie?reset=1" className={cn(buttonVariants({ size: "lg" }), "font-bold")}>Wyślij nowy link</Link>
                <Link href="/logowanie" className={buttonVariants({ size: "lg", variant: "ghost" })}>Wróć do logowania</Link>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nowe hasło</CardTitle>
            <CardDescription>Ta wersja działa bez bazy kont (konto jest zapisane tylko w tej przeglądarce), więc hasła się tu nie ustawia.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/logowanie" className={cn(buttonVariants({ size: "lg" }), "w-full font-bold")}>Wróć do logowania</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
