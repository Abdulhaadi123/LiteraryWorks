import type { LabelSpec } from "@/motion/types";

/**
 * The words that go with each page's 3D scene. The scenes themselves are built in code (motion/models/): every page
 * has its own kind of animation, with our own projects on its screens: the home page (devices wired to an AI core), the
 * audit (a scan), about (a journey), and one for each service. The keys are the page's variant: "hero", "audit",
 * "about", or a service's slug.
 */

/** The tags of a scene, in the order the model puts them (`Model.tags`): what each point of the picture is. */
const TAGS: Record<string, string[]> = {
  hero: ["Web app", "Mobile app", "AI assistant", "Dashboard", "AI core"],
  audit: ["Your workflows", "What the scan finds", "A ranked plan"],
  about: ["Plan", "Build", "Release", "Handover"],
  "ai-automation": ["Requests in", "AI agent", "Done and checked"],
  "ai-voice-systems": ["Caller", "Live audio", "Follow-up"],
  "saas-platforms": ["Interface", "API", "Data", "Cloud"],
  "enterprise-software": ["Documents", "Operations", "Reports"],
  "ai-web-apps": ["Web app", "AI assistant", "Live data"],
  "ai-mobile-apps": ["App screen", "Interface layers", "Notifications"],
  "ui-ux-design": ["Wireframe", "Palette", "Final screens"],
  "cloud-devops": ["Regions", "Monitoring", "Servers"],
  "construction-technology": ["Blueprint", "Building", "Project view"],
};

/** What a screen reader is told about each picture: what it shows and what it does. */
const ARIA: Record<string, string> = {
  hero: "A 3D picture of a laptop, two phones and a tablet with our own projects on their screens. They start loose, drift into one arrangement, light up and are wired together by an AI core.",
  audit: "A 3D picture of an audit: five pages of a business's work stand in an arc, a curtain of light sweeps across them and marks what it finds, and a ranked plan appears in front.",
  about: "A 3D picture of a journey: a road draws itself across the ground with four stops (plan, build, release, handover), each with one of our projects on it, while a light travels along it.",
  "ai-automation": "A 3D picture of an automated workflow: requests, shown as our own projects, arrive in a tangle, pass through an AI agent and come out the other side tidy and checked.",
  "ai-voice-systems": "A 3D picture of a voice call being answered: the caller's screen inside a ring of sound bars that wakes into a live waveform, with the transcript and the follow-up beside it.",
  "saas-platforms": "A 3D picture of the layers of a software product pulled apart: the interface, the API, the data and the cloud, joined by lines that carry small lights.",
  "enterprise-software": "A 3D picture of a tower of screens: three rings of our own projects turn on a spine and rise onto a base.",
  "ai-web-apps": "A 3D picture of the anatomy of a web app: a browser window with one of our products in it, and the pieces it is made of (an AI assistant, live data, settings, code, an account) docking round it.",
  "ai-mobile-apps": "A 3D picture of a mobile app pulled apart: a phone with one of our apps on it, and the layers of its screen, a notification, a reply and a like lifting off it.",
  "ui-ux-design": "A 3D picture of a design coming together: a grey wireframe is painted into a finished screen by a sweeping line, beside a palette of colours, a type tile and a pen path.",
  "cloud-devops": "A 3D picture of a globe of cloud regions with lines arcing between them and carrying small lights, beside a server rack and a monitoring screen.",
  "construction-technology": "A 3D picture of a building going up: a blueprint on the ground, a tower crane, and the floors of a building coming down onto each other, with a project screen beside it.",
};

/** Where a scene needs its tags to come in at other times than the usual (the audit's plan only appears once the scan is done). */
const TAG_FROM: Record<string, number[]> = { audit: [0.26, 0.3, 0.5] };

/** The tags for a page's scene, appearing one after another as it comes together and gone before it settles. */
export function systemLabelsFor(variant: string): LabelSpec[] {
  const tags = TAGS[variant] ?? TAGS.hero;
  return tags.map((label, i) => ({ key: String(i), label, from: TAG_FROM[variant]?.[i] ?? 0.28 + i * 0.035, to: 0.82 }));
}

export const sceneAria = (variant: string): string => ARIA[variant] ?? ARIA.hero;
