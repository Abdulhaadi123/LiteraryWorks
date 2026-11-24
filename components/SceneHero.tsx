import type { ReactNode } from "react";
import { PAGE_AT, pageScene, sceneAria } from "@/lib/scenes";
import { Checks } from "./ui";
import { Phase, Xp } from "./Xp";

export interface Chapter {
  kicker: string;
  title: ReactNode;
  lead?: string;
  items?: string[];
}

/**
 * The top of an inner page, as a scene that plays by itself (like the home page's): the page's headline first, then two
 * chapters and a closing call to action beside the 3D picture, which moves on from object to object on a timer (a
 * pipeline, a book of our case studies, a speakerphone ...). One screen tall, so scrolling goes straight on to the page.
 * On phones, under reduced motion and where the scene cannot start, only the headline block shows (the rest of
 * the page says the same things in full).
 */
export function SceneHero({
  id,
  variant,
  aria,
  kicker,
  title,
  lead,
  actions,
  chapters,
  closing,
}: {
  id: string;
  variant: string;
  /** What a screen reader says about the picture; by default it is written for the page's own scene. */
  aria?: string;
  kicker: string;
  title: ReactNode;
  lead: string;
  actions: ReactNode;
  chapters: [Chapter, Chapter];
  closing: { title: ReactNode; lead: string; actions: ReactNode };
}) {
  const to = (i: number) => PAGE_AT[i + 1] ?? 1;
  return (
    <Xp
      id={id}
      scene="deck"
      className="xp-compact"
      auto
      steps={["Overview", chapters[0].kicker, chapters[1].kicker, "Next step"]}
      aria={aria ?? sceneAria(variant)}
      labels={[]}
      data={pageScene(variant)}
    >
      <Phase from={PAGE_AT[0]} to={to(0)} on>
        <p className="kicker rise">{kicker}</p>
        <h1 className="h-hero rise" style={{ "--i": 1 } as React.CSSProperties}>
          {title}
        </h1>
        <p className="lead rise" style={{ "--i": 2 } as React.CSSProperties}>
          {lead}
        </p>
        <div className="cta-row rise" style={{ "--i": 3 } as React.CSSProperties}>
          {actions}
        </div>
      </Phase>
      {chapters.map((c, i) => (
        <Phase key={c.kicker} from={PAGE_AT[i + 1]} to={to(i + 1)}>
          <p className="kicker">{c.kicker}</p>
          <h2 className="h-lg">{c.title}</h2>
          {c.lead ? <p className="lead">{c.lead}</p> : null}
          {c.items ? <Checks items={c.items} /> : null}
        </Phase>
      ))}
      <Phase from={PAGE_AT[3]} to={to(3)}>
        <p className="kicker">Next step</p>
        <h2 className="h-lg">{closing.title}</h2>
        <p className="lead">{closing.lead}</p>
        <div className="cta-row">{closing.actions}</div>
      </Phase>
    </Xp>
  );
}
