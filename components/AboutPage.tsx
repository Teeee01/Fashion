"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { usePageReveal } from "@/lib/transition";
import { clipRise } from "@/lib/reveal";
import { ABOUT } from "@/lib/about";

/* ──────────────────────────────────────────────────────────────
   /about. The photo opens bottom → top while the name rises from its
   mask; the paragraphs rise line by line as they scroll into view.
   The words live in lib/about.ts.
   ────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  const header = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.set(header.current?.querySelectorAll(".about-rise") ?? [], { yPercent: 100 });
  }, []);

  usePageReveal(() => {
    const reduced = prefersReducedMotion();
    const split = SplitText.create(heading.current, { type: "lines", mask: "lines", aria: "none" });
    const rise = header.current?.querySelectorAll(".about-rise") ?? [];
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
      tl.add(clipRise(media.current, media.current?.firstElementChild ?? null, reduced).play(), reduced ? 0 : 0.2);
    });
    return () => {
      ctx.revert();
      split.revert();
    };
  });

  return (
    <main id="main" tabIndex={-1} className="pt-[140px] pb-[16vh] md:pt-[160px]">
      <div className="grid-12 gap-y-12">
        <div className="col-span-12 md:col-span-5">
          <div ref={media} className="gallery-media relative aspect-[4/5] overflow-hidden bg-loader-grey md:aspect-[2/3]">
            <div className="absolute inset-0">
              <Image
                src={ABOUT.photo.src}
                alt={ABOUT.photo.alt}
                fill
                priority
                sizes="(max-width: 767px) 100vw, 40vw"
                className="object-cover object-[50%_22%]"
              />
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 md:col-start-7 md:pt-[6vh]">
          <div ref={header}>
            <p className="ui-label mask mb-6">
              <span className="about-rise block">About</span>
            </p>
            <h1 ref={heading} className="headline">
              {ABOUT.name}
            </h1>
            <p className="body-copy mask mt-6 text-stone">
              <span className="about-rise block">{ABOUT.intro}</span>
            </p>
          </div>

          <div className="mt-[8vh] flex max-w-[52ch] flex-col gap-6">
            {ABOUT.body.map((para, i) => (
              <p key={i} className={i === 0 ? "font-display text-[24px] leading-[1.3] md:text-[28px]" : "body-copy"} data-reveal="lines">
                {para}
              </p>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            <span className="mask">
              <a
                href={ABOUT.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link ui-label relative inline-block"
                data-reveal="block"
              >
                See more of my work →<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </span>
            <span className="mask">
              <Link href="/#contact" className="nav-link ui-label relative inline-block" data-reveal="block">
                Get in touch →
              </Link>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
