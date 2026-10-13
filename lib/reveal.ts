"use client";

import { gsap, SplitText } from "./gsap";
import { DURATION, EASE, STAGGER } from "./motion";

/**
 * The house image reveal: the frame opens bottom → top (clip-path) while
 * the photo inside settles from 1.2× to 1×. Returns a paused timeline to
 * play when the image comes into view. Reduced motion: a 0.3s fade.
 */
export function clipRise(media: Element | null, photo: Element | null, reduced: boolean) {
  const tl = gsap.timeline({ paused: true });
  if (!media) return tl;
  if (reduced) {
    gsap.set(media, { clipPath: "inset(0% 0% 0% 0%)" });
    return tl.fromTo(media, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
  }
  tl.fromTo(
    media,
    { clipPath: "inset(100% 0% 0% 0%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: EASE.big },
    0,
  );
  if (photo) tl.fromTo(photo, { scale: 1.2 }, { scale: 1, duration: 1.4, ease: EASE.big }, 0);
  return tl;
}

/**
 * The house text reveal on scroll: lines rise from their masks
 * (yPercent 100 → 0, 0.9s, 0.08s apart) when `el` comes into view.
 * Re-splits on resize. Returns the SplitText so the caller can revert it.
 */
export function riseLinesOnScroll(el: HTMLElement | null, reduced: boolean, start = "top 85%") {
  return SplitText.create(el, {
    type: "lines",
    mask: "lines",
    linesClass: "split-line",
    autoSplit: true,
    onSplit: (self) =>
      gsap.fromTo(
        self.lines,
        reduced ? { autoAlpha: 0 } : { yPercent: 100 },
        {
          ...(reduced
            ? { autoAlpha: 1, duration: DURATION.reduced, ease: "none" }
            : { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines }),
          scrollTrigger: { trigger: el, start, once: true },
        },
      ),
  });
}
