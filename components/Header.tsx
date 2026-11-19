"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { lockScroll } from "@/motion/loadMotion";

const navigation = [
  { href: "/services", label: "Expertise & AI" },
  { href: "/construction", label: "ConTech & Contracting" },
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
    <header id="top" className="sticky top-0 z-50 h-[76px] w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3.5" aria-label="LiteraryWorks, home">
          <span className="relative grid h-10 w-10 place-items-center rounded-lg bg-[#0f2438] font-mono text-xs font-bold text-white shadow-sm transition-all group-hover:bg-[#1e3a5f]">
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#c29b61]" />
            LW
          </span>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 leading-none">
              literary<strong className="text-[#0f2438]">works.</strong>
            </span>
            <span className="font-mono text-[9px] tracking-widest text-slate-500">
              TECHNOLOGY &amp; BUILT ENVIRONMENT
            </span>
          </div>
        </Link>

        {/* US Operations Status Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs text-slate-600 md:flex">
          <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
          <span className="font-medium">US Operations · New York &amp; Austin</span>
        </div>

        {/* Navigation Links */}
        <nav
          className={`nav-links ${
            open
              ? "absolute top-[76px] left-0 flex w-full flex-col gap-4 border-b border-slate-200 bg-white p-6 shadow-xl"
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
                  isActive ? "text-[#0f2438]" : "text-slate-600 hover:text-slate-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#c29b61]" />
                )}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="flex items-center justify-between text-sm font-bold text-[#0f2438] md:hidden"
          >
            <span>Discuss a Project</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </nav>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/contact"
            className="hidden items-center gap-2.5 rounded-lg bg-[#0f2438] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#1e3a5f] sm:flex"
          >
            <span>Discuss a Project</span>
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
            <span className="h-0.5 w-5 bg-slate-900 transition-all" />
            <span className="h-0.5 w-5 bg-slate-900 transition-all" />
          </button>
        </div>
      </div>
    </header>
  );
}
