import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionEngine } from "@/motion/MotionEngine";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "LiteraryWorks | Engineering Intelligence. Building What's Next.", template: "%s | LiteraryWorks" },
  description: "LiteraryWorks helps US businesses build with intelligence through AI agents, custom software, enterprise integrations, cloud engineering and digital transformation.",
  applicationName: "LiteraryWorks",
  icons: { icon: "/brand-mark.svg" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#101E30" };

// The tiny bootstrap adds motion ONLY on wide, non-reduced-motion displays.
// The watchdog restores readable static content if the motion engine never boots.
const motionBootstrap = `(function(){var d=document.documentElement;d.classList.add('js');var q=window.matchMedia('(min-width: 64rem) and (prefers-reduced-motion: no-preference)');function change(){if(q.matches){d.classList.add('motion')}else{d.classList.remove('motion','motion-ready')}}change();if(q.addEventListener)q.addEventListener('change',change);setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion')},8000)})();`;

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><head><script dangerouslySetInnerHTML={{__html: motionBootstrap}}/></head><body><a className="skip-link" href="#main-content">Skip to content</a><Header/><main id="main-content">{children}</main><Footer/><MotionEngine/></body></html>;
}
