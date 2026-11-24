// Powrót z logowania Google (i z linku potwierdzającego e-mail): wymieniamy kod na sesję w ciasteczkach.
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const fail = (reason: string) => Response.redirect(`${url.origin}/logowanie?blad=${reason}`, 302);

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaKey) return fail("konfiguracja");
  if (!code) return fail(url.searchParams.get("error") ? "anulowano" : "kod");

  const store = await cookies();
  const supabase = createServerClient(supaUrl, supaKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return fail("sesja");
  return Response.redirect(`${url.origin}${safeNext}`, 302);
}
