"use client";

import { useEffect, useRef } from "react";
import { live3dOn, loadMotion, motionOn } from "./gsap";
import type { LabelSpec, SceneData, SceneName } from "./types";

let webgl: boolean | undefined;
/** Can this browser draw with WebGL at all? Asked once, with a throw-away canvas that is let go of at once. */
function webglOk(): boolean {
  if (webgl !== undefined) return webgl;
  try {
    const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
    webgl = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}

/**
 * The picture of a pinned, scroll-driven 3D scene: one shared WebGL canvas (three.js) moves in here while the
 * scene is on screen, with tags that follow parts of the model, joined to it by leader lines. The section around
 * it (components/Xp.tsx) is a tall runway with a sticky stage; the scroll position is the scene's only input,
 * smoothed so a fast flick still plays out. Nothing here runs on phones, tablets or under reduced motion (except the scenes
 * of the pages that have one, which draw live on a phone or tablet too, without GSAP: html.live3d, see motion/head.ts): the
 * section is then a plain static block and neither three.js nor GSAP is fetched. If WebGL is not available the
 * scene steps aside the same way (`xp-failed`), at once, before anything is built.
 *
 * Accessibility: the picture is one described image; the same words are in the copy next to it.
 */
export function Stage3D({ scene, labels, aria, data }: { scene: SceneName; labels: LabelSpec[]; aria: string; data?: SceneData }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current;
    const section = host?.closest<HTMLElement>(".xp");
    // on a phone or tablet the scenes draw live too (html.live3d, set for the pages that have one), without GSAP
    const phone = !!section && live3dOn();
    if (!host || !section || !(motionOn() || phone)) return;
    if (!webglOk()) {
      section.classList.add("xp-failed");
      return;
    }
    let disposed = false;
    let teardown: (() => void) | undefined;
    void (motionOn() ? loadMotion() : Promise.resolve(true)).then(async (ok) => {
      if (!ok || disposed) return;
      const { mountStage } = await import("./mountStage");
      if (!disposed) teardown = mountStage(section, host, scene, labels, data);
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
      <svg className="xp-lines" aria-hidden="true">
        {labels.map((l) => (
          <g key={l.key}>
            <polyline data-xp-line pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} />
            <circle data-xp-dot r={0} />
          </g>
        ))}
      </svg>
      <ul className="xp-labels" aria-hidden="true">
        {labels.map((l) => (
          <li key={l.key} data-xp-label data-tone={l.tone ?? "blue"} style={{ opacity: 0 }}>
            <b>{l.label}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
