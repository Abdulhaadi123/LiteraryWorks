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
 *
 * With `auto` (the home page's hero) the scene is not tied to the scroll: it is one screen tall, plays its beats by
 * itself (the camera moves from object to object on a timer and the words change with it, over and over), and has a
 * pause button and a bar for each beat to jump to it (`steps` names them). Scrolling then goes straight on to the next
 * section. Where the scene does not run, `auto` changes nothing: the same static block as any other scene.
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
  auto,
  steps,
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
  /** The story plays by itself instead of following the scroll (see above). */
  auto?: boolean;
  /** For `auto`: the name of each beat (the bars' labels), in order. */
  steps?: string[];
  className?: string;
  children: ReactNode;
}) {
  const ticks = railSteps ? Array.from({ length: railSteps }, (_, k) => railIntro + (k / railSteps) * (1 - railIntro)) : [];
  return (
    <section
      id={id}
      className={`xp xp-light${auto ? " xp-auto" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--xp-vh": vh } as CSSProperties}
      data-auto={auto ? "" : undefined}
    >
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
        {auto ? (
          <div className="xp-controls" role="group" aria-label="Story controls">
            <button type="button" className="xp-toggle" data-auto-toggle aria-label="Pause the animation" title="Pause">
              <svg className="xp-i-pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" />
              </svg>
              <svg className="xp-i-play" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M8 5.2v13.6L19.2 12z" />
              </svg>
            </button>
            <ol className="xp-steps">
              {(steps ?? []).map((label, i, all) => (
                <li key={label}>
                  <button type="button" className="xp-step" data-auto-step={i} aria-label={`Step ${i + 1} of ${all.length}: ${label}`} title={label}>
                    <span className="xp-step-bar">
                      <i />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}

/**
 * One beat of the story: its copy shows while the scene's progress is between `from` and `to`. In a story that plays
 * by itself (`auto`) `on` marks the beat that shows to begin with: the first, so its headline is there at the first paint.
 */
export function Phase({ from, to, on, children }: { from: number; to: number; on?: boolean; children: ReactNode }) {
  return (
    <div className={`xp-phase${on ? " is-on" : ""}`} data-phase data-from={from} data-to={to}>
      {children}
    </div>
  );
}
