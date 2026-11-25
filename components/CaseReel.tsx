import Link from "next/link";
import type { ReactNode } from "react";
import type { CaseStudy } from "@/lib/content";
import { DriftRow } from "./DriftRow";
import { CaseImage } from "./ui";

/**
 * The case studies as a row of big picture cards that drifts sideways by itself, like the client testimonials (see
 * components/DriftRow.tsx): it stops under the pointer, moves by hand with the buttons, the arrow keys or a swipe, and
 * stands still for a visitor who asked for reduced motion.
 */
export function CaseReel({ id, items, head }: { id: string; items: CaseStudy[]; head: ReactNode }) {
  return (
    <section id={id} className="reel">
      <div className="wrap reel-head">{head}</div>
      <DriftRow count={items.length} label="Case studies, scroll sideways">
        {items.map((c, i) => (
          <li key={c.slug} className="reel-card">
            <Link href={`/work/${c.slug}`} className="reel-link">
              <span className="reel-img">
                <CaseImage slug={c.slug} sizes="(min-width: 48rem) 420px, 84vw" />
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
                {/* the whole card is the link; this is the button the eye looks for (it opens the case study's page) */}
                <span className="reel-explore">
                  Explore
                  <span className="sr-only"> the {c.title} case study</span>
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </DriftRow>
    </section>
  );
}
