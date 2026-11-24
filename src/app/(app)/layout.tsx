import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Gate } from "@/components/Gate";
import { AssistantHost } from "@/components/AssistantStage";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Gate level="app">
      <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 68)", "--header-height": "calc(var(--spacing) * 14)" } as React.CSSProperties}>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-transparent md:peer-data-[variant=inset]:shadow-none">
          <SiteHeader />
          <div className="@container/main flex flex-1 flex-col gap-5 p-4 pb-28 lg:p-6 lg:pb-28">{children}</div>
        </SidebarInset>
        <AssistantHost />
      </SidebarProvider>
    </Gate>
  );
}
