import type { Metadata } from "next";

export const siteName = "LiteraryWorks";

/** The verified public address of the site (set NEXT_PUBLIC_SITE_URL before deploying). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

/** The picture that link previews show (made by scripts/make-brand-assets.mjs from the real 3D model). */
export const ogImage = {
  url: "/og/literaryworks.jpg",
  width: 1200,
  height: 630,
  alt: "LiteraryWorks: AI, software and cloud engineering, built with precision",
};

export function pageMeta(title: string, description: string, path = ""): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path || "/" },
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: `${siteUrl}${path}`,
      siteName,
      type: "website",
      locale: "en_US",
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title: `${title} | ${siteName}`, description, images: [ogImage.url] },
  };
}
