import type { CSSProperties, ReactNode } from "react";
import { Stage3D } from "@/motion/Stage3D";
import type { LabelSpec, SceneData, SceneName } from "@/motion/types";

/**
 * A pinned, scroll-driven 3D scene (the skill's "runway"). It is a plain static block by default: the first beat,
 * the poster, then each other beat as a normal block. Only where the head script set html.motion (wide screens, no
 * reduced motion) does the CSS turn it into a tall runway with a sticky stage; the canvas, three.js and GSAP are
 * fetched then and not before. Phones, reduced motion and "no WebGL" keep the static block.
 *
 * `vh` is the scroll distance of the scene: tune it (about 400 to 560 for a rich scene).
 */
export function Xp({
  id,
  scene,
  vh = 360,
  aria,
  labels,
  data,
  poster,
  railSteps,
  railIntro = 0,
  className,
  children,
}: {
  id: string;
  scene: SceneName;
  vh?: number;
  aria: string;
  labels: LabelSpec[];
  data?: SceneData;
  /** The still picture for phones and for the moment before the scene starts; omit it where the section needs none. */
  poster?: ReactNode;
  /** A deck of this many items: the progress rail on the left marks where each starts and counts them. */
  railSteps?: number;
  /** How much of the scroll (0..1) the intro takes before the first item (decks). */
  railIntro?: number;
  className?: string;
  children: ReactNode;
}) {
  const ticks = railSteps ? Array.from({ length: railSteps }, (_, k) => railIntro + (k / railSteps) * (1 - railIntro)) : [];
  return (
    <section id={id} className={`xp xp-light${className ? ` ${className}` : ""}`} data-pace style={{ "--xp-vh": vh } as CSSProperties}>
      <div className="xp-stage">
        {poster ? (
          <div className="xp-poster" aria-hidden="true">
            {poster}
          </div>
        ) : null}
        <Stage3D scene={scene} labels={labels} aria={aria} data={data} />
        <div className="xp-copy">
          <div className="wrap xp-phases">{children}</div>
        </div>
        <div className="xp-hint" aria-hidden="true">
          <span className="xp-mouse" />
          Scroll to explore
        </div>
        <div className="xp-rail" aria-hidden="true" data-xp-rail>
          {railSteps ? (
            <span className="xp-rail-num">
              <b data-rail-cur>01</b> / {String(railSteps).padStart(2, "0")}
            </span>
          ) : null}
          <span className="xp-rail-line">
            <i data-rail-fill />
            {ticks.map((at, k) => (
              <span key={k} className="xp-rail-tick" data-rail-tick data-at={at.toFixed(4)} style={{ top: `${(at * 100).toFixed(2)}%` }} />
            ))}
            <span className="xp-rail-dot" data-rail-dot />
          </span>
        </div>
      </div>
    </section>
  );
}

/** One beat of the story: its copy shows while the scene's progress is between `from` and `to`. */
export function Phase({ from, to, children }: { from: number; to: number; children: ReactNode }) {
  return (
    <div className="xp-phase" data-phase data-from={from} data-to={to}>
      {children}
    </div>
  );
}
