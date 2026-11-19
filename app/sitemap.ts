import type { MetadataRoute } from "next";
import { services } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/services", "/industries", "/construction", "/about", "/contact", "/privacy", ...services.map(s=>`/services/${s.slug}`)];
  return paths.map(path => ({url: `${siteUrl}${path}`, changeFrequency: "monthly", priority: path === "" ? 1 : 0.7}));
}
