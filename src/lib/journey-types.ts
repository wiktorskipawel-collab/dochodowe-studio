// Typy ścieżki Marketing OS (treść w journey.ts).

export type Lesson = {
  id: string;
  title: string;
  source: string;
  video?: string; // adres odtwarzacza do osadzenia (Loom / YouTube / Bunny Stream)
  skool?: string; // link do lekcji na Skool („Otwórz na Skool”)
  attachments?: string[]; // nazwy materiałów do lekcji (pliki są na Skool)
  opis?: string; // 1 zdanie o lekcji
  ref?: string; // id lekcji w bibliotece kursów (src/lib/kursy.ts), żeby „obejrzane” było wspólne
};

export type Step = {
  id: string; // adres: /krok/<id>
  no: string; // numer na mapie, np. "3"
  phase: string; // nazwa etapu na mapie, np. "Fundament"
  title: string;
  goal: string; // jedno zdanie: po co ten krok
  docId: string; // dokument, który powstaje
  docTitle: string;
  docTemplate: string; // szablon dokumentu (pola), także dla asystenta
  script: string; // jak asystent prowadzi ten krok
  opener: string; // pierwsza wiadomość asystenta na ekranie
  exitCriteria: string[]; // kiedy krok jest skończony
  lessons: Lesson[];
  needs: string[]; // dokumenty, które asystent dostaje jako kontekst
};

export type SurveyQuestion = {
  id: string;
  question: string;
  intro?: string; // co mówi Bartek przed pytaniem
  help?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export type Stage = {
  id: string;
  name: string;
  description: string;
  focus: string; // na czym się skupiamy na tym etapie
  steps: string[]; // proponowana ścieżka (id kroków)
};

export type StepStatus = "locked" | "available" | "draft" | "done";
