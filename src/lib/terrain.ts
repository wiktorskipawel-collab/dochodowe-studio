// Mapa ścieżki jako teren w rzucie izometrycznym (czyste obliczenia, bez Reacta).
// Kroki stoją na szlaku, który wije się od dołu mapy aż na szczyt góry. Każdy etap ma własną strefę na terenie.

export const VW = 1200; // szerokość viewBox
export const VH = 730; // wysokość viewBox
const COLS = 23; // teren w jednostkach siatki
const ROWS = 15;
const S = 34; // długość jednostki
const CX = 0.8660254 * S;
const CY = 0.5 * S;
const OX = ROWS * CX + 40;
const OY = 44;
export const LIFT = 42; // o ile punkt kroku „unosi się” nad terenem

type Pt = [number, number];

// Wzgórza: [x, y, wysokość, rozmycie]. Największe = szczyt, na którym kończy się ścieżka.
const HILLS: [number, number, number, number][] = [
  [18.5, 3.2, 185, 3.1],
  [6, 8.5, 40, 2.6],
  [12.5, 11.5, 28, 2.8],
  [2.5, 3, 22, 2.2],
  [21, 12.5, 18, 2],
];

export function height(x: number, y: number) {
  let h = 0;
  for (const [hx, hy, a, s] of HILLS) h += a * Math.exp(-((x - hx) ** 2 + (y - hy) ** 2) / (2 * s * s));
  return h + 5 * Math.sin(x * 0.9) * Math.cos(y * 0.7);
}

/** Punkt terenu (x, y w jednostkach siatki) → punkt na ekranie (viewBox). */
export function proj(x: number, y: number, lift = 0): Pt {
  return [(x - y) * CX + OX, (x + y) * CY + OY - height(x, y) - lift];
}

const f = (n: number) => n.toFixed(1);
const path = (pts: Pt[], close = false) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("") + (close ? "Z" : "");

/** Siatka terenu: jedna ścieżka SVG z liniami w obu kierunkach. */
export const TERRAIN = (() => {
  const d: string[] = [];
  for (let y = 0; y <= ROWS; y++) {
    const pts: Pt[] = [];
    for (let x = 0; x <= COLS; x += 0.5) pts.push(proj(x, y));
    d.push(path(pts));
  }
  for (let x = 0; x <= COLS; x++) {
    const pts: Pt[] = [];
    for (let y = 0; y <= ROWS; y += 0.5) pts.push(proj(x, y));
    d.push(path(pts));
  }
  return d.join("");
})();

// Szlak: wężykiem od lewego dołu, przez środek, na szczyt.
const TRAIL: Pt[] = [[2, 12.5], [16, 12.5], [19, 8], [5.5, 7.5], [4, 3.2], [18.5, 3.2]];
const SEG = TRAIL.slice(1).map((p, i) => Math.hypot(p[0] - TRAIL[i][0], p[1] - TRAIL[i][1]));
const TOTAL = SEG.reduce((a, b) => a + b, 0);

function trailAt(d: number): Pt {
  let rest = Math.max(0, Math.min(TOTAL, d));
  let i = 0;
  while (i < SEG.length - 1 && rest > SEG[i]) {
    rest -= SEG[i];
    i++;
  }
  const t = SEG[i] ? Math.min(1, rest / SEG[i]) : 0;
  return [TRAIL[i][0] + (TRAIL[i + 1][0] - TRAIL[i][0]) * t, TRAIL[i][1] + (TRAIL[i + 1][1] - TRAIL[i][1]) * t];
}

export type MapNode = { grid: Pt; ground: Pt; top: Pt; dist: number };
export type MapZone = { group: number; fill: string; edge: string; label: Pt };
export type MapLayout = { nodes: MapNode[]; links: string[]; zones: MapZone[]; footprint: (i: number) => { base: string; cone: string } };

/**
 * Układ mapy dla n kroków. groups[i] = numer etapu kroku i (kroki tego samego etapu muszą stać obok siebie).
 * links[i] = droga od kroku i do kroku i+1 (po terenie).
 */
export function layout(groups: number[]): MapLayout {
  const n = groups.length;
  const dists = groups.map((_, k) => (n === 1 ? 0 : (TOTAL * k) / (n - 1)));
  const nodes: MapNode[] = dists.map((dist) => {
    const g = trailAt(dist);
    return { grid: g, ground: proj(g[0], g[1]), top: proj(g[0], g[1], LIFT), dist };
  });

  const links = dists.slice(0, -1).map((d0, k) => {
    const d1 = dists[k + 1];
    const pts: Pt[] = [];
    for (let d = d0; d < d1; d += 0.25) pts.push(proj(...trailAt(d)));
    pts.push(proj(...trailAt(d1)));
    return path(pts);
  });

  // Strefy etapów: kratki terenu najbliżej odcinka szlaku danego etapu.
  const gap = n > 1 ? TOTAL / (n - 1) : TOTAL;
  const samples: { p: Pt; g: number }[] = [];
  dists.forEach((d, k) => {
    for (let s = d - gap / 2; s <= d + gap / 2; s += 0.4) {
      const sameNext = k + 1 < n && groups[k + 1] === groups[k];
      const samePrev = k > 0 && groups[k - 1] === groups[k];
      if ((s > d && !sameNext && s > d + 0.9) || (s < d && !samePrev && s < d - 0.9)) continue;
      if (s < 0 || s > TOTAL) continue;
      samples.push({ p: trailAt(s), g: groups[k] });
    }
  });
  const R = 1.75;
  const owner: number[][] = [];
  for (let i = 0; i < COLS; i++) {
    owner[i] = [];
    for (let j = 0; j < ROWS; j++) {
      const cx = i + 0.5;
      const cy = j + 0.5;
      let best = -1;
      let bd = R;
      for (const s of samples) {
        const dd = Math.hypot(s.p[0] - cx, s.p[1] - cy);
        if (dd < bd) {
          bd = dd;
          best = s.g;
        }
      }
      owner[i][j] = best;
    }
  }
  const own = (i: number, j: number) => (i < 0 || j < 0 || i >= COLS || j >= ROWS ? -1 : owner[i][j]);
  const edge = (a: Pt, b: Pt) => path([proj(...a), proj((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), proj(...b)]);

  const ids = [...new Set(groups)];
  const zones: MapZone[] = ids.map((group) => {
    const fill: string[] = [];
    const edges: string[] = [];
    for (let i = 0; i < COLS; i++)
      for (let j = 0; j < ROWS; j++) {
        if (owner[i][j] !== group) continue;
        fill.push(path([proj(i, j), proj(i + 1, j), proj(i + 1, j + 1), proj(i, j + 1)], true));
        if (own(i, j - 1) !== group) edges.push(edge([i, j], [i + 1, j]));
        if (own(i + 1, j) !== group) edges.push(edge([i + 1, j], [i + 1, j + 1]));
        if (own(i, j + 1) !== group) edges.push(edge([i, j + 1], [i + 1, j + 1]));
        if (own(i - 1, j) !== group) edges.push(edge([i, j], [i, j + 1]));
      }
    // podpis etapu: pod podstawą pierwszego kroku etapu
    const first = nodes[groups.indexOf(group)].ground;
    return { group, fill: fill.join(""), edge: edges.join(""), label: [first[0], first[1] + 26] as Pt };
  });

  // „Stożek” pod aktualnym krokiem: romb na terenie + linie od punktu kroku do jego rogów.
  const footprint = (k: number) => {
    const [x, y] = nodes[k].grid;
    const r = 1.1;
    const c = [proj(x - r, y - r), proj(x + r, y - r), proj(x + r, y + r), proj(x - r, y + r)];
    const [tx, ty] = nodes[k].top;
    return { base: path(c, true), cone: c.map(([cx, cy]) => `M${f(tx)} ${f(ty)}L${f(cx)} ${f(cy)}`).join("") };
  };

  return { nodes, links, zones, footprint };
}
