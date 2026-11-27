// Pobieranie dokumentów jako zwykły tekst (.txt, UTF-8) — otworzy je każdy komputer i telefon.

export function fileName(title: string) {
  const base = title.toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "dokument"}.txt`;
}

export function downloadText(name: string, text: string) {
  // BOM na początku: starsze Notatniki w Windows poprawnie pokażą polskie znaki.
  const url = URL.createObjectURL(new Blob(["﻿" + text.replace(/\r?\n/g, "\r\n")], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
