"use client";

import { useEffect, useRef } from "react";
import { loadMotion, motionOn } from "./gsap";
import type { LabelSpec, SceneName } from "./types";

/**
 * The picture of a pinned, scroll-driven 3D scene: a canvas (WebGL, three.js) with labels that follow points on the
 * model, joined to it by leader lines. The section around it (components/Xp.tsx) is a tall runway with a sticky
 * stage; the scroll position is the scene's only input, smoothed so a fast flick still plays out. Nothing here
 * runs on phones, tablets or under reduced motion: the section is then a plain static block and neither three.js
 * nor GSAP is fetched. If WebGL is not available the scene steps aside the same way (`xp-failed`).
 *
 * Accessibility: the picture is one described image; the same words are in the copy next to it.
 */
export function Stage3D({ scene, labels, aria }: { scene: SceneName; labels: LabelSpec[]; aria: string }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current;
    const section = host?.closest<HTMLElement>(".xp");
    if (!host || !section || !motionOn()) return;
    let disposed = false;
    let teardown: (() => void) | undefined;
    void loadMotion().then(async (ok) => {
      if (!ok || disposed) return;
      const { mountStage } = await import("./mountStage");
      if (!disposed) teardown = mountStage(section, host, scene, labels);
    });
    return () => {
      disposed = true;
      teardown?.();
    };
    // the scene is built once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  return (
    <div ref={wrap} className="xp-canvas" role="img" aria-label={aria}>
      <canvas className="xp-gl" />
      <svg className="xp-lines" aria-hidden="true">
        {labels.map((l) => (
          <g key={l.key} data-tone={l.tone ?? "blue"}>
            <polyline data-xp-line pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
            <circle data-xp-dot r={0} />
          </g>
        ))}
      </svg>
      <ul className="xp-labels" aria-hidden="true">
        {labels.map((l, i) => (
          <li key={l.key} data-xp-label data-tone={l.tone ?? "blue"} style={{ opacity: 0 }}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <span>
              <b>{l.label}</b>
              {l.note ? <i>{l.note}</i> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
