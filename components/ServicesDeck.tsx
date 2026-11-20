import Link from "next/link";
import type { ReactNode } from "react";
import { cases } from "@/lib/content";
import { servicePages } from "@/lib/service-pages";
import { services } from "@/lib/services";
import { Checks } from "./ui";
import { Phase, Xp } from "./Xp";

/** The first part of the scene is the cards flying in onto the drum (it matches INTRO in motion/scenes/deck.ts). */
const INTRO = 0.09;

interface DeckItem {
  id: string;
  title: string;
  kicker: string;
  lead: string;
  bullets?: string[];
  metrics?: { value: string; label: string }[];
  href: string;
  cta: string;
}

/**
 * A 3D deck: a drum of cards that turns one place for each item as the page scrolls, with the copy for the item at
 * the front beside it. Where the scene does not run (phones, reduced motion, no WebGL) the deck is not rendered and
 * `fallback`, the plain list, is shown in its place.
 */
function Deck({
  id,
  variant,
  aria,
  items,
  intro,
  fallback,
  vh,
}: {
  id: string;
  variant: string;
  aria: string;
  items: DeckItem[];
  intro: ReactNode;
  fallback: ReactNode;
  vh: number;
}) {
  const n = items.length;
  const at = (i: number) => INTRO + (i / n) * (1 - INTRO);
  return (
    <>
      <Xp
        id={id}
        scene="deck"
        tone="dark"
        className="xp-deck"
        vh={vh}
        aria={aria}
        labels={[]}
        data={{ variant, items: items.map((s) => ({ id: s.id, title: s.title })) }}
      >
        <Phase from={0} to={INTRO}>
          {intro}
        </Phase>
        {items.map((s, i) => (
          <Phase key={s.id} from={at(i)} to={i === n - 1 ? 1 : at(i + 1)} ch={i + 1}>
            <p className="kicker">
              {String(i + 1).padStart(2, "0")} / {s.kicker}
            </p>
            <h2 className="h-lg">{s.title}</h2>
            <p className="lead">{s.lead}</p>
            {s.bullets ? <Checks items={s.bullets} /> : null}
            {s.metrics ? (
              <dl className="metrics">
                {s.metrics.map((m) => (
                  <div key={m.label}>
                    <dt>{m.value}</dt>
                    <dd>{m.label}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="cta-row">
              <Link className="btn btn-white btn-sm" href={s.href}>
                {s.cta}
              </Link>
            </div>
          </Phase>
        ))}
      </Xp>
      <div className="deck-fallback">{fallback}</div>
    </>
  );
}

/** The services as a deck: one card for each service, with its first three features beside it. */
export function ServicesDeck({ id, intro, fallback }: { id: string; intro: ReactNode; fallback: ReactNode }) {
  return (
    <Deck
      id={id}
      variant="services"
      vh={640}
      aria="A rotating deck of nine cards, one for each service: AI and automation, AI voice systems, SaaS platforms, enterprise software, AI web apps, AI mobile apps, UI and UX design, cloud and DevOps, and construction technology. Each card comes to the front in turn."
      intro={intro}
      fallback={fallback}
      items={services.map((s) => ({
        id: s.slug,
        title: s.name,
        kicker: s.group,
        lead: s.short,
        bullets: servicePages[s.slug]?.features.slice(0, 3),
        href: `/services/${s.slug}`,
        cta: `Explore ${s.name}`,
      }))}
    />
  );
}

/** The case studies as a deck: one card for each, with its summary and three results beside it. */
export function CasesDeck({ id, intro, fallback }: { id: string; intro: ReactNode; fallback: ReactNode }) {
  return (
    <Deck
      id={id}
      variant="cases"
      vh={560}
      aria={`A rotating deck of ${cases.length} cards, one for each case study. Each comes to the front in turn.`}
      intro={intro}
      fallback={fallback}
      items={cases.map((c) => ({
        id: c.slug,
        title: c.title,
        kicker: c.tags[0],
        lead: c.summary,
        metrics: c.results.slice(0, 3),
        href: `/work/${c.slug}`,
        cta: "Read the case study",
      }))}
    />
  );
}
