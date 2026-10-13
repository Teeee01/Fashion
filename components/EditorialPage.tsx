"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { usePageReveal } from "@/lib/transition";
import { clipRise } from "@/lib/reveal";
import EditorialImage from "./EditorialImage";

/* ──────────────────────────────────────────────────────────────
   The shell for editorial pages (/look/[number], /journal/[slug]):
   a small label and a Bodoni headline that rise from their masks once
   the page is on screen, a standfirst, then a large image that opens
   bottom → top. Whatever follows (`children`) uses the site-wide
   data-reveal attributes.
   ────────────────────────────────────────────────────────────── */

type EditorialPageProps = {
  label: string;
  title: string;
  standfirst?: string;
  image: { src: string; alt: string };
  /** Frame shape for the image, e.g. "aspect-[16/9]". */
  aspect?: string;
  children?: ReactNode;
};

export default function EditorialPage({ label, title, standfirst, image, aspect = "aspect-[16/9]", children }: EditorialPageProps) {
  const header = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.set(header.current?.querySelectorAll(".editorial-rise") ?? [], { yPercent: 100 });
  }, []);

  usePageReveal(() => {
    const reduced = prefersReducedMotion();
    const split = SplitText.create(heading.current, { type: "lines", mask: "lines", aria: "none" });
    const rise = header.current?.querySelectorAll(".editorial-rise") ?? [];
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });
      if (reduced) {
        gsap.set(rise, { yPercent: 0 });
        tl.fromTo([split.lines, ...rise], { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
      } else {
        tl.fromTo(split.lines, { yPercent: 100 }, { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines }).to(
          rise,
          { yPercent: 0, duration: DURATION.ui, ease: EASE.text, stagger: STAGGER.nav },
          0.3,
        );
      }
      tl.add(clipRise(media.current, media.current?.firstElementChild ?? null, reduced).play(), reduced ? 0 : 0.4);
    });
    return () => {
      ctx.revert();
      split.revert();
    };
  });

  return (
    <main id="main" tabIndex={-1} className="pt-[160px] pb-[16vh]">
      <div ref={header} className="grid-12 items-end gap-y-8 pb-[8vh]">
        <div className="col-span-12 md:col-span-8">
          <p className="ui-label mask mb-6">
            <span className="editorial-rise block">{label}</span>
          </p>
          <h1 ref={heading} className="headline">
            {title}
          </h1>
        </div>
        {standfirst && (
          <p className="body-copy mask col-span-12 text-stone md:col-span-4">
            <span className="editorial-rise block">{standfirst}</span>
          </p>
        )}
      </div>

      <div className="px-pad">
        <div ref={media} className={`gallery-media relative overflow-hidden bg-loader-grey ${aspect}`}>
          <div className="absolute inset-0">
            <EditorialImage src={image.src} alt={image.alt} sizes="100vw" priority />
          </div>
        </div>
      </div>

      {children}
    </main>
  );
}
