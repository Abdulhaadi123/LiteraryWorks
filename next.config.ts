import type { NextConfig } from "next";

/** Safe, widely supported response headers. (A strict Content-Security-Policy is left out on purpose: the page's first-paint script is inline.) */
const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

/** The admin area and its API: never stored, never framed, never indexed, no referrer sent. */
const adminHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
];

/**
 * The site's own address, when NEXT_PUBLIC_SITE_URL is not set: the host tells the build. Amplify's default address is made
 * of its app id and branch; Netlify gives its main address in URL. (Only those two hosts are recognised, so a stray URL
 * variable elsewhere is never taken for it; with none of this, the settings' own value, or localhost for development, stays.)
 */
function builtSiteUrl(): string {
  const e = process.env;
  if (e.NEXT_PUBLIC_SITE_URL) return e.NEXT_PUBLIC_SITE_URL;
  if (e.AWS_APP_ID && e.AWS_BRANCH) return `https://${e.AWS_BRANCH.replace(/[^A-Za-z0-9-]/g, "-")}.${e.AWS_APP_ID}.amplifyapp.com`;
  if (e.NETLIFY === "true" && e.URL) return e.URL;
  return "";
}
const siteUrlForBuild = builtSiteUrl();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(siteUrlForBuild ? { env: { NEXT_PUBLIC_SITE_URL: siteUrlForBuild } } : {}),
  async headers() {
    return [
      { source: "/:path*", headers: security },
      { source: "/admin/:path*", headers: adminHeaders },
      { source: "/admin", headers: adminHeaders },
      { source: "/api/admin/:path*", headers: adminHeaders },
      // the pictures and brand files are not content-hashed: a day in the cache, then refreshed in the background
      { source: "/scene/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/shots/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/cases/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
      { source: "/og/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }] },
    ];
  },
};

export default nextConfig;
