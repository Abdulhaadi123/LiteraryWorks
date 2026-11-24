/**
 * The version of the pictures in public/ (the case studies, projects and portfolio shots). Change it whenever a picture
 * is replaced under the same name: it goes on the end of the address, so browsers and CDNs fetch the new picture
 * instead of showing the one they kept.
 */
export const ASSET_VERSION = "3";

export const versioned = (path: string) => `${path}?v=${ASSET_VERSION}`;

/** The case studies whose cover picture (public/cases/<slug>.webp) is 1920 pixels wide: the others are 1280. */
export const hdCovers: ReadonlySet<string> = new Set(["fleet-logistics-platform", "ai-sales-coaching"]);
