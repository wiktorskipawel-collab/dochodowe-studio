// Licznik AI dla strony „Ustawienia konta”: zużycie zalogowanej osoby w tym miesiącu i limit z serwera.
// Tylko zalogowani (401 bez sesji). Odczyt idzie przez funkcję get_ai_usage w Supabase (RLS: wyłącznie własny wiersz).
// Bez tabeli ai_usage (SQL nieuruchomiony): status „not-configured”. Treści rozmów tu nie ma i nic nie logujemy.
import { connection } from "next/server";
import { getUsage } from "@/lib/usage";

export async function GET() {
  await connection(); // zawsze w chwili zapytania (licznik i sesja), nigdy z gotowej strony
  const info = await getUsage();
  return Response.json(info, { status: info.status === "signed-out" ? 401 : 200, headers: { "Cache-Control": "no-store" } });
}
