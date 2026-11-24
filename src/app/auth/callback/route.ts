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
  if (error) {
    console.error("[auth/callback]", error.code ?? error.name, error.message); // bez kodu i ciasteczek
    // Link potwierdzający z maila (ma ?next=) otwarty np. w innej przeglądarce: adres jest już potwierdzony.
    if (next) return Response.redirect(`${url.origin}/logowanie?info=potwierdzono`, 302);
    return fail("sesja");
  }
  return Response.redirect(`${url.origin}${safeNext}`, 302);
}
