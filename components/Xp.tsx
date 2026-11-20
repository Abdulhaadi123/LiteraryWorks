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
  tone = "light",
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
  /** "dark" for a runway on a navy ground. */
  tone?: "light" | "dark";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`xp xp-${tone}${className ? ` ${className}` : ""}`} data-pace style={{ "--xp-vh": vh } as CSSProperties}>
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
        <div className="xp-track" aria-hidden="true" data-xp-track>
          <i />
          <b />
        </div>
      </div>
    </section>
  );
}

/** One beat of the story: its copy shows while the scene's progress is between `from` and `to`. `ch` numbers a chapter on the progress track. */
export function Phase({ from, to, ch, children }: { from: number; to: number; ch?: number; children: ReactNode }) {
  return (
    <div className="xp-phase" data-phase data-from={from} data-to={to} data-ch={ch}>
      {children}
    </div>
  );
}
