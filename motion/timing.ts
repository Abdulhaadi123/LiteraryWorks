/**
 * The pace of a story that plays by itself (the home page's hero: components/Xp.tsx with `auto`) and the numbers it
 * shares with the sequence scene (scenes/deck.ts), so the two cannot drift apart.
 */

/** How long each beat of the story lasts, from its object arriving to the next one taking over. `?beat=<ms>` changes it (a developer switch). */
export const BEAT_MS = 4500;

/** The first beat (the devices, which only stand there) is shorter: the story gets to the objects that move sooner. */
export const FIRST_BEAT_MS = 3000;

/** The services page has ten beats (an introduction and nine services), so each stays a second longer than the others. */
export const SERVICES_BEAT_MS = BEAT_MS + 1000;
export const SERVICES_FIRST_MS = FIRST_BEAT_MS + 1000;

/** The camera takes 2 x PAN of the story's progress to move from one object to the next (scenes/deck.ts). */
export const PAN = 0.022;

/**
 * A story that loops runs a little past its end while the first object comes round again, then starts over from
 * this point. The picture at `1 + LOOP_TAIL` and at `LOOP_TAIL` is the same, so the join cannot be seen. It must be
 * at least PAN, so that the camera has finished its move when the story starts over.
 */
export const LOOP_TAIL = 0.03;

/** The words change this far (in progress) before the camera reaches the next object, so they are ready when it arrives. */
export const COPY_LEAD = 0.012;
