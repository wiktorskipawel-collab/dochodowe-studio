import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { JourneyProvider } from "@/lib/store";
import { Celebration } from "@/components/Celebration";
import { Spotlight } from "@/components/Spotlight";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Marketing OS · Dochodowe Studio",
  description: "Platforma, która prowadzi właściciela studia treningowego przez marketing według metodyki Dochodowego Studia.",
  icons: { icon: "/logo-ds.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={cn("dark h-full font-sans", montserrat.variable)} suppressHydrationWarning>
      <body className="min-h-full">
        <JourneyProvider>
          <TooltipProvider>
            {children}
            <Celebration />
            <Spotlight />
            <Toaster theme="dark" position="top-center" />
          </TooltipProvider>
        </JourneyProvider>
      </body>
    </html>
  );
}
