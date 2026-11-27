import { AccountSettings } from "@/components/AccountSettings";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Ustawienia konta · Marketing OS" };

export default function Ustawienia() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Twoje konto" title="Ustawienia konta">
        Imię, hasło, wykorzystanie asystenta AI w tym miesiącu i dźwięki nagród.
      </PageHeader>
      <AccountSettings />
    </div>
  );
}
