/**
 * The version of the pictures in public/ (the case studies, projects and portfolio shots). Change it whenever a picture
 * is replaced under the same name: it goes on the end of the address, so browsers and CDNs fetch the new picture
 * instead of showing the one they kept.
 */
export const ASSET_VERSION = "2";

export const versioned = (path: string) => `${path}?v=${ASSET_VERSION}`;
