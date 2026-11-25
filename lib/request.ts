/**
 * What the server learns about a request from its headers, in one place: who the visitor is (address, country) and whether the
 * request comes from a page of this same site. No imports, so the public APIs and the admin area share it cheaply. It reads
 * the host's own headers, so it works on Vercel, Netlify, behind Cloudflare or CloudFront, and on a plain Node server.
 */

const env = (name: string) => (process.env[name] ?? "").trim();

/** An address out of a header value: the first of a list, without a port ("1.2.3.4:5678", "[::1]:5678"). */
function cleanIp(value: string): string {
  const first = value.split(",")[0].trim();
  const v6 = /^\[([^\]]+)\](?::\d+)?$/.exec(first);
  if (v6) return v6[1];
  const v4 = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(first);
  return v4 ? v4[1] : first;
}

/**
 * The visitor's address, from the header the HOST sets itself (so a visitor cannot forge it): Vercel's
 * x-vercel-forwarded-for, Netlify's x-nf-client-connection-ip. Any other host: name the header in TRUSTED_IP_HEADER
 * (Cloudflare: cf-connecting-ip; Amplify behind CloudFront: cloudfront-viewer-address). With none of these it falls back to
 * x-real-ip, then the first x-forwarded-for entry, which a visitor can forge unless the proxy in front overwrites it.
 */
export function clientIp(headers: Headers): string {
  const named = env("TRUSTED_IP_HEADER").toLowerCase();
  const own = named || (process.env.VERCEL ? "x-vercel-forwarded-for" : process.env.NETLIFY ? "x-nf-client-connection-ip" : "");
  const raw = (own && headers.get(own)) || headers.get("x-real-ip") || headers.get("x-forwarded-for") || "";
  return cleanIp(raw).slice(0, 64) || "unknown";
}

/** The visitor's country (two letters) where the host says it; only used as a note on a message, so it is not trusted for anything else. */
export function clientCountry(headers: Headers): string | undefined {
  const raw = (headers.get("x-vercel-ip-country") || headers.get("cloudfront-viewer-country") || headers.get("cf-ipcountry") || "").toUpperCase();
  return /^[A-Z]{2}$/.test(raw) ? raw : undefined;
}

/**
 * True when the request comes from a page of this same site: the Origin header must be the host the request was made to
 * (Host, or X-Forwarded-Host behind a proxy), or the host of NEXT_PUBLIC_SITE_URL (the site's own address, for hosts
 * whose proxy hands the server a different Host). A page on another site cannot set these headers in a visitor's browser.
 */
export function sameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  let from: string;
  try {
    from = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  for (const name of ["x-forwarded-host", "host"]) {
    const h = headers.get(name)?.split(",")[0].trim();
    if (h) allowed.add(h);
  }
  const site = env("NEXT_PUBLIC_SITE_URL");
  if (site) {
    try {
      allowed.add(new URL(site).host);
    } catch {
      /* a placeholder or a typo: ignored */
    }
  }
  return allowed.has(from);
}
