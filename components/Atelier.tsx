"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, countUp } from "@/lib/motion";
import { clipRise, riseLinesOnScroll } from "@/lib/reveal";
import { ATELIER_PHOTO, ATELIER_TEXT, STATS } from "@/lib/atelier";
import EditorialImage from "./EditorialImage";
import PatternDrawing from "./PatternDrawing";

/* ──────────────────────────────────────────────────────────────
   (08) Atelier — on ivory.
   Left: a portrait of hands sewing, revealed with the clip-path rise.
   Right: the text rises line by line; a sleeve pattern draws itself
   as you scroll. Below: three stats that count up on the house count
   curve (the preloader's fast-then-slow rhythm) when they come into view.
   ────────────────────────────────────────────────────────────── */

const format = (n: number) => Math.round(n).toLocaleString("en-GB");

export default function Atelier() {
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLParagraphElement>(null);
  const stats = useRef<HTMLDListElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ reduced: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const { reduced } = context.conditions as { reduced: boolean };

      const reveal = clipRise(media.current, photo.current, reduced);
      ScrollTrigger.create({ trigger: media.current, start: "top 80%", once: true, onEnter: () => reveal.play() });

      const split = riseLinesOnScroll(text.current, reduced, "top 80%");

      // Stats count up once, as the row comes into view.
      const numbers = gsap.utils.toArray<HTMLElement>(".stat-number[data-value]", stats.current);
      ScrollTrigger.create({
        trigger: stats.current,
        start: "top 85%",
        once: true,
        onEnter: () =>
          numbers.forEach((el, i) => {
            const target = Number(el.dataset.value);
            if (reduced) {
              el.textContent = format(target);
              gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
              return;
            }
            countUp(target, (v) => (el.textContent = format(v))).delay(i * 0.12);
          }),
      });

      return () => split.revert();
    }, section);
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="atelier" aria-labelledby="atelier-label" className="relative bg-ivory py-[16vh]">
      <div className="grid-12 gap-y-16">
        <div className="col-span-12 md:col-span-5">
          <div ref={media} className="atelier-media relative aspect-[4/5] overflow-hidden bg-loader-grey">
            <div ref={photo} className="absolute inset-0">
              <EditorialImage src={ATELIER_PHOTO.src} alt={ATELIER_PHOTO.alt} sizes="(max-width: 767px) 100vw, 42vw" />
            </div>
          </div>
        </div>

        <div className="col-span-12 flex flex-col justify-between gap-16 md:col-span-6 md:col-start-7">
          <div>
            <p id="atelier-label" className="ui-label mb-10" data-reveal="lines">
              (08) — Atelier
            </p>
            <p ref={text} className="max-w-[24ch] font-display text-[28px] leading-[1.15] tracking-[-0.01em] md:text-[40px]">
              {ATELIER_TEXT}
            </p>
          </div>
          <PatternDrawing className="self-end" />
        </div>
      </div>

      {/* Stats */}
      <dl ref={stats} className="grid-12 mt-[14vh] gap-y-10">
        {STATS.map((stat) => (
          <div key={stat.label} className="col-span-12 flex flex-col border-t border-hairline pt-5 md:col-span-4">
            <dt className="ui-label mask order-2 mt-3 text-stone">
              <span className="block" data-reveal="block">
                {stat.label}
              </span>
            </dt>
            <dd
              className="stat-number order-1 font-display text-[64px] leading-none tracking-[-0.02em] tabular-nums md:text-[96px]"
              data-value={stat.value ?? undefined}
            >
              {stat.value === null ? "[X]" : "0"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
