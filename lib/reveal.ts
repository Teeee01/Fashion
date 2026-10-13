"use client";

import { gsap } from "./gsap";
import { DURATION, EASE } from "./motion";

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
