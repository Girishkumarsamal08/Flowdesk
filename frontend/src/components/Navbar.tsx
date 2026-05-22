"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] bg-[rgba(5,5,5,0.8)]">
      <div className="max-w-[1200px] mx-auto px-8 h-20 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-white hover:text-[var(--accent)] transition-colors"
        >
          {isLandingPage ? "FLOWDESK" : "INFLUCRAFT"}
        </Link>
        
        {isLandingPage && (
          <div className="flex gap-8 items-center">
            <Link href="/company/auth" className="text-sm font-bold px-5 py-2 rounded-full border border-white/10 hover:border-[var(--accent)] transition-all">
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
