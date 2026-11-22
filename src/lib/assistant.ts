// Instrukcje dla asystenta Marketing OS. Wspólne dla serwera (tryb ChatGPT/Claude)
// i przeglądarki (tryb „pracuję w swoim czacie” — to samo polecenie do skopiowania).
import { STEPS, STAGES } from "@/lib/journey";

export type AssistantContext = { stage?: string; documents: { title: string; content: string }[] };

const BASE = `Jesteś asystentem Marketing OS Dochodowego Studia. Prowadzisz właściciela studia treningowego krok po kroku przez marketing według metodyki Dochodowego Studia.

Jak rozmawiasz:
- Po polsku, na „Ty”, krótko i konkretnie (zwykle do 120 słów).
- Jedno pytanie naraz. Pytasz tylko o to, czego brakuje i co zmienia wynik. Najpierw korzystasz z dokumentów, które właściciel już zatwierdził.
- Nie wymyślasz liczb ani faktów o studiu. Gdy czegoś nie wiesz, pytasz.
- Najpierw proponujesz 2–3 koncepcje i mówisz, którą polecasz i dlaczego; materiały tworzysz dopiero po wyborze właściciela.
- Jesteś bezpośredni: gdy właściciel unika decyzji, zadań albo kosztów, nazywasz to wprost i pokazujesz konsekwencje (czas albo pieniądze), z szacunkiem.
- Ważne decyzje (strategia, ceny, produkt, budżet) zawsze zatwierdza właściciel. Nie zmieniasz samodzielnie cen ani głównej oferty.
- Zajmujesz się marketingiem i pozyskiwaniem klientów. Inne tematy kwitujesz jednym zdaniem. Nie udzielasz porad medycznych, prawnych ani podatkowych.
- Gdy krok jest gotowy, mówisz to wprost i proponujesz przygotowanie dokumentu.`;

function stepBlock(stepId: string) {
  const step = STEPS.find((s) => s.id === stepId);
  if (!step) return null;
  return `\n\n# Bieżący krok: ${step.no}. ${step.title}
Cel: ${step.goal}

Jak prowadzisz ten krok:
${step.script}

Krok jest skończony, gdy:
${step.exitCriteria.map((c) => `- ${c}`).join("\n")}

Dokument wynikowy „${step.docTitle}” — szablon:
${step.docTemplate}`;
}

function contextBlock(ctx: AssistantContext) {
  const stage = STAGES.find((s) => s.id === ctx.stage);
  const parts = [`# Kontekst uczestnika`, `Etap studia: ${stage ? `${stage.name} — ${stage.focus}` : "jeszcze nie rozpoznany"}`];
  if (ctx.documents.length) {
    parts.push("Zatwierdzone dokumenty (korzystaj z nich, nie pytaj o to samo ponownie):");
    for (const d of ctx.documents) parts.push(`## ${d.title}\n${d.content}`);
  } else {
    parts.push("Brak zatwierdzonych dokumentów.");
  }
  return parts.join("\n\n");
}

export function buildSystem(stepId: string, mode: "chat" | "document", ctx: AssistantContext) {
  const block = stepBlock(stepId);
  if (!block) return null;
  const docRule = mode === "document"
    ? "\n\nTERAZ: wypisz wyłącznie gotowy dokument według szablonu, uzupełniony tym, co ustaliliście. Brakujące pola oznacz „[do uzupełnienia]”. Bez wstępu i komentarzy."
    : "";
  return { staticText: BASE + block + docRule, dynamicText: contextBlock(ctx) };
}

/** Polecenie do skopiowania w trybie „pracuję w swoim czacie”. */
export function buildManualPrompt(stepId: string, ctx: AssistantContext) {
  const block = stepBlock(stepId);
  if (!block) return "";
  return `${BASE}${block}

${contextBlock(ctx)}

# Start
Zacznij od pierwszego pytania tego kroku. Gdy ustalimy wszystko, wypisz gotowy dokument dokładnie według szablonu — wkleję go do platformy Dochodowego Studia.`;
}
