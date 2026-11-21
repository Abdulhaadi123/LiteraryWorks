import Link from "next/link";
import type { ReactNode } from "react";
import { cases } from "@/lib/content";
import { servicesAria } from "@/lib/scenes";
import { servicePages } from "@/lib/service-pages";
import { services } from "@/lib/services";
import { Checks } from "./ui";
import { Phase, Xp } from "./Xp";

/** The first part of the scroll is the intro copy, over the first scene (it matches INTRO in motion/scenes/deck.ts). */
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
 * A 3D deck: one scene at a time, and the camera moves on to the next for each item as the page scrolls, with the copy
 * for the item in front beside it. Where the scene does not run (phones, reduced motion, no WebGL) the deck is not
 * rendered and `fallback`, the plain list, is shown in its place.
 */
function Deck({
  id,
  variant,
  scene = "deck",
  aria,
  items,
  intro,
  fallback,
  vh,
}: {
  id: string;
  variant: string;
  /** "deck": one model for each item; "system": one model (the book) whose pages follow the items. */
  scene?: "deck" | "system";
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
        scene={scene}
        className="xp-deck"
        railSteps={n}
        railIntro={INTRO}
        vh={vh}
        aria={aria}
        labels={[]}
        data={scene === "system" ? { variant } : { variant, items: items.map((s) => ({ id: s.id, title: s.title })) }}
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
      aria={servicesAria}
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

/** The case studies as a book: it lies open and turns to each case in turn, with its summary and three results beside it. */
export function CasesDeck({ id, intro, fallback }: { id: string; intro: ReactNode; fallback: ReactNode }) {
  return (
    <Deck
      id={id}
      variant="book:cases"
      scene="system"
      vh={560}
      aria={`A book of our ${cases.length} case studies lying open. As the page scrolls it turns to each case: its story and results on the left page, its picture on the right.`}
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
