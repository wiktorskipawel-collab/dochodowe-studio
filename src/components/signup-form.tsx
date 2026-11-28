"use client";

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
import { signUpWithPassword, supabaseEnabled } from "@/lib/auth";
import { BrandLogo, GoogleButton, LegalLink } from "@/components/login-form";

const CONSENT_MISSING = "Zaznacz akceptację regulaminu i polityki prywatności, żeby założyć konto.";

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const { state, signIn } = useJourney();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkMail, setCheckMail] = useState(false);
  const [accepted, setAccepted] = useState(false); // zgoda: regulamin i polityka prywatności (wymagana, także przy Google)
  const [consentError, setConsentError] = useState(false);
  const consentRef = useRef<HTMLInputElement>(null);

  /** Bez zgody nie zakładamy konta (ani e-mailem, ani przez Google). */
  function consentGiven() {
    if (accepted) {
      // zgoda przy rejestracji przez Google: zapiszemy ją na koncie po powrocie (store.tsx, loadUser)
      try { localStorage.setItem("ds:zgoda", new Date().toISOString()); } catch { /* bez localStorage zgoda zostaje tylko w formularzu */ }
      return true;
    }
    setConsentError(true);
    setError(CONSENT_MISSING);
    consentRef.current?.focus();
    return false;
  }

  useEffect(() => {
    if (busy && supabaseEnabled && state.profile?.email.toLowerCase() === email.trim().toLowerCase()) router.push("/ankieta");
  }, [busy, state.profile, email, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consentGiven()) return;
    if (pass.length < 8) return setError("Hasło musi mieć co najmniej 8 znaków.");
    if (pass !== pass2) return setError("Hasła nie są takie same.");
    const mail = email.trim().toLowerCase();
    if (!supabaseEnabled) {
      signIn({ name: name.trim(), email: mail });
      router.push("/ankieta");
      return;
    }
    setBusy(true);
    const r = await signUpWithPassword(name.trim(), mail, pass);
    if (r.error) {
      setBusy(false);
      return setError(r.error);
    }
    if (r.needsConfirm) {
      setBusy(false);
      setCheckMail(true);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <BrandLogo />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{checkMail ? "Sprawdź skrzynkę" : "Załóż konto"}</CardTitle>
          <CardDescription>
            {checkMail ? `Wysłaliśmy link potwierdzający na ${email}. Kliknij go, a od razu przejdziesz do ankiety z Bartkiem.` : "Za chwilę Bartek poprowadzi Cię przez krótką ankietę."}
          </CardDescription>
        </CardHeader>
        {!checkMail ? (
          <CardContent>
            <form onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <GoogleButton label="Zarejestruj się przez Google" onError={setError} guard={consentGiven} />
                </Field>
                <FieldSeparator>albo e-mailem</FieldSeparator>
                <Field>
                  <FieldLabel htmlFor="name">Imię</FieldLabel>
                  <Input id="name" autoComplete="given-name" placeholder="Kasia" required value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">E-mail</FieldLabel>
                  <Input id="email" type="email" autoComplete="email" placeholder="ty@twojestudio.pl" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Hasło</FieldLabel>
                  <Input id="password" type="password" autoComplete="new-password" required value={pass} onChange={(e) => setPass(e.target.value)} />
                  <FieldDescription>Co najmniej 8 znaków.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password2">Powtórz hasło</FieldLabel>
                  <Input id="password2" type="password" autoComplete="new-password" required value={pass2} onChange={(e) => setPass2(e.target.value)} />
                </Field>
                <Field>
                  <div className="flex items-start gap-3">
                    <input ref={consentRef} id="zgoda" type="checkbox" required checked={accepted}
                      onChange={(e) => { setAccepted(e.target.checked); if (e.target.checked) { setConsentError(false); setError((cur) => (cur === CONSENT_MISSING ? null : cur)); } }}
                      aria-invalid={consentError || undefined} aria-describedby="zgoda-ai"
                      className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--brand)]" />
                    <label htmlFor="zgoda" className="cursor-pointer text-sm leading-snug text-white/85">
                      Akceptuję <LegalLink href="/regulamin">regulamin</LegalLink> i <LegalLink href="/polityka-prywatnosci">politykę prywatności</LegalLink>.
                    </label>
                  </div>
                  <FieldDescription id="zgoda-ai">Odpowiedzi w rozmowach z asystentem przetwarza zewnętrzny model AI. Nie wpisuj danych zdrowotnych ani danych kontaktowych klientów.</FieldDescription>
                </Field>
                {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
                <Field>
                  <Button type="submit" size="lg" className="font-bold" disabled={busy}>{busy ? <Spinner /> : null}Załóż konto i zaczynamy</Button>
                  <FieldDescription className="text-center">
                    Masz już konto? <Link href="/logowanie">Zaloguj się</Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        ) : null}
      </Card>
      {!supabaseEnabled ? <p className="text-center text-xs text-white/50">Wersja testowa: konto zapisuje się tylko w tej przeglądarce.</p> : null}
    </div>
  );
}
