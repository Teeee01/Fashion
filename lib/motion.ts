"use client";

import { gsap, SplitText } from "./gsap";

/* ──────────────────────────────────────────────────────────────
   Motion rules — every animation on the site reads from here.
   ────────────────────────────────────────────────────────────── */

export const EASE = {
  /** Big moves: panels, columns, images, page transitions. */
  big: "seve",
  /** Text and fades. */
  text: "power3.out",
} as const;

export const DURATION = {
  ui: 0.5, // small UI: 0.4–0.6s
  text: 0.9, // text reveals: 0.8–1.0s
  big: 1.2, // big moves: 1.0–1.4s
  reduced: 0.3, // reduced-motion fade
} as const;

export const STAGGER = {
  lines: 0.08,
  words: 0.03,
  columns: 0.06,
  nav: 0.07,
} as const;

/** Two big moves may overlap by at most this fraction of the first one. */
export const MAX_OVERLAP = 0.3;

/**
 * Timeline position for the next big move: starts when the previous tween
 * is 70% done, so big moves never begin at the same moment.
 *   tl.to(a, { duration: 1.2, ease: EASE.big })
 *     .to(b, { duration: 1.2, ease: EASE.big }, afterBigMove(1.2))
 */
export function afterBigMove(previousDuration: number = DURATION.big) {
  return `>-${(previousDuration * MAX_OVERLAP).toFixed(3)}`;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RevealOptions = {
  /** Split into lines (default) or words. */
  by?: "lines" | "words";
  delay?: number;
  duration?: number;
  stagger?: number;
  /** Add to an existing timeline instead of playing immediately. */
  timeline?: gsap.core.Timeline;
  position?: gsap.Position;
};

/**
 * The house text reveal: text is split into lines or words, each wrapped in
 * an overflow-hidden mask, and rises from yPercent 100 → 0.
 * Under reduced motion it becomes a plain 0.3s fade.
 * Returns the SplitText instance so callers can `revert()` it on cleanup.
 */
export function revealText(target: gsap.DOMTarget, options: RevealOptions = {}) {
  const { by = "lines", delay = 0, timeline, position } = options;
  gsap.set(target, { visibility: "visible" });

  if (prefersReducedMotion()) {
    const tween = gsap.fromTo(
      target,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: DURATION.reduced, ease: "none", delay },
    );
    if (timeline) timeline.add(tween, position);
    return null;
  }

  const split = SplitText.create(target, {
    type: by === "lines" ? "lines" : "words,lines",
    mask: by,
    linesClass: "split-line",
    wordsClass: "split-word",
    // Re-split on resize / font load so line breaks stay correct
    // (only for standalone reveals; timelines are built once).
    autoSplit: !timeline,
    onSplit(self) {
      const pieces = by === "lines" ? self.lines : self.words;
      const tween = gsap.from(pieces, {
        yPercent: 100,
        duration: options.duration ?? DURATION.text,
        ease: EASE.text,
        stagger: options.stagger ?? (by === "lines" ? STAGGER.lines : STAGGER.words),
        delay: timeline ? 0 : delay,
      });
      if (timeline) timeline.add(tween, position);
      return tween;
    },
  });

  return split;
}
