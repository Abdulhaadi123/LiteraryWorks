import type * as THREE from "three";
import { canvasTexture } from "./kit";

/**
 * What a device's screen shows: one of our own projects, drawn once on a canvas and used as a texture. The size is
 * the shape of the screen (`SCREEN_PX` in devices.ts): 16:10 for a laptop or tablet, 16:9 for a monitor, about 1:2
 * for a phone.
 */

/**
 * A picture of one of our own projects, all of it, in the screen's shape. Where the picture is a little wider or
 * taller than the screen, the strip left over continues its own edge, like a page that carries on past the
 * picture, so nothing is cut off and no frame is drawn. The device's own glass gives the rounded corners.
 */
export function screenTexture(img: HTMLImageElement, maxAniso: number, w = 1024, h = 640): THREE.CanvasTexture {
  return canvasTexture(
    w,
    h,
    (g, cw, ch) => {
      g.imageSmoothingQuality = "high";
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const k = Math.min(cw / iw, ch / ih);
      const dw = iw * k;
      const dh = ih * k;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      if (dy > 0.5) {
        g.drawImage(img, 0, 0, iw, 1, 0, 0, cw, dy + 1);
        g.drawImage(img, 0, ih - 1, iw, 1, 0, dy + dh - 1, cw, ch - dy - dh + 1);
      }
      if (dx > 0.5) {
        g.drawImage(img, 0, 0, 1, ih, 0, 0, dx + 1, ch);
        g.drawImage(img, iw - 1, 0, 1, ih, dx + dw - 1, 0, cw - dx - dw + 1, ch);
      }
      g.drawImage(img, dx, dy, dw, dh);
    },
    maxAniso,
  );
}

/** A screen for a device whose picture could not be fetched: the brand's navy with its green mark and a few lines, so a device never shows a blank. */
export function placeholderScreen(maxAniso: number, w = 1024, h = 640): THREE.CanvasTexture {
  return canvasTexture(
    w,
    h,
    (g, cw, ch) => {
      const bg = g.createLinearGradient(0, 0, cw, ch);
      bg.addColorStop(0, "#2d557a");
      bg.addColorStop(1, "#162b40");
      g.fillStyle = bg;
      g.fillRect(0, 0, cw, ch);
      const u = Math.min(cw, ch);
      g.fillStyle = "#73c94a";
      g.beginPath();
      g.arc(cw / 2, ch * 0.4, u * 0.1, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.35)";
      [0.62, 0.7, 0.78].forEach((y, i) => {
        const lw = cw * (0.3 - i * 0.06);
        g.beginPath();
        g.roundRect(cw / 2 - lw / 2, ch * y, lw, u * 0.022, u * 0.011);
        g.fill();
      });
    },
    maxAniso,
  );
}
