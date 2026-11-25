import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";

/** The public site: every page here sits inside the site's header, footer and assistant (see components/SiteChrome.tsx). */
export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SiteChrome>{children}</SiteChrome>;
}
