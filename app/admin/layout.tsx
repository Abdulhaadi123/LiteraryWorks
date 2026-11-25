import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../styles/admin.css";

/** The admin area: its own small shell, kept out of search engines, with none of the public site's header, footer, assistant or 3D code. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Literary Worx admin" },
  description: "Literary Worx admin.",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
  alternates: {},
  openGraph: null,
  twitter: null,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#182f46" };

export default function AdminRootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="adm">{children}</div>;
}
