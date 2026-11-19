import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionEngine } from "@/motion/MotionEngine";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LiteraryWorks Technologies | US Enterprise AI & Built Environment Systems",
    template: "%s | LiteraryWorks Technologies",
  },
  description:
    "LiteraryWorks Technologies LLC engineers autonomous AI systems, specialized ConTech digital twins, automated takeoffs, and modern cloud platforms for US enterprises and commercial builders.",
  applicationName: "LiteraryWorks",
  icons: { icon: "/brand-mark.svg" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060911",
};

// Skill Rule 3: The rule that matters most: motion is opt-in.
// A tiny inline script in <head> sets html.motion only if the screen is wide (>=64rem)
// and prefers-reduced-motion is not set. It removes the class after 8 seconds if the engine hasn't started.
const motionBootstrap = `(function(){var d=document.documentElement;d.classList.add('js');var q=window.matchMedia('(min-width: 64rem) and (prefers-reduced-motion: no-preference)');function change(){if(q.matches){d.classList.add('motion')}else{d.classList.remove('motion','motion-ready')}}change();if(q.addEventListener)q.addEventListener('change',change);setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion')},8000)})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBootstrap }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <MotionEngine />
      </body>
    </html>
  );
}
