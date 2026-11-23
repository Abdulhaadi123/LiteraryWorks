import { projectIndex } from "@/lib/project-index";
import { services } from "@/lib/services";

/**
 * The question the assistant puts to the visitor above its button, one for each page: `text` is what the bubble says,
 * `ask` is the question it sends when the visitor taps it. Null where a prompt would only get in the way.
 * (This runs on every page, so it uses only the small list of services, not the case studies' full text: the server
 * knows which page the visitor is on.)
 */
export function teaserFor(path: string): { text: string; ask: string } | null {
  const [, a, b] = path.split("/");
  if (a === "services" && b) {
    const name = services.find((s) => s.slug === b)?.name;
    if (name) return { text: `Questions about ${name}? I can walk you through it.`, ask: `How would ${name} work for a business like mine?` };
  }
  const project = a === "work" && b ? projectIndex.find((x) => x.slug === b) : undefined;
  if (project) return { text: `Curious what ${project.name} does? Ask me.`, ask: `What is ${project.name}, and what does it do?` };
  if (a === "work" && b) return { text: "Want to know how this was built, and what changed?", ask: "How was this project built, and what changed for the client?" };
  switch (a) {
    case "":
    case undefined:
      return { text: "Wondering what AI could take off your team's plate?", ask: "What could AI take off my team's plate?" };
    case "services":
      return { text: "Not sure which service fits your business? Ask me.", ask: "Which of your services would fit my business?" };
    case "ai-audit":
      return { text: "What happens in the free one-hour audit? Ask me.", ask: "What happens in the free AI audit?" };
    case "work":
      return { text: "Looking for a project like yours? I can point you to one.", ask: "Which of your projects is closest to my business?" };
    case "about":
      return { text: "Curious how a project with us runs, week by week?", ask: "How does a project with you run?" };
    case "contact":
      return { text: "Prefer a quick answer before you write? Ask me.", ask: "What should I include in my message to the team?" };
    default:
      return null;
  }
}
