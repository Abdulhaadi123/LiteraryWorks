"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { footerCta, type CtaNames } from "@/lib/footer-cta";

/** The call to action at the top of the footer, in the words of the page it is on (lib/footer-cta.ts). */
export function FooterCtaBand({ names }: { names: CtaNames }) {
  const cta = footerCta(usePathname() ?? "/", names);
  const button = (b: { label: string; href: string }, className: string) =>
    b.href.startsWith("mailto:") ? (
      <a className={className} href={b.href}>
        {b.label}
      </a>
    ) : (
      <Link className={className} href={b.href}>
        {b.label}
      </Link>
    );
  return (
    <div className="wrap footer-cta">
      <div>
        <p className="kicker">{cta.kicker}</p>
        <h2 className="h-lg">
          {cta.title[0]} <em>{cta.title[1]}</em>
        </h2>
        <ul className="cta-facts">
          {cta.facts.map(([figure, text]) => (
            <li key={figure}>
              <b>{figure}</b>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="cta-row">
        {button(cta.primary, "btn btn-white")}
        {button(cta.secondary, "btn btn-line")}
      </div>
    </div>
  );
}
