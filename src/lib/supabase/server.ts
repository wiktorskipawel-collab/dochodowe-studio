// Supabase po stronie serwera: tylko sprawdzenie, czy zapytanie wysłała zalogowana osoba (sesja w ciasteczkach).
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** true, gdy w ciasteczkach jest ważna sesja Supabase. Bez kluczy Supabase (prototyp lokalny) zawsze true. */
export async function signedIn() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return true;
  const store = await cookies();
  const supabase = createServerClient(url, key, {
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
  const { data, error } = await supabase.auth.getUser();
  return !error && !!data.user;
}
