import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import CursorGlow from "@/components/CursorGlow";
import Navbar from "@/components/Navbar";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FLOWDESK | Automating Customer Support",
  description: "Automating Customer Support from Query to Resolution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={outfit.className}>
        <div className="bg-glow" />
        <CursorGlow />
        <Navbar />
        <main className="max-w-[1200px] mx-auto p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
