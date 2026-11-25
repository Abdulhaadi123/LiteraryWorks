import type { ReactNode } from "react";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileCta } from "@/components/MobileCta";
import { MotionRoot } from "@/motion/MotionRoot";
import "@/app/globals.css";

/**
 * Everything that frames a public page: the skip link, the floating header, the footer, the phone booking button,
 * the assistant and the motion engine, plus the site's stylesheet. It lives here, not in the root layout, so the
 * admin area (app/admin) can be a separate, much lighter shell: it loads none of this.
 */
export function SiteChrome({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MobileCta />
      <ChatLauncher />
      <MotionRoot />
    </>
  );
}
