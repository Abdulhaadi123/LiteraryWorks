export const site = {
  name: "LiteraryWorks",
  tagline: "AI, software and cloud systems for U.S. businesses.",
};

/** Our own product and its website (the product sheet on the home page and the link in the bar both use this). */
export const balosys = { name: "Balosys", url: "https://balosys.com/" };

export interface NavItem {
  href: string;
  label: string;
  /** A link to another website (opens in a new tab). */
  external?: boolean;
}

export const nav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/ai-audit", label: "AI audit" },
  { href: "/work", label: "Case studies" },
  { href: "/about", label: "About" },
  // our own product, on its own site (as on the company's previous website)
  { href: balosys.url, label: `Visit ${balosys.name}`, external: true },
];
