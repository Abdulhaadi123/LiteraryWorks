import Link from "next/link";
import type { ReactNode } from "react";
import { cases } from "@/lib/content";
import { SERVICES_AT, servicesAria, servicesScene } from "@/lib/scenes";
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

/**
 * The services as a story that plays by itself (like the home page's hero): the introduction over a system plan, then one
 * real object for each service with its first three features beside it. The camera moves from object to object on a
 * timer and the words change with it, over and over; a bar for each beat jumps to it. One screen tall, so scrolling goes
 * straight on to the page. Where the scene does not run, the plain list (`fallback`) is shown instead.
 */
export function ServicesDeck({ id, intro, fallback }: { id: string; intro: ReactNode; fallback: ReactNode }) {
  const to = (i: number) => SERVICES_AT[i + 1] ?? 1;
  return (
    <>
      <Xp
        id={id}
        scene="deck"
        className="xp-deck"
        auto
        steps={["Overview", ...services.map((s) => s.name)]}
        aria={servicesAria}
        labels={[]}
        data={servicesScene()}
      >
        <Phase from={SERVICES_AT[0]} to={to(0)} on>
          {intro}
        </Phase>
        {services.map((s, i) => {
          const bullets = servicePages[s.slug]?.features.slice(0, 3);
          return (
            <Phase key={s.slug} from={SERVICES_AT[i + 1]} to={to(i + 1)}>
              <p className="kicker">
                {String(i + 1).padStart(2, "0")} / {s.kind}
              </p>
              <h2 className="h-lg">{s.name}</h2>
              <p className="lead">{s.short}</p>
              {bullets ? <Checks items={bullets} /> : null}
              <div className="cta-row">
                <Link className="btn btn-white btn-sm" href={`/services/${s.slug}`}>
                  Explore {s.name}
                </Link>
              </div>
            </Phase>
          );
        })}
      </Xp>
      <div className="deck-fallback">{fallback}</div>
    </>
  );
}

/** The case studies as a book: it lies open and turns to each case in turn, with its summary and three results beside it. */
export function CasesDeck({ id, intro, fallback }: { id: string; intro: ReactNode; fallback: ReactNode }) {
  return (
    <Deck
      id={id}
      variant="book:cases"
      scene="system"
      vh={400}
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
