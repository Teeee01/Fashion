"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import { ribbonState } from "@/lib/ribbon-state";

const MANIFESTO =
  "We take our time. Every seam is a choice, and every fold is one more reason to keep something longer. " +
  "We work in wool, silk and linen, with patterns drawn by hand, so whatever leaves our studio " +
  "can be worn, mended and worn again.";

/* Everything below is scrubbed by scroll, as fractions of the pinned
   stretch (the section's 200vh minus the 100vh stage = 100vh of scroll):
     0    → 0.8   ribbon travels left → right, twist tightens
     0.05 → 0.85  words turn from 15% to full ink, one by one
     0.88 → 1     ribbon fades out; at 1 the canvas stops rendering */
const RIBBON = { start: 0, end: 0.8 };
const WORDS = { start: 0.05, end: 0.85, each: 0.1 };
const FADE = { start: 0.88, end: 1 };

export default function Manifesto() {
  const section = useRef<HTMLElement>(null);
  const text = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      const split = SplitText.create(text.current, { type: "words", wordsClass: "manifesto-word", aria: "none" });
      const words = split.words;

      if (reduced) {
        // Reduced motion: no pinning or scrubbing. The paragraph fades in once
        // (0.3s) and the ribbon fades away as the section passes.
        gsap.fromTo(
          text.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: DURATION.reduced, ease: "none", scrollTrigger: { trigger: text.current, start: "top 85%", once: true } },
        );
        ScrollTrigger.create({
          trigger: section.current,
          start: "center center",
          onEnter: () => gsap.to(ribbonState, { fade: 0, duration: DURATION.reduced, ease: "none" }),
          onLeaveBack: () => gsap.to(ribbonState, { fade: 1, duration: DURATION.reduced, ease: "none" }),
        });
        return () => split.revert();
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          // A touch of smoothing on top of Lenis.
          scrub: 0.6,
        },
      });

      // Pad the timeline to exactly 1 so positions read as scroll fractions.
      tl.set({}, {}, 1);

      tl.fromTo(ribbonState, { progress: 0 }, { progress: 1, duration: RIBBON.end - RIBBON.start }, RIBBON.start);

      const span = WORDS.end - WORDS.start - WORDS.each;
      tl.fromTo(
        words,
        { opacity: 0.15 },
        { opacity: 1, duration: WORDS.each, stagger: span / Math.max(words.length - 1, 1) },
        WORDS.start,
      );

      // The ribbon stops rendering by itself once nothing is showing it.
      tl.fromTo(ribbonState, { fade: 1 }, { fade: 0, duration: FADE.end - FADE.start }, FADE.start);

      return () => split.revert();
    }, section);

    // Layout below the hero is final once fonts are in; re-measure then.
    document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
      ribbonState.progress = 0;
      ribbonState.fade = 1;
    };
  }, []);

  return (
    <section ref={section} id="house" aria-labelledby="house-label" className="manifesto relative h-[200svh] motion-reduce:h-auto">
      <div className="sticky top-0 h-svh overflow-hidden motion-reduce:static">
        <p id="house-label" className="ui-label absolute left-pad top-[112px]" data-reveal="lines">
          (01) The House
        </p>
        <div className="grid-12 h-full items-center">
          <p
            ref={text}
            className="col-span-12 font-display text-[30px] leading-[1.12] tracking-[-0.01em] text-ink md:col-span-6 md:text-[48px] md:leading-[1.08]"
          >
            {MANIFESTO}
          </p>
        </div>
      </div>
    </section>
  );
}
