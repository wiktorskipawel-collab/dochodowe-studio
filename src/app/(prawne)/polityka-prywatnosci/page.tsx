// SZKIC polityki prywatności (do zatwierdzenia przez prawnika). Fakty techniczne z kodu i WDROZENIE.md:
// Supabase (Frankfurt) = konta i postęp, Vercel (fra1) = serwer, AI przez OpenRouter (src/lib/ai.ts, modele z src/lib/models.ts),
// serwer nie zapisuje ani nie loguje treści rozmów, zdjęć nie zapisujemy, licznik tokenów w tabeli ai_usage.
import Link from "next/link";
import { Fill, LegalDoc, LegalSection, Points } from "../legal";

export const metadata = { title: "Polityka prywatności · Dochodowe Studio", robots: { index: false } };

export default function Page() {
  return (
    <LegalDoc
      title="Polityka prywatności"
      lead={<>Jak platforma Dochodowe Studio przetwarza Twoje dane: co zapisujemy, co trafia do zewnętrznego modelu AI, komu przekazujemy dane i jakie masz prawa.</>}
    >
      <LegalSection id="administrator" title="1. Kto odpowiada za Twoje dane">
        <p>
          Administratorem danych osobowych jest <Fill>[NAZWA FIRMY BARTKA]</Fill>, <Fill>[ADRES]</Fill>, NIP <Fill>[NIP]</Fill> (dalej: „my”).
          W sprawach danych osobowych napisz na <Fill>[E-MAIL]</Fill>.
        </p>
      </LegalSection>

      <LegalSection id="dane" title="2. Jakie dane przetwarzamy">
        <Points>
          <li><strong>Konto:</strong> imię, adres e-mail i hasło. Hasło przechowuje dostawca logowania wyłącznie w postaci zaszyfrowanego skrótu, nie znamy go. Przy logowaniu przez Google: imię, adres e-mail i identyfikator konta Google.</li>
          <li><strong>Ścieżka programu:</strong> odpowiedzi z ankiety startowej, postęp w krokach, obejrzane lekcje, dokumenty tworzone w krokach (np. oferta, opis klienta) i dane lokali z kalkulatora.</li>
          <li><strong>Rozmowy z asystentem AI:</strong> treść wiadomości, wklejone transkrypcje oraz zdjęcia i nagrania dołączone do wiadomości.</li>
          <li><strong>Dane techniczne:</strong> licznik wykorzystania AI (liczba zapytań i tokenów w miesiącu), dane sesji logowania oraz adres IP i informacje o przeglądarce w dziennikach serwera.</li>
        </Points>
      </LegalSection>

      <LegalSection id="cele" title="3. Po co przetwarzamy dane i na jakiej podstawie">
        <Points>
          <li>Prowadzenie konta, ścieżki programu, lekcji, asystenta i narzędzi AI oraz zapis postępu: wykonanie umowy (art. 6 ust. 1 lit. b RODO).</li>
          <li>Miesięczny limit AI, bezpieczeństwo i zapobieganie nadużyciom: nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).</li>
          <li>Odpowiedzi na wiadomości i reklamacje: wykonanie umowy i nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. b i f RODO).</li>
          <li>Rozliczenia i obowiązki podatkowe <Fill>[JEŚLI DOTYCZY]</Fill>: obowiązek prawny (art. 6 ust. 1 lit. c RODO).</li>
          <li>Ustalenie, dochodzenie lub obrona roszczeń: nasz prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).</li>
        </Points>
      </LegalSection>

      <LegalSection id="ai" title="4. Asystent AI: co trafia do zewnętrznego modelu">
        <Points>
          <li>
            Rozmowy obsługuje zewnętrzny model AI. Treść wiadomości razem z dokumentami z wcześniejszych kroków (potrzebnymi do odpowiedzi), zdjęcia i nagrania
            wysyłamy przez pośrednika OpenRouter do dostawcy wybranego modelu, np. DeepSeek (rozmowy) i Google (zdjęcia i nagrania). <Fill>[DO UZUPEŁNIENIA: aktualna lista dostawców, kraje przetwarzania, podstawa przekazania poza EOG, np. standardowe klauzule umowne]</Fill>
          </li>
          <li><Fill>[DO POTWIERDZENIA: w ustawieniach OpenRouter włączeni tylko dostawcy, którzy nie trenują modeli na przesłanych danych i ich nie przechowują]</Fill></li>
          <li>Serwer aplikacji nie zapisuje i nie loguje treści rozmów. Historia rozmów zapisuje się na Twoim koncie (w bazie danych) i w tej przeglądarce, żeby można było wrócić do pracy. Zdjęć nie zapisujemy: idą tylko z jedną wiadomością.</li>
          <li>Dyktowanie głosem: w przeglądarkach Chrome i Edge mowę na tekst zamienia usługa przeglądarki (Google albo Microsoft), a nie nasz serwer.</li>
          <li>Odpowiedzi AI powstają automatycznie i mogą zawierać błędy. Nie podejmujemy na ich podstawie decyzji, które wywołują wobec Ciebie skutki prawne (art. 22 RODO).</li>
          <li>
            <strong>Nie wpisuj danych zdrowotnych ani danych kontaktowych klientów</strong> (nazwisk, telefonów, adresów). Zamiast nazwisk używaj imion albo opisów, np. „osoba 1”.
            Za dane osób trzecich, które wklejasz do rozmowy, odpowiadasz Ty.
          </li>
        </Points>
      </LegalSection>

      <LegalSection id="odbiorcy" title="5. Komu przekazujemy dane">
        <p>Korzystamy z usług firm, które przetwarzają dane w naszym imieniu na podstawie umów powierzenia (art. 28 RODO):</p>
        <Points>
          <li><strong>Supabase:</strong> baza danych i logowanie (serwery w Unii Europejskiej, Frankfurt).</li>
          <li><strong>Vercel:</strong> serwer aplikacji (region Frankfurt). <Fill>[DO SPRAWDZENIA: lokalizacja dzienników i sieci CDN]</Fill></li>
          <li><strong>OpenRouter i dostawcy modeli AI:</strong> odpowiedzi asystenta i narzędzi AI (punkt 4).</li>
          <li><strong>Google:</strong> logowanie przez Google (jeśli je wybierzesz).</li>
          <li><strong>Loom i YouTube:</strong> odtwarzanie nagrań lekcji w osadzonych odtwarzaczach. <Fill>[DO SPRAWDZENIA: pliki cookie odtwarzaczy]</Fill></li>
          <li><strong>Poczta e-mail:</strong> maile z potwierdzeniem konta i z linkiem do nowego hasła. <Fill>[DO UZUPEŁNIENIA: dostawca, np. Resend]</Fill></li>
          <li><Fill>[DO UZUPEŁNIENIA: biuro rachunkowe, operator płatności, jeśli dotyczy]</Fill></li>
        </Points>
      </LegalSection>

      <LegalSection id="czas" title="6. Jak długo przechowujemy dane">
        <Points>
          <li>Konto, postęp, dokumenty i historia rozmów: przez czas korzystania z platformy <Fill>[DO USTALENIA: okres dostępu do programu]</Fill>. Po usunięciu konta usuwamy je w ciągu <Fill>[30]</Fill> dni, a z kopii zapasowych w ciągu <Fill>[X]</Fill> dni.</li>
          <li>Licznik wykorzystania AI: <Fill>[12 miesięcy]</Fill>.</li>
          <li>Dane rozliczeniowe: 5 lat od końca roku podatkowego, w którym powstał obowiązek podatkowy <Fill>[JEŚLI DOTYCZY]</Fill>.</li>
          <li>Dane potrzebne do obrony roszczeń: do upływu terminu przedawnienia.</li>
          <li>Kopia postępu w przeglądarce: do wyczyszczenia danych przeglądarki.</li>
        </Points>
      </LegalSection>

      <LegalSection id="prawa" title="7. Twoje prawa">
        <p>
          Masz prawo do dostępu do swoich danych i ich kopii, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu wobec
          przetwarzania na podstawie naszego uzasadnionego interesu. Napisz na <Fill>[E-MAIL]</Fill>, odpowiemy w ciągu miesiąca. Imię i hasło zmienisz w{" "}
          <Link href="/ustawienia" className="font-semibold underline underline-offset-4 hover:text-white">Ustawieniach konta</Link>.
        </p>
        <p>Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).</p>
      </LegalSection>

      <LegalSection id="cookies" title="8. Pliki cookie i pamięć przeglądarki">
        <Points>
          <li>Niezbędne pliki cookie logowania (sesja konta).</li>
          <li>Pamięć przeglądarki: kopia postępu i ustawienia (np. dźwięki nagród).</li>
          <li>Nie używamy plików cookie reklamowych ani analitycznych. <Fill>[DO POTWIERDZENIA przed startem]</Fill></li>
        </Points>
      </LegalSection>

      <LegalSection id="dobrowolnosc" title="9. Czy trzeba podać dane">
        <p>Imię i adres e-mail są potrzebne do założenia konta. To, co wpisujesz w rozmowach i dokumentach, zależy od Ciebie.</p>
      </LegalSection>

      <LegalSection id="zmiany" title="10. Zmiany polityki">
        <p>O zmianach poinformujemy w aplikacji albo mailem. Wersja obowiązuje od <Fill>[DATA]</Fill>.</p>
      </LegalSection>
    </LegalDoc>
  );
}
