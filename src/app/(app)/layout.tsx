import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Gate } from "@/components/Gate";
import { AssistantHost } from "@/components/AssistantStage";
import { PreviewBanner } from "@/components/PreviewBanner";
import { CommandPalette } from "@/components/CommandPalette";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Gate level="app">
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 68)", "--header-height": "calc(var(--spacing) * 14)" } as React.CSSProperties}>
        {/* Klawiatura i czytnik ekranu: od razu do treści, bez przechodzenia przez ~25 pozycji menu (audyt UX W13). */}
        <a href="#tresc" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-3 focus:font-bold focus:text-brand-ink">
          Przejdź do treści
        </a>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-transparent md:peer-data-[variant=inset]:shadow-none">
          <SiteHeader />
          {/* pb-28: dolny odstęp na awatar asystenta w rogu — ostatni element strony zawsze da się wysunąć ponad niego */}
          <div id="tresc" tabIndex={-1} className="@container/main flex flex-1 flex-col gap-5 p-4 pb-28 lg:p-6 lg:pb-28"><PreviewBanner />{children}</div>
        </SidebarInset>
        <AssistantHost />
        <CommandPalette />
      </SidebarProvider>
    </Gate>
  );
}
