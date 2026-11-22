// DANE PRZYKŁADOWE dla panelu zespołu DS. Po podłączeniu bazy (Supabase, Frankfurt) zastąpią je prawdziwe dane.

export type Signal = { text: string; tone: "good" | "warn" | "bad" | "accent" };

export const studios: { name: string; module: string; last: string; leads: string; cpl: string; signal: Signal; ai: string }[] = [
  { name: "Studio Forma · Poznań", module: "01 Strategia", last: "dziś", leads: "46", cpl: "18,40 zł", signal: { text: "W normie", tone: "good" }, ai: "4,10 zł" },
  { name: "Fit Point · Łódź", module: "02 Formularze Meta", last: "wczoraj", leads: "61", cpl: "22,10 zł", signal: { text: "W normie", tone: "good" }, ai: "6,30 zł" },
  { name: "Strefa Ruchu · Kraków", module: "00 DNA", last: "9 dni temu", leads: "–", cpl: "–", signal: { text: "Brak aktywności", tone: "bad" }, ai: "1,20 zł" },
  { name: "EMS Body · Wrocław", module: "02 Follow Ads", last: "2 dni temu", leads: "28", cpl: "41,80 zł", signal: { text: "Koszt leada 2× norma", tone: "warn" }, ai: "5,80 zł" },
  { name: "Moc Studio · Gdańsk", module: "03 Wdrożenie", last: "dziś", leads: "73", cpl: "15,20 zł", signal: { text: "W normie", tone: "good" }, ai: "7,90 zł" },
  { name: "Studio Puls · Katowice", module: "03 Wdrożenie", last: "4 dni temu", leads: "39", cpl: "24,60 zł", signal: { text: "0 z 5 zadań", tone: "warn" }, ai: "3,40 zł" },
  { name: "Core Lab · Szczecin", module: "01 Strategia", last: "dziś", leads: "–", cpl: "–", signal: { text: "Strategia do omówienia", tone: "accent" }, ai: "2,70 zł" },
];

export const alerts: { title: string; text: string; tone: "bad" | "warn" | "accent" }[] = [
  { title: "Strefa Ruchu: 9 dni bez aktywności", text: "AI wysłało 2 przypomnienia, brak reakcji. Zadzwoń.", tone: "bad" },
  { title: "EMS Body: koszt leada 41,80 zł", text: "Diagnoza AI: słaba kreacja, formularz bez kwalifikacji. Rekomendacja: poprawić, nie zmieniać lejka.", tone: "warn" },
  { title: "Core Lab: strategia gotowa", text: "Do omówienia na najbliższym mentoringu grupowym.", tone: "accent" },
];
