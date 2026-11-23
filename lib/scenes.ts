import type { SceneData } from "@/motion/types";
import { caseForService } from "./content";

/**
 * Which real objects each pinned section shows, one for each beat of its copy, and what a screen reader is told about
 * them. The objects themselves are built in code (motion/models/): our projects on a laptop, a tablet and a phone, an
 * audit report, a document scanner, a system blueprint, a speakerphone, a headset, a product dashboard, a stock shelf with a scanner, browser windows, phones, a
 * design system, rack servers, a pipeline board and a book of our case studies. As the copy moves on to its next beat,
 * the picture moves on to the next object.
 */

/** Each service's own object, and the one that goes with "What we build" on its page. */
const SERVICE_MODELS: Record<string, [string, string]> = {
  "ai-automation": ["scanner", "pipeline"],
  "ai-voice-systems": ["headset", "phones"],
  "saas-platforms": ["dashboard", "servers"],
  "enterprise-software": ["warehouse", "pipeline"],
  "ai-web-apps": ["browsers", "dashboard"],
  "ai-mobile-apps": ["phones", "uikit"],
  "ui-ux-design": ["uikit", "browsers"],
  "cloud-devops": ["servers", "dashboard"],
  "construction-technology": ["pipeline", "dashboard"],
};
/** The case study each service's page opens the book at ("The result, in practice"). */
const SERVICE_CASE: Record<string, string> = { ...caseForService, "ai-mobile-apps": "ai-voice-system", "construction-technology": "fleet-logistics-platform" };

const DESC: Record<string, string> = {
  devices: "our projects on a laptop, a tablet and a phone",
  report: "an audit report whose checklist is ticked under a magnifying glass",
  scanner: "a document scanner taking in invoices, orders and contracts one by one and sending each to the right system, with our automation projects on a monitor",
  blueprint: "a blueprint of a client's system plan unrolling on the table, with a ruler and a pencil",
  hub: "an aluminium hub whose ports take the cables of the tools a business uses, one after another, each light turning green",
  product: "a white product box whose lid lifts away to show two phones with our Beanstalk and DreamyBot apps waking up inside",
  calculator: "a printing calculator whose keys are pressed in turn while its paper tape rolls out to a green total",
  stopwatch: "a stopwatch whose hand makes one full turn of its sixty-minute dial while a green ring fills",
  calendar: "a desk calendar open at a two-week page, its days ticked off one by one and the last day ringed",
  keys: "three binders of documentation standing on the table, and a ring of keys with a green tag sliding in front of them",
  letter: "an envelope addressed to LiteraryWorks; a letter slides in, the flap closes and a green seal goes on",
  call: "a conference speakerphone whose light turns green as the call starts, beside a phone with the invite for a free one-hour session",
  headset: "a call-centre headset on its stand beside a phone with a live call",
  dashboard: "a product dashboard with usage bars, plans, accounts and a donut chart standing out of it",
  warehouse: "a shelf of stock whose labels a handheld scanner reads, beside a rugged tablet with our operations platforms",
  browsers: "three browser windows with web apps we built",
  phones: "three of our apps on phones standing on a podium",
  uikit: "a wireframe that fills in beside a phone with the finished design, with a switch, a slider, a button and the colours",
  servers: "four rack servers closing into one stack beside a build, test, deploy and monitor pipeline",
  pipeline: "a pipeline board where jobs move from lead to estimate to contract to project, with a tablet showing the schedule",
  book: "a book of our case studies that turns to the right page",
  handbook: "the system handbook a client gets at handover, its pages turning",
  about: "a book of our principles, its pages turning",
};
const describe = (id: string) => (id.startsWith("book:") ? DESC[id.slice(5)] ?? DESC.book : DESC[id] ?? id);

const sequence = (ids: string[], at: number[]): SceneData => ({ variant: ids[0], items: ids.map((id) => ({ id, title: id })), at });

/** The home page's story: one object for each of its four beats. */
// (only the home page shows these four: no other page repeats them)
const STORY = ["devices", "report", "hub", "product"];
// (it plays by itself and comes round to its first object again: see `loop` in motion/types.ts)
export const storyScene = (): SceneData => ({ ...sequence(STORY, [0, 0.25, 0.5, 0.75]), loop: true });

/** An inner page's scene (components/SceneHero.tsx: the headline, two chapters and a closing call to action). */
export function pageScene(variant: string): SceneData {
  return sequence(pageIds(variant), [0, 0.12, 0.5, 0.8]);
}
function pageIds(variant: string): string[] {
  if (variant === "audit") return ["calculator", "stopwatch", "calendar", "book:handbook"];
  if (variant === "about") return ["book:about", "blueprint", "keys", "letter"];
  const [first, second] = SERVICE_MODELS[variant] ?? ["dashboard", "pipeline"];
  return [first, second, `book:${SERVICE_CASE[variant] ?? "cases"}`, "call"];
}

/** What a screen reader is told about a section's picture. */
export function sceneAria(variant: string): string {
  const ids = variant === "story" ? STORY : pageIds(variant);
  return `A 3D picture that changes with the copy beside it: ${ids.map(describe).join("; then ")}.`;
}

/** Bumped whenever the stills are rendered again, so browsers fetch the new pictures instead of a cached old one. */
export const STILL_VERSION = "4";

/** What a service's still (the home page's grid) shows. */
export const serviceStillAlt = (slug: string): string => {
  const d = DESC[(SERVICE_MODELS[slug] ?? ["devices"])[0]] ?? "";
  return d.charAt(0).toUpperCase() + d.slice(1);
};

/** The services deck: one object for each service, in the order the site lists them. */
export const servicesAria =
  "Nine 3D scenes, one for each service, shown one at a time: " +
  Object.values(SERVICE_MODELS)
    .map(([m]) => DESC[m])
    .join("; ") +
  ".";
