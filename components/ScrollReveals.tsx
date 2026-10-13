"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { clipRise, riseLinesOnScroll } from "@/lib/reveal";

/**
 * Site-wide scroll reveals for small static text, so nothing pops in:
 *   data-reveal="lines" → split into lines that rise from their masks
 *   data-reveal="block" → the element rises inside its parent (give the
 *                         parent the `mask` class); neighbours stagger
 *   data-reveal="card"  → a product card (in a .product-item): its image
 *                         opens bottom → top, then its name and price rise
 * Re-applied on every page, and fully cleaned up when the page changes.
 */
export default function ScrollReveals() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const splits: { revert: () => void }[] = [];

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
        gsap.set(el, { visibility: "visible" });
        splits.push(riseLinesOnScroll(el, reduced, "top 90%"));
      });

      const blocks = gsap.utils.toArray<HTMLElement>('[data-reveal="block"]');
      gsap.set(blocks, reduced ? { visibility: "visible", autoAlpha: 0 } : { visibility: "visible", y: 0, yPercent: 100 });
      ScrollTrigger.batch(blocks, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          reduced
            ? gsap.to(batch, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" })
            : gsap.to(batch, { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines }),
      });

      ScrollTrigger.batch(gsap.utils.toArray<HTMLElement>('[data-reveal="card"]'), {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          batch.forEach((card, i) => {
            const media = card.querySelector("[data-shared-source]");
            const meta = card.querySelector(".product-meta");
            const reveal = clipRise(media, media?.firstElementChild ?? null, reduced);
            if (reduced) gsap.set(meta, { y: 0, yPercent: 0 });
            else reveal.fromTo(meta, { y: 0, yPercent: 100 }, { yPercent: 0, duration: DURATION.text, ease: EASE.text }, 0.5);
            reveal.delay(i * STAGGER.columns).play();
          }),
      });
    });

    return () => {
      ctx.revert();
      splits.forEach((s) => s.revert());
    };
  }, [pathname]);

  return null;
}
