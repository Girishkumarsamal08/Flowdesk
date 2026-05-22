import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/app/globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flowdesk | Support Widget",
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${outfit.className} min-h-screen bg-[#030303]`}>
      {children}
    </div>
  );
}
