// Tymczasowa ochrona hasłem na czas pokazów (SITE_PASSWORD). Docelowo zastąpi ją logowanie w Supabase.
import { NextResponse, type NextRequest } from "next/server";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(given, password)) return NextResponse.next();
    } catch {
      // nieprawidłowy nagłówek: traktujemy jak brak hasła
    }
  }
  return new NextResponse("Wymagane hasło.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Marketing OS", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
