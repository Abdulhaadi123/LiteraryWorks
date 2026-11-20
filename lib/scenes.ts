import type { LabelSpec } from "@/motion/types";
import type { UiKind } from "@/motion/ui";

/**
 * What each page's "connected system" scene draws: the cards that gather around the AI core, and the tags that
 * follow them. A tag's `from`/`to` is a scroll progress inside the scene (`to` is optional: without it the tag
 * stays to the end). The keys are the names the scene gives its cards.
 */

/** The cards of each variant, by name: "hero" is the home page, the others are a service's slug or a page. */
export const systemVariants: Record<string, UiKind[]> = {
  hero: ["apps", "assistant", "voice", "flows", "data", "cloud"],
  audit: ["report", "flows", "data", "assistant"],
  about: ["assistant", "report", "flows", "apps"],
  "ai-automation": ["flows", "assistant", "data", "apps"],
  "ai-voice-systems": ["voice", "assistant", "data"],
  "saas-platforms": ["saas", "apps", "data", "cloud"],
  "enterprise-software": ["data", "apps", "report", "cloud"],
  "ai-web-apps": ["browser", "assistant", "data"],
  "ai-mobile-apps": ["phone", "assistant", "apps"],
  "ui-ux-design": ["wireframe", "apps", "browser"],
  "cloud-devops": ["servers", "cloud", "data"],
  "construction-technology": ["blueprint", "data", "report", "phone"],
};

/** The name of each kind of card, for its tag. */
export const cardLabels: Record<UiKind, string> = {
  apps: "Web and mobile apps",
  assistant: "AI assistants",
  voice: "Voice AI",
  flows: "Workflow automation",
  data: "Data and integrations",
  cloud: "Cloud and security",
  saas: "Billing and accounts",
  phone: "Mobile app",
  wireframe: "Design to screen",
  blueprint: "Plans and estimates",
  browser: "Web app",
  servers: "Deployment pipeline",
  report: "Reports and priorities",
};

/** The tags for a variant, one per card, appearing one after another as the cards gather. */
export function systemLabelsFor(variant: string): LabelSpec[] {
  const kinds = systemVariants[variant] ?? systemVariants.hero;
  return kinds.map((k, i) => ({ key: k, label: cardLabels[k], from: 0.14 + i * 0.03, to: 0.5 }));
}
