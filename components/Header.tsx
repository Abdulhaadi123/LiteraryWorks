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
    <header id="top" className="site-header">
      <div className="container header-inner">
        {/* Brand */}
        <Link href="/" className="brand" aria-label="LiteraryWorks, home">
          <span className="brand-symbol" aria-hidden="true">
            <span className="brand-notch" />
            LW
          </span>
          <div className="brand-text">
            <span className="brand-name">
              Literary<strong>Works</strong>
            </span>
            <span className="brand-tagline">ENGINEERING &amp; CONTECH</span>
          </div>
        </Link>

        {/* US Operations Status Badge */}
        <div className="header-status-pill">
          <span className="status-indicator-dot" />
          <span>US EAST &amp; CENTRAL HUBS</span>
        </div>

        {/* Navigation Links */}
        <nav
          className={`nav-links ${open ? "open" : ""}`}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href || pathname?.startsWith(item.href + "/") ? "active" : ""
              }
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/contact" className="mobile-nav-cta">
            Book Engineering Audit <span aria-hidden="true">↗</span>
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="header-actions">
          <Link href="/contact" className="header-cta">
            <span>Schedule Audit</span>
            <span className="cta-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-controls="primary-navigation"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
