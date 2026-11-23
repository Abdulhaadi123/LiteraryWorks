import * as THREE from "three";
import { clamp01, compileReady, createStage, lerp, quint, win } from "../engine";
import { createEnv, loadModel } from "../models/env";
import { fitFrame } from "../models/fit";
import { dressStage, type Dressing } from "../stage";
import type { Frame, Model } from "../models/types";
import { LOOP_TAIL, PAN } from "../timing";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";

/**
 * A sequence of real objects, one at a time: as the page scrolls and the copy beside it moves on, the camera moves on
 * to the next object, so every beat of a section has its own model (the services deck: a document scanner, a headset, a
 * dashboard ...; a page's story: devices, an audit report, a document scanner, browser windows, a handbook ...). They stand
 * in a column, far enough apart that the next is only in view while the camera travels to it. The first is built
 * before the first frame; the others follow in the background.
 */

const FOV = 28;
/** With no `at` given: the first part of the scroll is the intro copy, over the first object (INTRO in components/ServicesDeck.tsx). */
const INTRO = 0.09;
const SPACE = 13;

interface Item {
  holder: THREE.Group;
  model: Model;
  frame: Frame;
  hint: { az: [number, number]; elev: [number, number] };
}

export default async function build(ctx: SceneCtx): Promise<SceneHandle> {
  const gl = ctx.gl;
  const renderer = gl.renderer;
  const st = createStage(gl, { fov: FOV, exposure: 1 });
  const { scene, camera } = st;
  camera.near = 3;
  camera.far = 200;
  camera.updateProjectionMatrix();
  scene.environmentIntensity = 0.85;

  const ids = ctx.data?.items?.map((i) => i.id) ?? ["devices", "report", "scanner"];
  const N = Math.max(2, ids.length);
  const at = ctx.data?.at;
  // a story that plays by itself comes round to its first object again: a place N after the last, where the first object
  // (the same model, moved there while the camera is there) stands once more
  const loop = !!ctx.data?.loop;
  const M = loop ? N + 1 : N;
  const env = createEnv(renderer, ctx.data?.variant ?? "deck");
  const textures = env.textures;
  const dress: Dressing = dressStage(gl, scene, camera, textures);

  const root = new THREE.Group();
  scene.add(root);
  const items: (Item | null)[] = Array.from({ length: N }, () => null);
  // which objects are built and their shaders compiled (the first is, when the first frame is drawn)
  const built: boolean[] = Array.from({ length: N }, () => false);
  let disposed = false;
  const make = async (i: number) => {
    // (the lighter version: several objects are on the stage at once)
    const model = await (await loadModel(ids[i] ?? "devices"))(env, true);
    if (disposed) return;
    fitFrame(model);
    model.set(1, 1, 0.5);
    const holder = new THREE.Group();
    holder.position.y = -i * SPACE;
    holder.add(model.group);
    root.add(holder);
    items[i] = { holder, model, frame: { ...model.frame() }, hint: model.camera ?? { az: [-0.3, 0.2], elev: [0.26, 0.2] } };
  };
  await make(0);
  built[0] = true;
  // the rest, one by one, without holding up the first frame
  void (async () => {
    for (let i = 1; i < N && !disposed; i++) {
      await new Promise<void>((r) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(() => r(), { timeout: 700 }) : setTimeout(r, 60)));
      if (disposed) return;
      await make(i);
      const it = items[i];
      if (it && !disposed) await compileReady(gl, it.holder, camera, scene, () => !disposed);
      if (disposed) return;
      warmDraw(i);
      built[i] = true;
      ctx.invalidate?.();
    }
  })();

  /* ---- progress ---- */
  let progress = 0; // where the scene stands now (the last `setProgress`)
  const start = (i: number) => (i >= N ? 1 : at && at[i] !== undefined ? at[i] : INTRO + (i / N) * (1 - INTRO));
  let lay: SceneLayout | null = null;
  let px = 0;
  let py = 0;
  const target = new THREE.Vector3();
  const t2 = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  /** The object that stands in place k of the sequence (place N, after the last, is the first object coming round again). */
  const at_ = (k: number) => items[k >= N ? 0 : k];
  const ready = (k: number): Item => at_(k) ?? (items.find(Boolean) as Item);

  /**
   * A story that plays by itself draws each object once, out of sight, as soon as it is built: the first time an object
   * is drawn the graphics card is handed its geometry and textures, which costs up to a few frames, and that must not
   * happen in the middle of the camera's move to it. The picture that is shown is the one drawn last (the next
   * `invalidate`), not this one.
   */
  function warmDraw(i: number) {
    if (!loop || disposed) return;
    const keep = progress;
    handle.setProgress(start(i) + LOOP_TAIL);
    st.render();
    handle.setProgress(keep);
  }

  const handle: SceneHandle = {
    resize: (w, h) => {
      gl.resize(w, h);
      dress.resize(gl.size.w, gl.size.h);
    },
    layout: (l) => {
      lay = l;
    },
    setPointer(x, y) {
      px = x;
      py = y;
    },
    warm: () => st.warm(),
    ready: (k) => built[k >= N ? 0 : k] === true,
    render: () => st.render(),
    lowerQuality() {
      const before = gl.ratio;
      gl.setRatio(before - 0.25);
      if (gl.ratio >= before - 0.001) return false;
      dress.resize(gl.size.w, gl.size.h);
      st.render();
      return true;
    },
    stats() {
      const i = renderer.info;
      return { drawCalls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, shaderPrograms: i.programs?.length ?? 0, pixelRatio: gl.ratio };
    },
    setProgress(p) {
      progress = p;
      // which object is in front, as a number of places: it moves on at each point where the next takes over
      let f = 0;
      for (let k = 1; k < M; k++) f += quint(win(p, start(k) - PAN, start(k) + PAN));
      // (a loop: while the camera is on its way back round to the first object, that object stands at the end of the column)
      const home = loop && f > N - 1 ? N : 0;
      const first = items[0];
      if (first) first.holder.position.y = -home * SPACE;

      const w = gl.size.w;
      const h = gl.size.h;
      const from = lay ? lay.left : w * 0.4;
      const to = lay ? lay.right : w * 0.94;
      const lo = lay ? lay.top : 0;
      const hi = lay ? lay.bottom : h;
      const room = Math.max(w * 0.25, to - from);
      const roomH = Math.max(h * 0.4, hi - lo);
      st.shift(-((from + to) / 2 / w - 0.5), -((lo + hi) / 2 / h - 0.5));

      items.forEach((it, i) => {
        if (!it) return;
        // (only the object in front, and during the move the one leaving and the one arriving)
        const d = Math.abs((i === 0 ? home : i) - f);
        it.holder.visible = d < 0.995;
        if (!it.holder.visible) return;
        // each object works through its own beat of the copy: 0 as its beat begins, 1 as the next one takes over
        // (the first object coming round again begins its beat once more where the story ends, at 1)
        const s0 = i === 0 ? (home ? 1 : 0) : start(i);
        const end = i === 0 && home ? 1 + start(1) : i < N - 1 ? start(i + 1) : 1;
        it.model.set(1, clamp01(1 - d) ** 0.7, clamp01((p - s0) / Math.max(0.001, end - s0)));
      });
      // the camera frames the object in front and glides to the next
      const i0 = Math.min(M - 2, Math.floor(f));
      const t = f - i0;
      const A = ready(i0);
      const B = at_(i0 + 1) ?? A;
      const qA = clamp01((f - (i0 - 1)) / 2);
      const qB = clamp01((f - i0) / 2);
      const cx = lerp(A.frame.cx, B.frame.cx, t);
      const cy = lerp(A.frame.cy - i0 * SPACE, B.frame.cy - (i0 + 1) * SPACE, t);
      const hw = lerp(A.frame.hw, B.frame.hw, t);
      const hh = lerp(A.frame.hh, B.frame.hh, t);
      let az = lerp(lerp(A.hint.az[0], A.hint.az[1], qA), lerp(B.hint.az[0], B.hint.az[1], qB), t);
      let elev = lerp(lerp(A.hint.elev[0], A.hint.elev[1], qA), lerp(B.hint.elev[0], B.hint.elev[1], qB), t);
      const swing = Math.sin(Math.PI * t);

      const halfW = hw + 0.4;
      const halfH = hh + 0.4;
      // (it draws back a little on the way, so the object leaving and the one arriving are both in view)
      const dist = Math.max(halfH / (0.96 * t2 * (roomH / h)), halfW / (0.96 * t2 * (room / h))) * (1 + 0.24 * swing);
      az += px * 0.07;
      elev -= py * 0.05;
      target.set(cx, cy, 0);
      camera.position.set(target.x + dist * Math.cos(elev) * Math.sin(az), target.y + dist * Math.sin(elev), target.z + dist * Math.cos(elev) * Math.cos(az));
      camera.lookAt(target);
      camera.updateMatrixWorld();

      // the floor under the object in front: it glides with the camera and fades while two share the picture
      const flo = (k: number) => (at_(k)?.model.floorY ?? 0) - k * SPACE;
      dress.update({ floorY: lerp(flo(i0), flo(i0 + 1), t), cx, hw, k: 1 - 0.9 * Math.sin(Math.PI * t) ** 0.6 });
      scene.updateMatrixWorld();
    },
    anchors(): SceneAnchor[] {
      return [];
    },
    dispose() {
      disposed = true;
      items.forEach((it) => it?.model.dispose?.());
      dress.dispose();
      textures.forEach((t) => t.dispose());
      st.dispose();
    },
  };

  handle.setProgress(0);
  return handle;
}
