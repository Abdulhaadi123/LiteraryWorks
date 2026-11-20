import Link from "next/link";
import type { ReactNode } from "react";
import { cases } from "@/lib/content";
import { servicePages } from "@/lib/service-pages";
import { services } from "@/lib/services";
import { Checks } from "./ui";
import { Phase, Xp } from "./Xp";

/** The first part of the scene is the devices flying in onto the drum (it matches INTRO in motion/scenes/deck.ts). */
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
 * A 3D deck: a drum of devices that turns one place for each item as the page scrolls, with the copy for the item at
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
          <Phase key={s.id} from={at(i)} to={i === n - 1 ? 1 : at(i + 1)}>
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

/** The services as a deck: one small 3D scene for each service, each a different kind of animation, with its first three features beside it. */
export function ServicesDeck({ id, intro, fallback }: { id: string; intro: ReactNode; fallback: ReactNode }) {
  return (
    <Deck
      id={id}
      variant="services"
      vh={640}
      aria="A rotating deck of nine small 3D scenes, one for each service, each a different kind of animation with our own projects in it: a workflow pipeline for AI and automation, a ring of sound for AI voice systems, a stack of layers for SaaS platforms, a tower of screens for enterprise software, a browser for AI web apps, an app pulled apart for AI mobile apps, a wireframe becoming a design for UI and UX design, a globe for cloud and DevOps, and a building going up for construction technology. Each comes to the front in turn."
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

/** The case studies as a deck: their covers climbing a spiral, one for each, with its summary and three results beside it. */
export function CasesDeck({ id, intro, fallback }: { id: string; intro: ReactNode; fallback: ReactNode }) {
  return (
    <Deck
      id={id}
      variant="cases"
      vh={560}
      aria={`A spiral of ${cases.length} covers, one for each case study, climbing one above the other. Each comes to the front in turn.`}
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
