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
import { BrandLogo } from "@/components/login-form";

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const { signIn } = useJourney();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (pass.length < 8) return setError("Hasło musi mieć co najmniej 8 znaków.");
    if (pass !== pass2) return setError("Hasła nie są takie same.");
    signIn({ name: name.trim(), email: email.trim() });
    router.push("/polacz");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <BrandLogo />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Załóż konto</CardTitle>
          <CardDescription>Za chwilę Bartek poprowadzi Cię przez krótką ankietę.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
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
              {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
              <Field>
                <Button type="submit" size="lg" className="font-bold">Załóż konto i zaczynamy</Button>
                <FieldDescription className="text-center">
                  Masz już konto? <Link href="/logowanie">Zaloguj się</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-white/50">Wersja testowa: konto zapisuje się tylko w tej przeglądarce. Prawdziwe logowanie dojdzie z bazą danych.</p>
    </div>
  );
}
