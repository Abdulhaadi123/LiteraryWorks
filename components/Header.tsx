"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { lockScroll } from "@/motion/loadMotion";

const navigation = [
  { href: "/services", label: "Expertise & AI" },
  { href: "/construction", label: "ConTech & AEC" },
  { href: "/industries", label: "Industries" },
  { href: "/about", label: "Our Approach" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", open);
    lockScroll(open);
    return () => {
      document.body.classList.remove("nav-locked");
      lockScroll(false);
    };
  }, [open]);

  return (
    <header id="top" className="sticky top-0 z-50 h-[78px] w-full border-b border-white/10 bg-[#060911]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3.5" aria-label="LiteraryWorks, home">
          <span className="relative grid h-10 w-10 place-items-center rounded-lg border border-[#00f0ff]/40 bg-gradient-to-br from-[#131f36] to-[#090e1c] font-mono text-xs font-extrabold text-[#00f0ff] shadow-[0_0_16px_rgba(0,240,255,0.2)] transition-all group-hover:border-[#ff6b00]">
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#ff6b00] shadow-[0_0_6px_#ff6b00]" />
            LW
          </span>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-white leading-none">
              Literary<strong className="font-extrabold text-[#ff6b00]">Works</strong>
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-slate-400">
              ENGINEERING &amp; CONTECH
            </span>
          </div>
        </Link>

        {/* US Operations Status Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 font-mono text-[11px] tracking-wider text-slate-400 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
          <span>US EAST &amp; CENTRAL HUBS</span>
        </div>

        {/* Navigation Links */}
        <nav
          className={`nav-links ${
            open
              ? "absolute top-[78px] left-0 flex w-full flex-col gap-4 border-b border-white/15 bg-[#0a101d] p-6 shadow-2xl"
              : "hidden items-center gap-8 md:flex"
          }`}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 text-sm font-semibold transition-colors duration-200 ${
                  isActive ? "text-[#00f0ff]" : "text-slate-300 hover:text-white"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
                )}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="flex items-center justify-between text-sm font-bold text-[#ff6b00] md:hidden"
          >
            <span>Book Engineering Audit</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/contact"
            className="hidden items-center gap-3 rounded-md border border-[#ff6b00]/40 bg-[#ff6b00]/10 px-5 py-2.5 font-display text-xs font-bold text-[#ff6b00] transition-all duration-200 hover:bg-[#ff6b00] hover:text-black hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] sm:flex"
          >
            <span>Schedule Audit</span>
            <span className="text-sm leading-none" aria-hidden="true">
              ↗
            </span>
          </Link>
          <button
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="h-0.5 w-5 bg-white transition-all" />
            <span className="h-0.5 w-5 bg-white transition-all" />
          </button>
        </div>
      </div>
    </header>
  );
}
