// Powrót z logowania Google, z linku potwierdzającego e-mail i z linku „Ustaw nowe hasło”: zamieniamy link na sesję w ciasteczkach.
// Dwa rodzaje linków z maila (zgodnie z dokumentacją Supabase dla @supabase/ssr):
// - ?code=… (domyślny szablon maila, PKCE): exchangeCodeForSession. Działa w tej przeglądarce, w której poproszono o link
//   (kod weryfikujący leży w jej ciasteczku).
// - ?token_hash=…&type=recovery|signup|… (własny szablon maila, WDROZENIE.md): verifyOtp. Działa w każdej przeglądarce.
// Link odzyskiwania hasła (type=recovery albo next=/nowe-haslo) prowadzi na /nowe-haslo; błąd = /logowanie?blad=reset.
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const NEW_PASSWORD = "/nowe-haslo";
const OTP_TYPES: readonly EmailOtpType[] = ["recovery", "signup", "invite", "magiclink", "email", "email_change"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = OTP_TYPES.find((t) => t === url.searchParams.get("type"));
  const next = url.searchParams.get("next") ?? (type === "recovery" ? NEW_PASSWORD : null);
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const recovery = type === "recovery" || safeNext === NEW_PASSWORD;
  const otp = tokenHash && type ? { type, token_hash: tokenHash } : null;
  const fail = (reason: string) => Response.redirect(`${url.origin}/logowanie?blad=${reason}`, 302);

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaKey) return fail("konfiguracja");
  // Wygasły albo użyty link: Supabase odsyła tu ?error=…&error_code=otp_expired zamiast kodu.
  if (!code && !otp) return fail(recovery ? "reset" : url.searchParams.get("error") ? "anulowano" : "kod");

  const store = await cookies();
  const supabase = createServerClient(supaUrl, supaKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
  const { error } = otp ? await supabase.auth.verifyOtp(otp) : await supabase.auth.exchangeCodeForSession(code ?? "");
  if (error) {
    console.error("[auth/callback]", error.code ?? error.name, error.message); // bez kodu i ciasteczek
    // Link do nowego hasła wygasł, był już użyty albo otwarto go w innej przeglądarce: prosimy o nowy.
    if (recovery) return fail("reset");
    // Link potwierdzający z maila (ma ?next=) otwarty np. w innej przeglądarce: adres jest już potwierdzony.
    if (next) return Response.redirect(`${url.origin}/logowanie?info=potwierdzono`, 302);
    return fail("sesja");
  }
  return Response.redirect(`${url.origin}${safeNext}`, 302);
}
