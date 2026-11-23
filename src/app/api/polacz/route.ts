// Stan połączenia z AI uczestnika. Klucz nigdy nie wraca do przeglądarki — tylko informacja, czy jest.
import { clearAiSecret, readAiSecret, writeAiSecret } from "@/lib/secure-cookie";
import { PROVIDERS } from "@/lib/models";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const s = await readAiSecret();
  return Response.json({ provider: s?.provider ?? null }, { headers: noStore });
}

/** Klucz wklejony ręcznie (opcja zaawansowana). */
export async function POST(request: Request) {
  let body: { provider?: unknown; apiKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Nieprawidłowe zapytanie." }, { status: 400 });
  }
  const provider = body.provider;
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (provider !== "openai" && provider !== "anthropic") return Response.json({ error: "Nieznany dostawca." }, { status: 400 });
  if (apiKey.length < 20 || !apiKey.startsWith(PROVIDERS[provider].keyPrefix)) {
    return Response.json({ error: `To nie wygląda na klucz ${PROVIDERS[provider].name}.` }, { status: 400 });
  }
  await writeAiSecret({ provider, key: apiKey });
  return Response.json({ ok: true }, { headers: noStore });
}

export async function DELETE() {
  await clearAiSecret();
  return Response.json({ ok: true }, { headers: noStore });
}
