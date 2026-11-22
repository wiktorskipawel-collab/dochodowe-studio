import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Marketing OS · Dochodowe Studio",
  description: "Platforma, która prowadzi właściciela studia treningowego przez marketing według metodyki Dochodowego Studia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col gap-4 p-3 md:flex-row md:gap-6 md:p-5">
          <Sidebar />
          <main className="min-w-0 flex-1 pb-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
