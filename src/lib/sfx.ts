// Dźwięki nagród w stylu aplikacji do nauki (Duolingo): syntezowane w przeglądarce (Web Audio), bez plików.
// Grają tylko po kliknięciu uczestnika (przeglądarki blokują dźwięk bez gestu). Wyłącznik: menu konta → „Dźwięki nagród”.

export type Sfx = "xp" | "fanfare" | "badge" | "level" | "unlock" | "tap";

const KEY = "ds:dzwieki";
let ctx: AudioContext | null = null;

export function soundOn() {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // bez localStorage: zostaje domyślnie włączone
  }
}

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Jedna nuta z łagodnym narastaniem i wybrzmieniem. */
function note(a: AudioContext, freq: number, at: number, dur: number, type: OscillatorType = "triangle", gain = 0.12) {
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(a.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, D6 = 1174.66, E6 = 1318.51, G6 = 1567.98, A6 = 1760, C7 = 2093;

export function play(kind: Sfx) {
  if (!soundOn()) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.02;
  switch (kind) {
    case "tap":
      note(a, A5, t, 0.06, "sine", 0.05);
      break;
    case "xp": // „dzyń”: dwie szybkie nuty w górę
      note(a, E6, t, 0.12, "sine", 0.11);
      note(a, A6, t + 0.08, 0.28, "sine", 0.11);
      break;
    case "unlock": // przesuwający się dźwięk + kliknięcie zamka
      {
        const osc = a.createOscillator();
        const g = a.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.22);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(g).connect(a.destination);
        osc.start(t);
        osc.stop(t + 0.35);
        note(a, C7, t + 0.24, 0.12, "square", 0.03);
      }
      break;
    case "badge": // iskierki
      [G6, A6, C7, E6, C7].forEach((f, i) => note(a, f, t + i * 0.07, 0.22, "sine", 0.07));
      break;
    case "fanfare": // arpeggio C-dur + akord
      [C5, E5, G5, C6].forEach((f, i) => note(a, f, t + i * 0.09, 0.22, "triangle", 0.11));
      [C6, E6, G6].forEach((f) => note(a, f, t + 0.4, 0.7, "triangle", 0.06));
      break;
    case "level": // wyżej i dłużej niż fanfara
      [G5, C6, D6, E6, G6].forEach((f, i) => note(a, f, t + i * 0.08, 0.2, "triangle", 0.1));
      [C6, E6, G6, C7].forEach((f) => note(a, f, t + 0.45, 0.9, "triangle", 0.055));
      note(a, C5, t + 0.45, 0.9, "sine", 0.08);
      break;
  }
}
