/**
 * Split a heading into words (or letters) for a masked rise-in. Works on text that sits inside inline elements
 * (an italic accent word). Screen readers get the full text through a visually hidden copy; the split pieces
 * are aria-hidden. `revert()` restores the original markup.
 */
export interface SplitResult {
  /** What to animate: one span per word, or per letter. */
  parts: HTMLElement[];
  revert: () => void;
}

type Segmenter = new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> };

const graphemes = (text: string): string[] => {
  const S = (Intl as unknown as { Segmenter?: Segmenter }).Segmenter;
  return S ? Array.from(new S(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment) : Array.from(text);
};

export function splitText(el: HTMLElement, mode: "words" | "chars"): SplitResult {
  const original = el.innerHTML;
  const fullText = el.textContent ?? "";
  const parts: HTMLElement[] = [];

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const value = node.nodeValue ?? "";
    if (!value.trim()) continue;
    const frag = document.createDocumentFragment();
    for (const piece of value.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) {
        frag.appendChild(document.createTextNode(piece));
        continue;
      }
      const word = document.createElement("span");
      word.className = "split-word";
      word.setAttribute("aria-hidden", "true");
      if (mode === "chars") {
        for (const ch of graphemes(piece)) {
          const part = document.createElement("span");
          part.className = "split-part";
          part.textContent = ch;
          word.appendChild(part);
          parts.push(part);
        }
      } else {
        const part = document.createElement("span");
        part.className = "split-part";
        part.textContent = piece;
        word.appendChild(part);
        parts.push(part);
      }
      frag.appendChild(word);
    }
    node.replaceWith(frag);
  }

  const readable = document.createElement("span");
  readable.className = "sr-only";
  readable.textContent = fullText;
  el.prepend(readable);

  return {
    parts,
    revert: () => {
      el.innerHTML = original;
    },
  };
}
