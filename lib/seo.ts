import type { Metadata } from "next";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function pageMeta(title: string, description: string, path = ""): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path || "/" },
    openGraph: {
      title: `${title} | LiteraryWorks`,
      description,
      url: `${siteUrl}${path}`,
      siteName: "LiteraryWorks",
      type: "website",
    }
  };
}
