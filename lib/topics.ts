/** What a visitor can say they need help with. Shared by the contact form and the inquiry API. */
export const topics = [
  { key: "audit", value: "Free AI audit" },
  { key: "ai-automation", value: "AI and automation" },
  { key: "ai-voice-systems", value: "AI voice systems" },
  { key: "saas-platforms", value: "SaaS platforms" },
  { key: "enterprise-software", value: "Enterprise software" },
  { key: "ai-web-apps", value: "AI web apps" },
  { key: "ai-mobile-apps", value: "AI mobile apps" },
  { key: "ui-ux-design", value: "UI/UX design" },
  { key: "cloud-devops", value: "Cloud and DevOps" },
  { key: "construction-technology", value: "Construction technology" },
  { key: "other", value: "Something else" },
] as const;

export type TopicValue = (typeof topics)[number]["value"];
