import type { LabelSpec } from "@/motion/types";

/**
 * Labels that follow points on the model. Each `from`/`to` is a scroll progress inside the scene. The model opens
 * from the top down and closes in exactly the reverse order (the watch story's "perfect return loop"), so a label
 * that appears late disappears early.
 */

/** The seven layers of one system, from what people touch down to where it runs. */
export const assemblyLabels: LabelSpec[] = [
  { key: "interface", label: "Web and mobile apps", note: "What your customers and team use", from: 0.12, to: 0.88 },
  { key: "design", label: "UI/UX design", note: "Clear the first time they use it", from: 0.16, to: 0.84 },
  { key: "ai", label: "AI and voice", note: "Agents that read, route, answer and act", from: 0.2, to: 0.8 },
  { key: "workflows", label: "Workflow automation", note: "The steps, run and tracked for you", from: 0.24, to: 0.76 },
  { key: "data", label: "Data", note: "Your records, clean and connected", from: 0.28, to: 0.72 },
  { key: "integrations", label: "Integrations", note: "Wired into the tools you already use", from: 0.32, to: 0.68 },
  { key: "cloud", label: "Cloud and security", note: "Hosting, access and monitoring", from: 0.36, to: 0.64, tone: "navy" },
];
