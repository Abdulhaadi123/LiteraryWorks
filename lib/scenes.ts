import type { SceneData } from "@/motion/types";
import { caseForService } from "./content";

/**
 * Which real objects each pinned section shows, one for each beat of its copy, and what a screen reader is told about
 * them. The objects themselves are built in code (motion/models/): our projects on a laptop, a tablet and a phone, an
 * audit report, a robot arm, a headset, a product dashboard, a stock shelf with a scanner, browser windows, phones, a
 * design system, rack servers, a pipeline board and a book of our case studies. As the copy moves on to its next beat,
 * the picture moves on to the next object.
 */

/** Each service's own object, and the one that goes with "What we build" on its page. */
const SERVICE_MODELS: Record<string, [string, string]> = {
  "ai-automation": ["robot", "pipeline"],
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
  robot: "a robot arm moving requests from an inbox to a done tray, with our assistant on the screen behind",
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

/** The home page's story: one object for each of its six beats. */
const STORY = ["devices", "report", "robot", "browsers", "book:handbook", "dashboard"];
export const storyScene = (): SceneData => sequence(STORY, [0, 0.11, 0.31, 0.49, 0.69, 0.88]);

/** An inner page's scene (components/SceneHero.tsx: the headline, two chapters and a closing call to action). */
export function pageScene(variant: string): SceneData {
  return sequence(pageIds(variant), [0, 0.12, 0.5, 0.8]);
}
function pageIds(variant: string): string[] {
  if (variant === "audit") return ["report", "robot", "pipeline", "devices"];
  if (variant === "about") return ["book:about", "report", "browsers", "devices"];
  const [first, second] = SERVICE_MODELS[variant] ?? ["devices", "report"];
  return [first, second, `book:${SERVICE_CASE[variant] ?? "cases"}`, "report"];
}

/** What a screen reader is told about a section's picture. */
export function sceneAria(variant: string): string {
  const ids = variant === "story" ? STORY : pageIds(variant);
  return `A 3D picture that changes with the copy beside it: ${ids.map(describe).join("; then ")}.`;
}

/** The services deck: one object for each service, in the order the site lists them. */
export const servicesAria =
  "Nine 3D scenes, one for each service, shown one at a time: " +
  Object.values(SERVICE_MODELS)
    .map(([m]) => DESC[m])
    .join("; ") +
  ".";
