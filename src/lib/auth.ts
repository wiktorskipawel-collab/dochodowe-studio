"use client";

// Logowanie: Supabase (e-mail + hasło, Google), a bez kluczy — tryb lokalny (prototyp).
import { getSupabase, supabaseEnabled } from "@/lib/supabase/client";

export { supabaseEnabled };

const callback = () => `${window.location.origin}/auth/callback`;

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Nieprawidłowy e-mail albo hasło.",
  "Email not confirmed": "Potwierdź najpierw adres e-mail. Link wysłaliśmy na Twoją skrzynkę.",
  "User already registered": "To konto już istnieje. Zaloguj się.",
};
const pl = (msg: string) => MESSAGES[msg] ?? "Coś poszło nie tak. Spróbuj jeszcze raz.";

export async function signInWithPassword(email: string, password: string): Promise<{ error?: string }> {
  const sb = getSupabase();
  if (!sb) return {};
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? { error: pl(error.message) } : {};
}

export async function signUpWithPassword(name: string, email: string, password: string): Promise<{ error?: string; needsConfirm?: boolean }> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${callback()}?next=/ankieta` } });
  if (error) return { error: pl(error.message) };
  return { needsConfirm: !data.session };
}

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: "Logowanie Google zadziała po podłączeniu bazy danych." };
  const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
  return error ? { error: pl(error.message) } : {};
}

export async function signOutRemote() {
  await getSupabase()?.auth.signOut();
}
