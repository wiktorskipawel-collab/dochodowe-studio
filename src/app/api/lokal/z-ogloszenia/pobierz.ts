// Pobieranie strony ogłoszenia z linku podanego przez właściciela — TYLKO SERWER, z ochroną SSRF:
// - tylko http/https, bez loginu w linku, bez numeru portu, bez adresów IP i nazw lokalnych (localhost, intranet, *.local…),
// - adres IP sprawdzany w chwili łączenia (własny `lookup`), więc nazwa nie „przeskoczy” na 127.0.0.1 / 10.x / 192.168.x
//   ani przy przekierowaniu (każde przekierowanie sprawdzamy od nowa, maks. 3),
// - limit czasu 8 s na całość, maks. 2 MB treści (po rozpakowaniu), bez ciasteczek, ogólny User-Agent bez danych osoby.
// Z HTML wyciągamy tytuł, opis z metadanych, dane strukturalne JSON-LD i widoczny tekst. Niczego nie zapisujemy ani nie logujemy.
import dns from "node:dns";
import type { LookupAddress, LookupOptions } from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";

export const LIMITY_POBIERANIA = { timeoutMs: 8_000, maxBajtow: 2 * 1024 * 1024, przekierowania: 3, tekstStrony: 12_000, jsonLd: 4_000 } as const;

export const KOMUNIKAT_BLOKADA = "Ten portal nie pozwala pobrać ogłoszenia — wklej jego treść.";
const KOMUNIKAT_ADRES = "Ten adres nie prowadzi do publicznej strony z ogłoszeniem.";
const UA = "Mozilla/5.0 (compatible; MarketingOS-Lokal/1.0)";

// ——— Adresy, do których serwer nigdy się nie łączy ———
// Dwie osobne listy: BlockList sprawdza adresy IPv4 także względem reguł IPv6 (::ffff:0:0/96), więc wspólna lista
// z regułą dla „IPv4 zapisanego jako IPv6” blokowałaby cały internet.
const PRYWATNE_V4 = new net.BlockList();
for (const [adres, prefiks] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) PRYWATNE_V4.addSubnet(adres, prefiks, "ipv4");
const PRYWATNE_V6 = new net.BlockList();
for (const [adres, prefiks] of [
  ["::", 96], // ::, ::1 i stare „IPv4-compatible”
  ["::ffff:0:0", 96], // IPv4 zapisane jako IPv6 (np. ::ffff:127.0.0.1) — DNS takich nie zwraca, więc blokujemy wszystkie
  ["64:ff9b::", 96], ["64:ff9b:1::", 48], // NAT64 (może prowadzić do adresów prywatnych)
  ["100::", 64], ["2001::", 32], ["2001:db8::", 32], ["2002::", 16],
  ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
] as const) PRYWATNE_V6.addSubnet(adres, prefiks, "ipv6");

export function adresPrywatny(ip: string): boolean {
  try {
    if (net.isIPv4(ip)) return PRYWATNE_V4.check(ip, "ipv4");
    if (net.isIPv6(ip)) return PRYWATNE_V6.check(ip, "ipv6");
  } catch {
    // nietypowy zapis (np. ze strefą %eth0) traktujemy jak prywatny
  }
  return true;
}

const ZLE_KONCOWKI = ["localhost", "local", "localdomain", "internal", "intranet", "lan", "home", "corp", "arpa", "test", "invalid", "example", "onion"];

/** Sprawdzenie linku bez sieci (format, protokół, nazwa hosta). Adres IP po DNS sprawdza dopiero `bezpiecznyLookup`. */
export function sprawdzLink(raw: string): { ok: true; url: URL } | { ok: false; blad: string } {
  const v = raw.trim();
  if (!v) return { ok: false, blad: "Pusty link." };
  if (v.length > 2048) return { ok: false, blad: "Link jest za długi." };
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return { ok: false, blad: "To nie wygląda na link. Skopiuj cały adres z paska przeglądarki (zaczyna się od https://)." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, blad: "Link musi zaczynać się od https:// albo http://." };
  if (url.username || url.password) return { ok: false, blad: "Link nie może zawierać loginu ani hasła." };
  if (url.port) return { ok: false, blad: "Wklej zwykły link do ogłoszenia (bez numeru portu)." };
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") || net.isIP(host)) return { ok: false, blad: "Wklej link z nazwą portalu (np. olx.pl), a nie adres IP." };
  const koncowka = host.split(".").pop() ?? "";
  if (!host.includes(".") || ZLE_KONCOWKI.includes(koncowka)) return { ok: false, blad: KOMUNIKAT_ADRES };
  return { ok: true, url };
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** DNS w chwili łączenia: jeśli którykolwiek adres jest prywatny/lokalny — nie łączymy się wcale. */
function bezpiecznyLookup(hostname: string, options: LookupOptions, callback: LookupCallback) {
  dns.lookup(hostname, { family: options.family, hints: options.hints, all: true }, (err, adresy) => {
    if (err) return callback(err, "", 0);
    if (!adresy.length || adresy.some((a) => adresPrywatny(a.address))) {
      const e: NodeJS.ErrnoException = new Error("Adres prywatny");
      e.code = "EADRESPRYWATNY";
      return callback(e, "", 0);
    }
    if (options.all) callback(null, adresy);
    else callback(null, adresy[0].address, adresy[0].family);
  });
}

type Surowa = { status: number; typ: string; location?: string; body: Buffer | null };
const TYPY_OK = ["text/html", "application/xhtml+xml", "text/plain", "application/json", "application/ld+json"];

function pobierzRaz(url: URL, signal: AbortSignal): Promise<Surowa> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(url, {
      method: "GET",
      agent: false, // nowe połączenie, bez współdzielenia i bez ciasteczek
      lookup: bezpiecznyLookup,
      signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8,*/*;q=0.1",
        "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
      },
    }, (res) => {
      const status = res.statusCode ?? 0;
      const typ = String(res.headers["content-type"] ?? "").toLowerCase();
      const location = res.headers.location;
      if (status >= 300 && status < 400 && location) {
        res.resume();
        return resolve({ status, typ, location, body: null });
      }
      if (status < 200 || status >= 300 || (typ && !TYPY_OK.some((t) => typ.includes(t)))) {
        res.resume();
        return resolve({ status, typ, body: null });
      }
      const enc = String(res.headers["content-encoding"] ?? "").toLowerCase().trim();
      let strumien: NodeJS.ReadableStream = res;
      if (enc === "gzip" || enc === "x-gzip") strumien = res.pipe(zlib.createGunzip());
      else if (enc === "deflate") strumien = res.pipe(zlib.createInflate());
      else if (enc === "br") strumien = res.pipe(zlib.createBrotliDecompress());
      else if (enc && enc !== "identity") {
        res.resume();
        return resolve({ status: 415, typ, body: null });
      }
      const czesci: Buffer[] = [];
      let rozmiar = 0;
      let koniec = false;
      const zakoncz = () => {
        if (koniec) return;
        koniec = true;
        resolve({ status, typ, body: Buffer.concat(czesci) });
        res.destroy();
      };
      const blad = (e: Error) => {
        if (koniec) return;
        koniec = true;
        reject(e);
      };
      strumien.on("data", (c: Buffer) => {
        if (koniec) return;
        const reszta = LIMITY_POBIERANIA.maxBajtow - rozmiar;
        if (c.length >= reszta) {
          // limit 2 MB (po rozpakowaniu): bierzemy początek strony, resztę odrzucamy
          czesci.push(c.subarray(0, reszta));
          rozmiar = LIMITY_POBIERANIA.maxBajtow;
          zakoncz();
        } else {
          czesci.push(c);
          rozmiar += c.length;
        }
      });
      strumien.on("end", zakoncz);
      strumien.on("error", blad);
      if (strumien !== res) res.on("error", blad);
    });
    req.on("error", reject);
    req.end();
  });
}

function dekoduj(body: Buffer, typ: string): string {
  let charset = typ.match(/charset=["']?([\w-]+)/i)?.[1];
  if (!charset) {
    const poczatek = body.subarray(0, 4096).toString("latin1");
    charset = poczatek.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1];
  }
  try {
    return new TextDecoder(charset || "utf-8").decode(body);
  } catch {
    return new TextDecoder("utf-8").decode(body);
  }
}

const ENCJE: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", oacute: "ó", Oacute: "Ó", sup2: "²", sup3: "³", euro: "€",
  ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»", bdquo: "„", rdquo: "”", ldquo: "“", rsquo: "’", lsquo: "‘",
  middot: "·", deg: "°", times: "×", shy: "", zwj: "", zwnj: "",
};
export function encje(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, k: string) => {
    if (k[0] !== "#") return ENCJE[k] ?? m;
    const cp = k[1] === "x" || k[1] === "X" ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : " ";
  });
}

const atrybut = (tag: string, nazwa: string) => tag.match(new RegExp(`\\b${nazwa}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(1).find((x) => x != null);

/** Dane strukturalne bez śmieci (zdjęcia, logo, okruszki), żeby AI dostało same parametry ogłoszenia. */
function ldCzysc(v: unknown, glebokosc = 0): unknown {
  if (glebokosc > 6) return undefined;
  if (Array.isArray(v)) {
    const lista = v.map((x) => ldCzysc(x, glebokosc + 1)).filter((x) => x !== undefined).slice(0, 20);
    return lista.length ? lista : undefined;
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (/^(BreadcrumbList|WebSite|WebPage|Organization|SearchAction|ImageObject|SiteNavigationElement)$/i.test(String(o["@type"] ?? ""))) return undefined;
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(o)) {
      if (/^(@context|@id|image|images|logo|photo|potentialAction|breadcrumb|url|sameAs|thumbnailUrl)$/i.test(k)) continue;
      const c = ldCzysc(x, glebokosc + 1);
      if (c !== undefined && c !== "") out[k] = c;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (typeof v === "string") return v.slice(0, 2000);
  return v;
}

const ZNACZNIKI_BLOKADY = /captcha|cf-chl|cf_chl|challenge-platform|datadome|px-captcha|perimeterx|incapsula|are you a robot|jeste[sś] robotem|just a moment|attention required|access denied|request unsuccessful/i;

/** HTML → tytuł, opis, JSON-LD i widoczny tekst (bez skryptów, stylów, nawigacji i stopki). */
export function htmlNaTekst(html: string): { tekst: string; zablokowane: boolean } {
  const czesci: string[] = [];
  const tytul = html.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1];
  if (tytul?.trim()) czesci.push(`Tytuł strony: ${encje(tytul).replace(/\s+/g, " ").trim()}`);

  const meta = new Set<string>();
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const nazwa = (atrybut(m[0], "property") ?? atrybut(m[0], "name") ?? "").toLowerCase();
    if (!/^(og:title|og:description|description|twitter:description)$/.test(nazwa)) continue;
    const tresc = encje(atrybut(m[0], "content") ?? "").replace(/\s+/g, " ").trim();
    if (tresc) meta.add(tresc.slice(0, 1500));
  }
  if (meta.size) czesci.push(`Opis z metadanych:\n${[...meta].join("\n")}`);

  const ld: string[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try {
      const c = ldCzysc(JSON.parse(m[1].trim()));
      if (c !== undefined) ld.push(JSON.stringify(c));
    } catch {
      // uszkodzony JSON-LD pomijamy
    }
  }
  if (ld.length) czesci.push(`Dane strukturalne (JSON-LD):\n${ld.join("\n").slice(0, LIMITY_POBIERANIA.jsonLd)}`);

  const widoczny = encje(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template|iframe|head|canvas|select|button|nav|footer)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h[1-6]|dt|dd|section|article|ul|ol|table|header|main|aside|blockquote|label)\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((l) => l.replace(/[ \t\f\v ]+/g, " ").trim())
    .filter((l, i, a) => l && l !== a[i - 1])
    .join("\n");
  if (widoczny) czesci.push(`Treść strony:\n${widoczny.slice(0, LIMITY_POBIERANIA.tekstStrony)}`);

  const tekst = czesci.join("\n\n");
  const zablokowane = widoczny.length < 1500 && ZNACZNIKI_BLOKADY.test(html.slice(0, 200_000));
  return { tekst, zablokowane };
}

export type Pobranie =
  | { ok: true; url: string; tekst: string }
  | { ok: false; url: string; rodzaj: "adres" | "blokada" | "blad"; blad: string };

/** Pobiera jedno ogłoszenie. Nigdy nie rzuca wyjątku — zwraca komunikat dla właściciela. */
export async function pobierzOgloszenie(start: URL): Promise<Pobranie> {
  const signal = AbortSignal.timeout(LIMITY_POBIERANIA.timeoutMs);
  const nie = (rodzaj: "adres" | "blokada" | "blad", blad: string): Pobranie => ({ ok: false, url: start.href, rodzaj, blad });
  let url = start;
  try {
    for (let i = 0; ; i++) {
      const r = await pobierzRaz(url, signal);
      if (r.location) {
        if (i >= LIMITY_POBIERANIA.przekierowania) return nie("blad", "Strona przekierowuje za wiele razy. Wklej treść ogłoszenia.");
        let nastepny: URL;
        try {
          nastepny = new URL(r.location, url);
        } catch {
          return nie("blad", "Strona ogłoszenia przekierowuje na błędny adres. Wklej treść ogłoszenia.");
        }
        const s = sprawdzLink(nastepny.href);
        if (!s.ok) return nie("adres", KOMUNIKAT_ADRES);
        url = s.url;
        continue;
      }
      if ([401, 403, 407, 429, 451, 503].includes(r.status)) return nie("blokada", KOMUNIKAT_BLOKADA);
      if (r.status === 404 || r.status === 410) return nie("blad", "Tego ogłoszenia już nie ma (strona nie istnieje). Wklej jego treść, jeśli ją masz.");
      if (r.status < 200 || r.status >= 300) return nie("blad", `Strona ogłoszenia nie odpowiedziała poprawnie (kod ${r.status}). Wklej treść ogłoszenia.`);
      if (!r.body) return nie("blad", "Pod tym linkiem nie ma strony z ogłoszeniem. Wklej treść ogłoszenia.");
      const tresc = dekoduj(r.body, r.typ);
      if (r.typ.includes("json") || r.typ.includes("text/plain")) return { ok: true, url: url.href, tekst: tresc.slice(0, LIMITY_POBIERANIA.tekstStrony) };
      const { tekst, zablokowane } = htmlNaTekst(tresc);
      if (zablokowane || tekst.length < 200) return nie("blokada", KOMUNIKAT_BLOKADA);
      return { ok: true, url: url.href, tekst };
    }
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e?.code === "EADRESPRYWATNY") return nie("adres", KOMUNIKAT_ADRES);
    if (signal.aborted || e?.name === "AbortError" || e?.name === "TimeoutError") return nie("blad", "Strona ogłoszenia odpowiada za wolno. Wklej treść ogłoszenia.");
    if (e?.code === "ENOTFOUND" || e?.code === "EAI_AGAIN") return nie("adres", "Nie ma takiej strony. Sprawdź link albo wklej treść ogłoszenia.");
    return nie("blad", "Nie udało się pobrać ogłoszenia. Wklej jego treść.");
  }
}
