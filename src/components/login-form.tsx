"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useJourney } from "@/lib/store";

export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- statyczny logotyp */}
      <img src="/logo-ds.png" alt="Dochodowe Studio" width={168} height={96} className="h-20 w-auto drop-shadow-[0_8px_24px_rgba(22,163,123,.5)]" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Marketing OS</p>
    </div>
  );
}

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { state, signIn, loadDemo } = useJourney();
  const router = useRouter();
  const [email, setEmail] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    // PROTOTYP: bez serwera kont. Imię zostaje z rejestracji w tej przeglądarce albo powstaje z adresu e-mail.
    const known = state.profile?.email === email ? state.profile.name : email.split("@")[0];
    signIn({ name: known, email });
    router.push("/");
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
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input id="email" type="email" autoComplete="email" placeholder="ty@twojestudio.pl" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Hasło</FieldLabel>
                <Input id="password" type="password" autoComplete="current-password" required />
              </Field>
              <Field>
                <Button type="submit" size="lg" className="font-bold">Zaloguj się</Button>
                <Button variant="outline" type="button" size="lg" disabled title="Wkrótce">Kontynuuj z Google (wkrótce)</Button>
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
      <p className="text-center text-xs text-white/50">Wersja testowa: konto zapisuje się tylko w tej przeglądarce. Prawdziwe logowanie dojdzie z bazą danych.</p>
    </div>
  );
}
