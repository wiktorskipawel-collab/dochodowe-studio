"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useJourney } from "@/lib/store";
import { signInWithGoogle, signInWithPassword, supabaseEnabled } from "@/lib/auth";

const URL_ERRORS: Record<string, string> = {
  anulowano: "Logowanie zostało anulowane.",
  kod: "Link logowania wygasł. Spróbuj jeszcze raz.",
  sesja: "Nie udało się dokończyć logowania. Spróbuj jeszcze raz.",
  konfiguracja: "Logowanie przez Google nie jest jeszcze skonfigurowane.",
};

export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- statyczny logotyp */}
      <img src="/logo-ds.png" alt="Dochodowe Studio" width={168} height={96} className="h-20 w-auto drop-shadow-[0_8px_24px_rgba(22,163,123,.5)]" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Marketing OS</p>
    </div>
  );
}

/** Przycisk „Kontynuuj z Google” (logowanie i rejestracja). */
export function GoogleButton({ label = "Kontynuuj z Google", onError }: { label?: string; onError: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="outline" type="button" size="lg" disabled={!supabaseEnabled || busy} title={supabaseEnabled ? undefined : "Zadziała po podłączeniu bazy danych"}
      onClick={async () => { setBusy(true); const r = await signInWithGoogle(); if (r.error) { setBusy(false); onError(r.error); } }}>
      {busy ? <Spinner /> : (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" /></svg>
      )}
      {supabaseEnabled ? label : `${label} (wkrótce)`}
    </Button>
  );
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { state, signIn, loadDemo } = useJourney();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const blad = new URLSearchParams(window.location.search).get("blad");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- komunikat po powrocie z logowania Google
    if (blad) setError(URL_ERRORS[blad] ?? "Nie udało się zalogować.");
  }, []);

  // Z Supabase: po zalogowaniu czekamy, aż konto i postęp wczytają się z bazy.
  useEffect(() => {
    if (busy && supabaseEnabled && state.profile?.email === email) router.push("/");
  }, [busy, state.profile, email, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabaseEnabled) {
      const known = state.profile?.email === email ? state.profile.name : email.split("@")[0];
      signIn({ name: known, email });
      router.push("/");
      return;
    }
    setBusy(true);
    const r = await signInWithPassword(email, password);
    if (r.error) {
      setBusy(false);
      setError(r.error);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <BrandLogo />
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
                <FieldLabel htmlFor="password">Hasło</FieldLabel>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
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
      <button type="button" onClick={() => { loadDemo(); router.push("/"); }} className="min-h-11 text-sm font-semibold text-white/65 underline-offset-4 hover:text-white hover:underline">
        Zobacz demo z przykładowym postępem
      </button>
      {!supabaseEnabled ? <p className="text-center text-xs text-white/50">Wersja testowa: konto zapisuje się tylko w tej przeglądarce.</p> : null}
    </div>
  );
}
