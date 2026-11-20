import type { ReactNode, SVGProps } from "react";

/**
 * A small set of line icons, drawn on a 24 px grid and coloured by `currentColor`: one for each service and a few
 * for sectors and ideas. Inline, so there is nothing to fetch.
 */
const paths: Record<string, ReactNode> = {
  sparkles: (
    <>
      <path d="M11 3.5l1.9 5.2L18 10.6l-5.1 1.9L11 17.7l-1.9-5.2L4 10.6l5.1-1.9z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l9 4.4-9 4.4-9-4.4z" />
      <path d="M3 12.2l9 4.4 9-4.4M3 16.4l9 4.4 9-4.4" />
    </>
  ),
  building: (
    <>
      <path d="M4.5 21V5.5A1.5 1.5 0 016 4h7.5A1.5 1.5 0 0115 5.5V21M15 9.5h3.5A1.5 1.5 0 0120 11v10M2.5 21h19" />
      <path d="M8 8h3M8 12h3M8 16h3" />
    </>
  ),
  browser: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18M6.5 6.5h.01M9.5 6.5h.01" />
      <path d="M12 12.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.6" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20l4.4-1.1L19 8.3a2.2 2.2 0 00-3.1-3.1L5.3 15.8z" />
      <path d="M14 7.1l2.9 2.9" />
    </>
  ),
  cloud: <path d="M7 18.5a4.5 4.5 0 01-.7-8.95A6 6 0 0118 10.6 3.95 3.95 0 0117.2 18.5z" />,
  hardhat: (
    <>
      <path d="M2.5 18.5h19V20h-19z" />
      <path d="M4.5 18.5v-1.2a7.5 7.5 0 0115 0v1.2" />
      <path d="M12 6.5v4M9 8.5v2M15 8.5v2" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="2.6" />
      <path d="M9 4h6v2.5H9zM8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </>
  ),
  package: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5h10a3 3 0 013 3V20H8a3 3 0 01-3-3z" />
      <path d="M5 17a3 3 0 013-3h10" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20.5s-8-4.7-8-10.6A4.4 4.4 0 0112 7.6a4.4 4.4 0 018 2.3c0 5.9-8 10.6-8 10.6z" />
      <path d="M4.5 12.5h3.2l1.6-2.6 2.4 5 1.6-2.4h4.2" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3v3.5h-7z" />
      <circle cx="7" cy="17.8" r="1.8" />
      <circle cx="17" cy="17.8" r="1.8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4.5M4 20h16.5" />
      <path d="M8 15.5l3.2-4 3 2.3 4.3-6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.6" />
      <path d="M9 7V5.7A1.7 1.7 0 0110.7 4h2.6A1.7 1.7 0 0115 5.7V7M3 13h18" />
    </>
  ),
  home: <path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5.5h4V20" />,
  cart: (
    <>
      <path d="M3 4h2.5l2.1 11h10.1l2-8H6.4" />
      <circle cx="9.3" cy="19" r="1.4" />
      <circle cx="16.8" cy="19" r="1.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />
      <path d="M8.8 12l2.3 2.3 4.2-4.6" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export function Icon({ name, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {paths[name]}
    </svg>
  );
}

/** The icon of each service, by its slug. */
export const serviceIcon: Record<string, IconName> = {
  "ai-automation": "sparkles",
  "ai-voice-systems": "mic",
  "saas-platforms": "layers",
  "enterprise-software": "building",
  "ai-web-apps": "browser",
  "ai-mobile-apps": "phone",
  "ui-ux-design": "pen",
  "cloud-devops": "cloud",
  "construction-technology": "hardhat",
};
