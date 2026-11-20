import type { MetadataRoute } from "next";
import { cases } from "@/lib/content";
import { siteUrl } from "@/lib/seo";
import { services } from "@/lib/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/services", "/ai-audit", "/work", "/about", "/contact", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.7 })),
    ...services.map((s) => ({ url: `${siteUrl}/services/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...cases.map((c) => ({ url: `${siteUrl}/work/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
