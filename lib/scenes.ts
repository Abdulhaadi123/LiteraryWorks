import type { LabelSpec } from "@/motion/types";

/**
 * The words that go with each page's 3D scene. The scenes themselves are built in code (motion/models/): every page
 * has its own kind of animation: the home page (an AI core with nine service tiles locking into one halo), the
 * audit (a scan), about (a book in chapters), and one for each service. The keys are the page's variant: "hero", "audit",
 * "about", or a service's slug.
 */

/** The tags of a scene, in the order the model puts them (`Model.tags`): what each point of the picture is. */
const TAGS: Record<string, string[]> = {
  hero: ["AI & automation", "Voice agents", "Web apps", "Cloud & DevOps", "AI core"],
  audit: ["Your workflows", "What the scan finds", "A ranked plan"],
  about: ["Plan", "Build", "Release", "Handover"],
  "ai-automation": ["Requests in", "AI agent", "Done and checked"],
  "ai-voice-systems": ["Live call", "Live audio", "Follow-up"],
  "saas-platforms": ["Interface", "API", "Data", "Cloud"],
  "enterprise-software": ["Documents", "Operations", "Reports"],
  "ai-web-apps": ["Web app", "AI assistant", "Live data"],
  "ai-mobile-apps": ["App screen", "Interface layers", "Notifications"],
  "ui-ux-design": ["Wireframe", "Palette", "Type and components"],
  "cloud-devops": ["Regions", "Monitoring", "Deployments"],
  "construction-technology": ["Blueprint", "Building", "Project view"],
};

/** What a screen reader is told about each picture: what it shows and what it does. */
const ARIA: Record<string, string> = {
  hero: "A 3D picture of an AI core on a glossy stage: a glowing nucleus inside a faceted glass shell and three turning metal rings. Nine tiles, one for each service we build, start as a loose swarm around it; a scan sweeps through them, threads of light join each one to the core, and they lock into one halo while the core powers up.",
  audit: "A 3D picture of an audit: nine of a business's tools (mail, chat, documents, receipts, a calendar, a dashboard, a website, the cloud and a phone) stand on a glass table joined by lines. A scanner gantry sweeps across it; each tool it passes turns green if it works or amber if work is lost there, and the broken links show as dashed lines. Then the three places that matter most rise as numbered columns: the ranked plan.",
  about: "A 3D picture of a book written in chapters: an open book stands on a lectern, its pages turn from Plan to Build to Release to Handover, and each chapter lifts a small model off the page: a floor plan with its walls going up, a stack of blocks falling into place, a rocket lifting off, and a card with a green check and a key. Four index tabs on the book's edge show which chapter is open.",
  "ai-automation": "A 3D picture of an automated workflow: requests (mail, documents, chats, dates, receipts) tumble in along a funnel of light, pass through a ring with a lens of living light, the AI agent, and come out the other side in a straight line, each one checked.",
  "ai-voice-systems": "A 3D picture of a voice call being answered: a ring of ninety-six sound bars round a glowing orb goes from a murmur to a full signal, with ripples across the stage, and the live call, the transcript and the follow-up beside it.",
  "saas-platforms": "A 3D picture of the layers of a software product pulled apart: four plates, the interface, the API, the data and the cloud, each with the parts that live on it, joined by lines of light that carry small packets between them.",
  "enterprise-software": "A 3D picture of an operations room: a curved wall of fifteen live dashboards, maps, charts, tables and a task list, lights up as a wave of light passes across it, with a small AI core on its own stage in front.",
  "ai-web-apps": "A 3D picture of the anatomy of a web app: a browser window built of four layers that pull apart in depth, with the assistant, live data, the code and the account docking round it and lines of light between them.",
  "ai-mobile-apps": "A 3D picture of a mobile app pulled apart: a phone with a chat app on it, and the layers of its screen, the messages, a notification and the reply with a heart, lifting off it, with two more of our apps behind it joined by a path of light.",
  "ui-ux-design": "A 3D picture of a design canvas: an artboard in a selection frame, where a line of light turns a grey wireframe into the finished screen while a cursor follows it, with a palette, a type specimen, component states and a bezier curve floating round it.",
  "cloud-devops": "A 3D picture of a planet drawn in points of light on a projector base: eleven cloud regions light up on it and arcs of light run between them carrying pulses, with a ring of marks for monitoring and a satellite on an orbit.",
  "construction-technology": "A 3D picture of a building going up on a blueprint: a tower crane lifts each glass floor from the stock pile, swings it over the site and lowers it onto the stack, with the ghost of the finished building, a dimension line and a project view.",
};

/** Where a scene needs its tags to come in at other times than the usual (the audit's plan only appears once the scan is done). */
const TAG_FROM: Record<string, number[]> = { audit: [0.26, 0.3, 0.5] };

/** The tags for a page's scene, appearing one after another as it comes together and gone before it settles. */
export function systemLabelsFor(variant: string): LabelSpec[] {
  const tags = TAGS[variant] ?? TAGS.hero;
  return tags.map((label, i) => ({ key: String(i), label, from: TAG_FROM[variant]?.[i] ?? 0.28 + i * 0.035, to: 0.82 }));
}

export const sceneAria = (variant: string): string => ARIA[variant] ?? ARIA.hero;
