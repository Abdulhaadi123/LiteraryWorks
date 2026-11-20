"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** The small-screen menu: a round button and a panel under the bar, closed again whenever the page changes. */
export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="menu-btn"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <i />
        <i />
      </button>
      <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile" hidden={!open}>
        {items.map((n) => (
          <Link key={n.href} href={n.href} aria-current={path === n.href || path.startsWith(`${n.href}/`) ? "page" : undefined}>
            {n.label}
          </Link>
        ))}
        <Link href="/contact?topic=audit" className="btn btn-navy">
          Book a free audit
        </Link>
      </nav>
    </div>
  );
}
