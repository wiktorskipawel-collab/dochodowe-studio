// SZKIC regulaminu platformy (do zatwierdzenia przez prawnika). Miejsca [W NAWIASACH] uzupełnia Bartek z prawnikiem.
import Link from "next/link";
import { Fill, LegalDoc, LegalSection, Points } from "../legal";

export const metadata = { title: "Regulamin · Dochodowe Studio", robots: { index: false } };

const A = "font-semibold underline underline-offset-4 hover:text-white";

export default function Page() {
  return (
    <LegalDoc
      title="Regulamin platformy Dochodowe Studio"
      lead={<>Zasady korzystania z platformy: konto, lekcje, asystent AI, prawa do materiałów i reklamacje.</>}
    >
      <LegalSection id="uslugodawca" title="§ 1. Kto prowadzi platformę">
        <p>
          Platformę Dochodowe Studio (dalej: Platforma) prowadzi <Fill>[NAZWA FIRMY BARTKA]</Fill>, <Fill>[ADRES]</Fill>, NIP <Fill>[NIP]</Fill>,
          e-mail <Fill>[E-MAIL]</Fill> (dalej: Usługodawca).
        </p>
      </LegalSection>

      <LegalSection id="platforma" title="§ 2. Czym jest Platforma">
        <Points ordered>
          <li>Platforma to serwis internetowy dla uczestników programu Dochodowe Studio: ścieżka kroków, lekcje wideo, asystent AI, narzędzia AI, kalkulator lokalu i wzory dokumentów.</li>
          <li>
            Platforma jest przeznaczona dla osób, które prowadzą albo zakładają studio treningowe.{" "}
            <Fill>[DO DECYZJI PRAWNIKA: osoby prowadzące jednoosobową działalność jako przedsiębiorcy na prawach konsumenta, art. 38a ustawy o prawach konsumenta]</Fill>
          </li>
        </Points>
      </LegalSection>

      <LegalSection id="wymagania" title="§ 3. Wymagania techniczne">
        <p>Do korzystania z Platformy potrzebne są: urządzenie z dostępem do internetu, aktualna przeglądarka (np. Chrome, Edge, Safari, Firefox) z włączonym JavaScriptem i plikami cookie oraz adres e-mail.</p>
      </LegalSection>

      <LegalSection id="konto" title="§ 4. Konto">
        <Points ordered>
          <li>Konto zakładasz adresem e-mail i hasłem albo kontem Google. Warunkiem jest akceptacja Regulaminu i Polityki prywatności.</li>
          <li>Dostęp do Platformy obejmuje okres <Fill>[DO UZUPEŁNIENIA: np. czas trwania programu i X miesięcy po nim]</Fill> na zasadach umowy uczestnictwa w programie.</li>
          <li>Konto jest osobiste. Nie udostępniasz hasła ani konta innym osobom. Zapomniane hasło ustawisz na nowo linkiem „Nie pamiętasz hasła?” na stronie logowania.</li>
          <li>Konto możesz usunąć w każdej chwili: napisz na <Fill>[E-MAIL]</Fill>. <Fill>[DO UZUPEŁNIENIA: przycisk „Usuń konto” w Ustawieniach]</Fill></li>
        </Points>
      </LegalSection>

      <LegalSection id="ai" title="§ 5. Asystent AI i narzędzia AI">
        <Points ordered>
          <li>Odpowiedzi asystenta i narzędzi AI tworzy automatycznie zewnętrzny model AI (dostawcy modeli przez pośrednika OpenRouter). Mogą być niepełne albo błędne.</li>
          <li>Odpowiedzi AI są pomocą w pracy, a nie poradą prawną, podatkową, księgową ani medyczną. Decyzje podejmujesz Ty. Wzory umów i inne ważne dokumenty skonsultuj z prawnikiem.</li>
          <li>Nie wpisuj danych zdrowotnych ani danych kontaktowych klientów, a także innych danych osób trzecich bez podstawy prawnej.</li>
          <li>Asystent ma miesięczny limit wykorzystania. Po jego wyczerpaniu limit odnawia się 1. dnia kolejnego miesiąca.</li>
          <li>Zabronione jest obchodzenie limitów, automatyczne wysyłanie zapytań, próby wydobycia instrukcji asystenta oraz wpisywanie treści bezprawnych.</li>
        </Points>
      </LegalSection>

      <LegalSection id="tresci" title="§ 6. Materiały i prawa autorskie">
        <Points ordered>
          <li>Lekcje, nagrania, opisy kroków, szablony, wzory i inne materiały należą do Usługodawcy albo jego licencjodawców i są chronione prawem autorskim.</li>
          <li>Możesz z nich korzystać na potrzeby własnego studia. Bez zgody Usługodawcy nie wolno ich kopiować, nagrywać, udostępniać ani sprzedawać innym osobom.</li>
          <li>Dokumenty, które tworzysz na Platformie (np. ofertę, opis klienta), możesz swobodnie wykorzystywać w swoim studiu.</li>
        </Points>
      </LegalSection>

      <LegalSection id="odpowiedzialnosc" title="§ 7. Odpowiedzialność">
        <Points ordered>
          <li>Usługodawca dba o działanie Platformy, ale nie gwarantuje jej nieprzerwanej dostępności (prace techniczne, awarie dostawców usług).</li>
          <li>Usługodawca nie odpowiada za decyzje podjęte wyłącznie na podstawie odpowiedzi AI ani nie gwarantuje określonych wyników studia. <Fill>[DO DECYZJI PRAWNIKA: zakres wyłączeń]</Fill></li>
        </Points>
      </LegalSection>

      <LegalSection id="reklamacje" title="§ 8. Reklamacje">
        <p>Reklamację wyślij na <Fill>[E-MAIL]</Fill>. Opisz problem i podaj adres e-mail konta. Odpowiemy w ciągu 14 dni.</p>
      </LegalSection>

      <LegalSection id="platnosci" title="§ 9. Płatności i odstąpienie od umowy">
        <p><Fill>[DO UZUPEŁNIENIA: zasady płatności za program, prawo odstąpienia od umowy, jeśli dotyczy]</Fill></p>
      </LegalSection>

      <LegalSection id="dane" title="§ 10. Dane osobowe">
        <p>Zasady przetwarzania danych opisuje <Link href="/polityka-prywatnosci" className={A}>Polityka prywatności</Link>.</p>
      </LegalSection>

      <LegalSection id="koncowe" title="§ 11. Zmiany Regulaminu i postanowienia końcowe">
        <Points ordered>
          <li>Usługodawca może zmienić Regulamin z ważnych przyczyn (np. zmiana prawa, nowe funkcje). O zmianach informuje w aplikacji albo mailem co najmniej 7 dni wcześniej.</li>
          <li>W sprawach nieuregulowanych stosuje się prawo polskie. <Fill>[DO DECYZJI PRAWNIKA: sąd właściwy]</Fill></li>
          <li>Regulamin obowiązuje od <Fill>[DATA]</Fill>.</li>
        </Points>
      </LegalSection>
    </LegalDoc>
  );
}
