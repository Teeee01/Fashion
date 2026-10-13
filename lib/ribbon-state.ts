"use client";

import { useSyncExternalStore } from "react";

/**
 * Values that page timelines animate and the 3D ribbon reads every frame.
 * Kept free of Three.js so sections can tween them without loading 3D code.
 *   contrast 0 → washed-out, almost white ribbon; 1 → full light and shade
 *   progress 0 → hero position (left, loose twist); 1 → manifesto end
 *            (right side, twist tightened, extra half turn)
 */
export const ribbonState = {
  contrast: 0,
  progress: 0,
  /** Manifesto fade: 1 → 0 as the manifesto ends. */
  fade: 1,
  /** Footer: 0 → 1 as the footer arrives (the ribbon returns). */
  outroFade: 0,
  /** Footer: 0 → 1 moves the ribbon to `outroX/outroY` and shrinks it. */
  outro: 0,
  /** Where the ribbon settles behind the wordmark, as screen fractions. */
  outroX: 0.5,
  outroY: 0.85,
};

/** The ribbon's visibility: whichever fade is showing it. */
export const ribbonOpacity = () => Math.max(ribbonState.fade, ribbonState.outroFade);

/* Whether the ribbon canvas should render at all. It switches off while
   the ribbon is fully faded out, so the GPU rests. */
let active = true;
const listeners = new Set<() => void>();

export function setRibbonActive(next: boolean) {
  if (active === next) return;
  active = next;
  listeners.forEach((l) => l());
}

export function useRibbonActive() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => active,
    () => true,
  );
}
