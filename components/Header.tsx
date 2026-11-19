"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/construction", label: "Construction" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (open) document.body.classList.add("nav-locked");
    else document.body.classList.remove("nav-locked");
    return () => document.body.classList.remove("nav-locked");
  }, [open]);

  return (
    <header className="site-header" id="top">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="LiteraryWorks home">
          <span className="brand-symbol" aria-hidden="true"><span>L</span><i/><span>W</span></span>
          <span className="brand-name">LITERARY<span>WORKS</span><small>INTELLIGENCE IN MOTION</small></span>
        </Link>
        <nav id="primary-navigation" aria-label="Primary navigation" className={`nav-links ${open ? "open" : ""}`}>
          {nav.map(item => <Link key={item.href} href={item.href} className={pathname === item.href || pathname?.startsWith(item.href + "/") ? "active" : ""} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}
          <Link className="mobile-nav-cta" href="/contact">Start a project <span aria-hidden="true">↗</span></Link>
        </nav>
        <div className="header-actions">
          <Link className="header-cta" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></Link>
          <button type="button" className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(v => !v)}><span/><span/></button>
        </div>
      </div>
    </header>
  );
}
