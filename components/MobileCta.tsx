"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * On phones, a booking button that appears once the opening screen has been scrolled past (the doc's "mobile
 * purchase bar"). It listens to the scroll only on a phone-sized screen: on a desktop it is never shown.
 */
export function MobileCta() {
  const path = usePathname();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 47.99rem)");
    let raf = 0;
    const paint = () => {
      raf = 0;
      setOn(window.scrollY > window.innerHeight * 0.9);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const attach = () => {
      window.removeEventListener("scroll", onScroll);
      if (!phone.matches) {
        setOn(false);
        return;
      }
      paint();
      window.addEventListener("scroll", onScroll, { passive: true });
    };
    attach();
    phone.addEventListener("change", attach);
    return () => {
      phone.removeEventListener("change", attach);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (path.startsWith("/contact")) return null;
  return (
    <div className={`mobile-cta${on ? " is-on" : ""}`} aria-hidden={!on}>
      <Link className="btn btn-navy" href="/contact?topic=audit" tabIndex={on ? 0 : -1}>
        Book a free AI audit
      </Link>
    </div>
  );
}
