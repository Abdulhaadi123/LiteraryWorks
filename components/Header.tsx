"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { nav } from "@/lib/site";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

/**
 * A floating bar (the same idea as FAYD's): inset from the edges, the links centred, the booking button on the
 * right. It gets a little more solid once the page has moved. The current page is marked for the eye and for
 * assistive technology (aria-current).
 */
export function Header() {
  const path = usePathname();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;
    const paint = () => {
      raf = 0;
      el.classList.toggle("is-scrolled", window.scrollY > 24);
      // how far down the page you are: a thin green line under the bar fills as you scroll
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.setProperty("--progress", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : "0");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const current = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="site-header" ref={root}>
      <div className="site-header-bar">
        {/* not prefetched: the home page's hero picture would be fetched on every other page, for a visit that may never happen */}
        <Link href="/" className="brand" aria-label="LiteraryWorks, home" prefetch={false}>
          <Logo />
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="site-cta">
          <Link href="/contact?topic=audit" className="btn btn-navy btn-sm">
            Book a free audit
          </Link>
        </div>
        <MobileMenu items={nav} />
      </div>
    </header>
  );
}
