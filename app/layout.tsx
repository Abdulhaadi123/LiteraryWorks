import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileCta } from "@/components/MobileCta";
import { ogImage, siteName, siteUrl } from "@/lib/seo";
import { headScript } from "@/motion/head";
import { MotionRoot } from "@/motion/MotionRoot";
import "./globals.css";

/**
 * Inter, the typeface Sparkix and FAYD use: one variable file (27 KB: weights 400 to 800 and the Western European
 * characters, see app/fonts/README.txt; SIL Open Font License, so it lives in the repository and the build needs
 * no network). next/font preloads it and adds a size-matched fallback, so the swap does not move the text.
 */
const inter = localFont({
  src: "./fonts/inter-latin-400-800.woff2",
  variable: "--font-inter",
  weight: "400 800",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | AI, software and cloud systems for U.S. businesses`,
    template: `%s | ${siteName}`,
  },
  description:
    "LiteraryWorks designs and builds AI automation, web and mobile apps and cloud systems for U.S. businesses. Start with a free 1-hour AI audit.",
  applicationName: siteName,
  openGraph: { siteName, type: "website", locale: "en_US", url: siteUrl, images: [ogImage] },
  twitter: { card: "summary_large_image", images: [ogImage.url] },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // `suppressHydrationWarning`: the head script adds classes (js, motion) to <html> before React hydrates
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <MobileCta />
        <ChatLauncher />
        <MotionRoot />
      </body>
    </html>
  );
}
