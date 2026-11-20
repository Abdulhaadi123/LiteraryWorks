import Link from "next/link";
import type { ReactNode } from "react";
import type { CaseStudy } from "@/lib/content";
import { ReelDriver } from "./ReelDriver";
import { CaseImage } from "./ui";

/**
 * The case studies as a pinned horizontal gallery: big picture cards with outline numerals that slide sideways as
 * the page scrolls (where motion is on). On phones, tablets and under reduced motion the cards simply stack.
 */
export function CaseReel({ id, items, head }: { id: string; items: CaseStudy[]; head: ReactNode }) {
  return (
    <section id={id} className="reel" data-reel data-pace>
      <div className="reel-stage">
        <div className="wrap reel-head">{head}</div>
        <ul className="reel-track" data-reel-track>
          {items.map((c, i) => (
            <li key={c.slug} className="reel-card">
              <Link href={`/work/${c.slug}`} className="reel-link">
                <span className="reel-img">
                  <CaseImage slug={c.slug} sizes="(min-width: 64rem) 640px, 92vw" />
                  <span className="reel-num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="reel-text">
                  <span className="reel-tags">{c.tags.slice(0, 2).join(" · ")}</span>
                  <b>{c.title}</b>
                  <span className="reel-result">
                    {c.results[0].value} {c.results[0].label}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="reel-line" aria-hidden="true">
          <i data-reel-bar />
        </div>
      </div>
      <ReelDriver />
    </section>
  );
}
