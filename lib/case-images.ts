/** The size of each gallery picture of a case study (public/cases/<slug>/<n>.webp, n from 1; the cover is separate), so the page can hold their room while they load. Made by the picture download; do not edit. */
export const caseImages: Record<string, [number, number][]> = {
  "ai-medical-scribe": [[1280, 660], [1280, 661], [1280, 662]],
  "ai-voice-system": [[1280, 661], [1280, 661], [1280, 660], [1280, 660], [1280, 660], [1280, 661]],
  "ai-sales-coaching": [[1280, 725]],
  "internal-ai-assistant": [[1280, 617], [1280, 616], [1280, 611], [1280, 620]],
  "fleet-logistics-platform": [[1280, 653], [1280, 645], [1280, 654], [1280, 584], [1280, 623]],
};
