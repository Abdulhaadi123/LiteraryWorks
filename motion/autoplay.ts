import { BEAT_MS, COPY_LEAD, LOOP_TAIL, PAN } from "./timing";

/**
 * Plays a story by itself (the home page's hero). The 3D scene is a pure function of its progress `p` (0..1), and the
 * scroll normally supplies it; here a clock does: `p` runs from the first beat to the last in N x BEAT_MS, the camera
 * glides from object to object, the words change with it, and after the last beat the camera comes round to the first
 * again (the scene's `loop`, see scenes/deck.ts), so the story plays for as long as the visitor stays.
 *
 * It is the visitor's to control. A pause button and one bar for each beat (they fill as the beat plays, and jump to
 * it when clicked) are in the section's markup (components/Xp.tsx). Playing also stops by itself
 *   - while the pointer is over the words (someone is reading, or about to press a button),
 *   - while keyboard focus is on a button or link in the words (and that beat is brought into view),
 *   - while the hero is off screen or the tab is hidden, and
 *   - while the next object is not built yet (the camera waits for it rather than showing the wrong one).
 * It draws frames only while something is moving, and every frame only while the camera is: while an object is simply
 * working through its beat (the slow part) every other frame is drawn, which halves the work for no visible difference. A jump runs the same way as playing, only faster: the camera's own
 * move keeps its pace (about a second) and the long stretches between moves are skipped through.
 *
 * Which beat's words show is a class (`is-on`), not a function of `p`: the words fade and rise by CSS, at their own
 * pace, however fast `p` is moving.
 */

export interface AutoplayOptions {
  section: HTMLElement;
  /** Where each beat begins in the scene's progress: the first is 0, then rising, all below 1. */
  at: number[];
  /** Draws the scene at this progress. */
  show(p: number): void;
  /** Is the object for this beat built, so the camera may travel to it? */
  ready(beat: number): boolean;
  /** Is the hero on screen? */
  visible(): boolean;
  /** Is something else moving the picture (the pointer tilting the camera)? Then every frame is drawn. */
  busy?(): boolean;
  /** How long a beat lasts (default BEAT_MS). */
  beatMs?: number;
  /** How long the first beat lasts (default: as long as the others). */
  firstMs?: number;
}

export interface Autoplay {
  /** Begins playing (the scene is live). */
  start(): void;
  /** Look again: something that was holding it still (the hero off screen, the pointer on the words) has changed. */
  wake(): void;
  /** Is a frame loop running right now? (The pointer's tilt of the camera then leaves the drawing to it.) */
  running(): boolean;
  dispose(): void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** A jump moves through a camera move at this pace (progress per ms: the move, plus a margin, in about a second)... */
const MOVE_MARGIN = 0.006;
const MOVE_SPEED = (2 * PAN + 2 * MOVE_MARGIN) / 1000;
/** ... and across the stretch between two moves in about a fifth of a second. */
const FAST_SPEED = 0.2 / 220;
/** How long the words that are leaving keep their "leaving" class: the length of their fade. */
const LEAVE_MS = 520;
/**
 * The objects after the first are built in the background, each in one piece that can hold the page for most of a second.
 * The story does not start until they all are (nothing moves, so nothing is seen to stall), and gives up waiting after this.
 */
const BUILD_WAIT_MS = 15000;

export function createAutoplay(o: AutoplayOptions): Autoplay {
  const { section, at } = o;
  const N = at.length;
  const rate = 1 / (N * (o.beatMs ?? BEAT_MS));
  const phases = Array.from(section.querySelectorAll<HTMLElement>("[data-phase]"));
  const steps = Array.from(section.querySelectorAll<HTMLButtonElement>("[data-auto-step]"));
  const bars = steps.map((s) => s.querySelector<HTMLElement>("i"));
  const toggle = section.querySelector<HTMLButtonElement>("[data-auto-toggle]");

  /** Where the words change over to each beat: a little before the camera gets there. */
  const sw = at.map((a) => a - COPY_LEAD);
  /** Where each of the camera's moves is centred: to each beat after the first, then round to the first again. */
  const moves = [...at.slice(1), 1];
  /** Where a beat is at rest: the camera has arrived and the words have changed. */
  const rest = (k: number) => at[k] + LOOP_TAIL;

  /** Which beat is playing at progress q, and how far through it (just past the end, the first beat is coming round again). */
  const beatAt = (q: number) => {
    const u = q >= 1 - COPY_LEAD ? q - 1 : q;
    let k = 0;
    for (let i = 1; i < N; i++) if (u >= sw[i]) k = i;
    const end = k + 1 < N ? sw[k + 1] : 1 - COPY_LEAD;
    return { k, frac: clamp01((u - sw[k]) / (end - sw[k])) };
  };
  const inMove = (q: number) => moves.some((m) => Math.abs(q - m) < PAN + MOVE_MARGIN);
  // the first beat may be shorter: the time it saves comes out of its still part, never out of a camera move
  const glide = 2 * (PAN + MOVE_MARGIN);
  const firstRate = o.firstMs ? Math.max(rate, (at[1] - glide) / Math.max(1, o.firstMs - glide / rate)) : rate;
  const rateAt = (q: number) => (inMove(q) ? rate : (q >= 1 ? q - 1 : q) < at[1] ? firstRate : rate);

  /** The camera may only start towards an object once it is built; otherwise the progress waits where the move begins. */
  const limit = (from: number, to: number): number => {
    if (to <= from) return to;
    for (let k = 1; k <= N; k++) {
      const gate = moves[k - 1] - PAN;
      if (from <= gate + 1e-9 && to > gate && !o.ready(k % N)) return gate;
    }
    return to;
  };

  let p = -COPY_LEAD; // (below 0 so that the first beat's bar starts empty; the scene treats it as 0)
  let target: number | null = null;
  let targetBeat = 0;
  let shown = -1;
  let started = false;
  let userPaused = false;
  let hovering = 0;
  let focusing = false;
  let raf = 0;
  let last = 0;
  let lastShow = 0;
  let parity = 0;
  let giveUp = 0;
  let waitTimer = 0;
  const timers = new Set<number>();

  const everyBuilt = () => {
    for (let k = 0; k < N; k++) if (!o.ready(k)) return false;
    return true;
  };
  /** Nothing moves until every object is built (or it has taken too long: then the camera still waits for each one it goes to). */
  const settled = () => everyBuilt() || performance.now() > giveUp;
  const playing = () => !userPaused && !hovering && !focusing;
  const needsFrames = () => started && settled() && (target !== null || playing()) && o.visible() && !document.hidden;

  /** The words and the bars follow the beat that is showing. */
  const switchTo = (k: number) => {
    if (k === shown) return;
    const prev = phases[shown];
    const next = phases[k];
    if (prev) {
      prev.classList.remove("is-on");
      prev.classList.add("is-leaving");
      const id = window.setTimeout(() => {
        prev.classList.remove("is-leaving");
        timers.delete(id);
      }, LEAVE_MS);
      timers.add(id);
    }
    if (next) {
      next.classList.remove("is-leaving");
      next.classList.add("is-on");
    }
    steps.forEach((s, i) => {
      s.classList.toggle("is-active", i === k);
      s.classList.toggle("is-done", i < k);
      if (i === k) s.setAttribute("aria-current", "step");
      else s.removeAttribute("aria-current");
      const bar = bars[i];
      if (bar) bar.style.transform = "";
    });
    section.dataset.beat = String(k);
    shown = k;
  };

  const syncState = () => {
    section.dataset.playing = String(!userPaused);
    section.dataset.moving = String(target !== null);
    if (toggle) {
      const label = userPaused ? "Play the animation" : "Pause the animation";
      toggle.setAttribute("aria-label", label);
      toggle.title = userPaused ? "Play" : "Pause";
    }
  };

  const tick = (now: number) => {
    raf = 0;
    if (!needsFrames()) return; // wake() starts it again
    const dt = Math.min(64, Math.max(0, now - last)); // (a long stall slows the story down instead of skipping it)
    last = now;
    const before = p;
    let next = p;
    let arrived = false;
    if (target !== null) {
      const dir = target >= p ? 1 : -1;
      next = p + dir * (inMove(p) ? MOVE_SPEED : FAST_SPEED) * dt;
      if ((dir > 0 && next >= target) || (dir < 0 && next <= target)) next = target;
      if (dir > 0) next = limit(p, next);
      arrived = next === target;
    } else if (playing()) {
      next = limit(p, p + rateAt(p) * dt);
    }
    // the story has come round: start over from the same picture
    if (next >= 1 + LOOP_TAIL) {
      next -= 1;
      if (target !== null) target -= 1;
    }
    p = next;
    if (arrived) target = null;
    if (target !== null) switchTo(targetBeat);
    else {
      const b = beatAt(p);
      switchTo(b.k);
      const bar = bars[b.k];
      if (bar) bar.style.transform = `scaleX(${b.frac.toFixed(4)})`;
    }
    const again = needsFrames();
    if (p !== before) {
      // every frame while the camera moves, every other one while an object works through its beat; always the last one
      const moving = target !== null || inMove(p) || !!o.busy?.();
      parity ^= 1;
      if (!again || arrived || (moving ? now - lastShow >= 12 : parity === 0 && now - lastShow >= 15)) {
        lastShow = now;
        o.show(p);
      }
    }
    if (arrived) syncState();
    if (again) raf = requestAnimationFrame(tick);
  };

  const wake = () => {
    if (raf || !needsFrames()) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  /** Goes to beat k: forward (round the loop if that is shorter), or back. */
  const jump = (k: number) => {
    if (k < 0 || k >= N) return;
    if (target !== null && k === targetBeat) return;
    const rel = beatAt(p).k;
    if (target === null && k === rel) return;
    const wrapped = p >= 1 - COPY_LEAD; // the first beat is coming round again, just past the end
    let t: number;
    if (wrapped) t = rest(k) + 1;
    else if (k > rel) t = rest(k);
    else if (k === rel) t = rest(k);
    else {
      const back = rel - k;
      t = N - back < back ? rest(k) + 1 : rest(k);
    }
    target = t;
    targetBeat = k;
    syncState();
    wake();
  };

  /* ---- the visitor's controls ---- */
  const onToggle = () => {
    userPaused = !userPaused;
    syncState();
    wake();
  };
  const stepHandlers = steps.map((s, i) => {
    const h = () => jump(i);
    s.addEventListener("click", h);
    return h;
  });
  toggle?.addEventListener("click", onToggle);

  // the pointer over the words pauses: someone is reading, or about to press a button
  const enter = () => {
    hovering++;
  };
  const leave = () => {
    hovering = Math.max(0, hovering - 1);
    if (!hovering) wake();
  };
  phases.forEach((ph) => {
    ph.addEventListener("pointerenter", enter);
    ph.addEventListener("pointerleave", leave);
  });
  // keyboard focus on a button or link in the words pauses, and brings that beat into view (the other beats' buttons are
  // still in the page, but hidden)
  const onFocusIn = (e: FocusEvent) => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.matches(":focus-visible")) return;
    const ph = el.closest<HTMLElement>("[data-phase]");
    if (!ph) return;
    focusing = true;
    const k = phases.indexOf(ph);
    if (k >= 0 && k !== (target !== null ? targetBeat : beatAt(p).k)) jump(k);
  };
  const onFocusOut = (e: FocusEvent) => {
    const to = e.relatedTarget;
    if (!(to instanceof Element) || !to.closest("[data-phase]")) {
      focusing = false;
      wake();
    }
  };
  section.addEventListener("focusin", onFocusIn);
  section.addEventListener("focusout", onFocusOut);
  const onVisibility = () => wake();
  document.addEventListener("visibilitychange", onVisibility);

  const poll = () => {
    waitTimer = 0;
    if (!started) return;
    if (settled()) wake();
    else waitTimer = window.setTimeout(poll, 150);
  };

  return {
    start() {
      started = true;
      giveUp = performance.now() + BUILD_WAIT_MS;
      switchTo(0);
      syncState();
      poll();
    },
    wake,
    running: () => raf !== 0,
    dispose() {
      started = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.clearTimeout(waitTimer);
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      steps.forEach((s, i) => s.removeEventListener("click", stepHandlers[i]));
      toggle?.removeEventListener("click", onToggle);
      phases.forEach((ph) => {
        ph.removeEventListener("pointerenter", enter);
        ph.removeEventListener("pointerleave", leave);
        ph.classList.toggle("is-on", ph === phases[0]);
        ph.classList.remove("is-leaving");
      });
      section.removeEventListener("focusin", onFocusIn);
      section.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
      delete section.dataset.beat;
      delete section.dataset.playing;
      delete section.dataset.moving;
    },
  };
}
