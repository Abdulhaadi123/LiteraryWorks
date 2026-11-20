import type { ReactNode } from "react";
import { sceneAria, systemLabelsFor } from "@/lib/scenes";
import { Checks } from "./ui";
import { Phase, Xp } from "./Xp";

export interface Chapter {
  kicker: string;
  title: ReactNode;
  lead?: string;
  items?: string[];
}

/**
 * The top of an inner page, as a short pinned scene: the page's headline first, then two chapters and a closing
 * call to action beside the 3D picture, which plays this page's own story (a pipeline, a ring of sound, a stack of layers ...).
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
  tone = "light",
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
  /** "dark" puts the scene on the deep-blue ground, with the glossy floor and the coloured lights. */
  tone?: "light" | "dark";
}) {
  return (
    <Xp id={id} scene="system" tone={tone} className="xp-compact" vh={320} aria={aria ?? sceneAria(variant)} labels={systemLabelsFor(variant)} data={{ variant }}>
      <Phase from={0} to={0.12}>
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
        <Phase key={c.kicker} from={i ? 0.5 : 0.12} to={i ? 0.8 : 0.5}>
          <p className="kicker">{c.kicker}</p>
          <h2 className="h-lg">{c.title}</h2>
          {c.lead ? <p className="lead">{c.lead}</p> : null}
          {c.items ? <Checks items={c.items} /> : null}
        </Phase>
      ))}
      <Phase from={0.8} to={1}>
        <p className="kicker">Next step</p>
        <h2 className="h-lg">{closing.title}</h2>
        <p className="lead">{closing.lead}</p>
        <div className="cta-row">{closing.actions}</div>
      </Phase>
    </Xp>
  );
}
