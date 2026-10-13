"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { clipRise } from "@/lib/reveal";
import { CAMPAIGN, LOOKBOOK_GRID } from "@/lib/lookbook";
import EditorialImage from "./EditorialImage";
import StairReveal, { type StairRevealHandle } from "./StairReveal";

/* ──────────────────────────────────────────────────────────────
   (03) Lookbook
   A full-bleed campaign photo hidden behind six ivory columns. When the
   section reaches 60% of the viewport the columns retract upward as a
   staircase (the page-load reveal, in reverse direction), then the
   caption rises. The photo drifts with slow parallax while in view.
   Below, an asymmetric grid of five images, each revealed with the
   clip-path rise and drifting at its own speed for depth.
   ────────────────────────────────────────────────────────────── */

/** How far the grid images drift (px at speed 1) across their time on screen. */
const GRID_DRIFT = 90;

export default function Lookbook() {
  const section = useRef<HTMLElement>(null);
  const campaign = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const stair = useRef<StairRevealHandle>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add({ reduced: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const { reduced } = context.conditions as { reduced: boolean };
      const lines = caption.current?.querySelectorAll(".lookbook-line") ?? [];

      // ── Campaign: staircase uncovers, then the caption rises ──
      ScrollTrigger.create({
        trigger: campaign.current,
        start: "top 60%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          const columns = stair.current?.build("uncover", { duration: 0.9, stagger: STAGGER.columns });
          if (columns) tl.add(columns, 0);
          if (reduced) {
            tl.fromTo(lines, { y: 0, yPercent: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" }, ">");
          } else {
            // Starts as the last columns clear the bottom-left corner.
            tl.fromTo(
              lines,
              { y: 0, yPercent: 100 },
              { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines },
              0.6,
            );
          }
        },
      });

      if (!reduced) {
        // Slow parallax while the campaign is on screen.
        gsap.fromTo(
          photo.current,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: { trigger: campaign.current, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }

      // ── Editorial grid ──
      gsap.utils.toArray<HTMLElement>(".lookbook-item", grid.current).forEach((item) => {
        const reveal = clipRise(item.querySelector(".lookbook-media"), item.querySelector(".lookbook-photo"), reduced);
        ScrollTrigger.create({ trigger: item, start: "top 85%", once: true, onEnter: () => reveal.play() });

        if (!reduced) {
          const speed = Number(item.dataset.speed ?? 1);
          gsap.fromTo(
            item,
            { y: GRID_DRIFT * speed },
            {
              y: -GRID_DRIFT * speed,
              ease: "none",
              scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });
    }, section);

    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="lookbook" aria-labelledby="lookbook-title" className="lookbook relative">
      {/* Full-bleed campaign */}
      <div ref={campaign} className="relative h-svh overflow-hidden">
        {/* The whole image opens this look's page. */}
        <Link
          href={`/look/${CAMPAIGN.number}`}
          className="absolute inset-0 z-[1]"
          data-cursor="view"
          data-transition-label={`Look ${CAMPAIGN.number}`}
          aria-label={`Look ${CAMPAIGN.number}: ${CAMPAIGN.title}. Shop the pieces`}
        />
        {/* 120% tall and shifted up 10%, so ±8% parallax never shows an edge. */}
        <div ref={photo} className="absolute inset-x-0 -top-[10%] h-[120%]">
          <EditorialImage src={CAMPAIGN.src} alt={CAMPAIGN.alt} sizes="100vw" fallback="dark" />
        </div>

        <StairReveal ref={stair} direction="up" initial="covered" columns={6} mobileColumns={4} color="var(--ivory)" />

        <div ref={caption} className="absolute bottom-pad left-pad text-ivory">
          <p className="ui-label mask">
            <span className="lookbook-line block">Lookbook · AW26</span>
          </p>
          <h2 id="lookbook-title" className="headline mask mt-3 pb-[0.06em] italic">
            <span className="lookbook-line block">Room to breathe.</span>
          </h2>
        </div>
      </div>

      {/* Asymmetric editorial grid */}
      <div ref={grid} className="grid-12 items-start pb-[24vh] pt-[16vh]">
        {LOOKBOOK_GRID.map((img) => (
          <figure key={img.src} className={`lookbook-item ${img.place}`} data-speed={img.speed}>
            <Link href={`/look/${img.number}`} className="block" data-cursor="view" data-transition-label={`Look ${img.number}`}>
              <div className={`lookbook-media relative overflow-hidden bg-loader-grey ${img.aspect}`}>
                <div className="lookbook-photo absolute inset-0">
                  <EditorialImage src={img.src} alt={`${img.alt}. Look ${img.number}: shop the pieces`} sizes="(max-width: 767px) 70vw, 50vw" />
                </div>
              </div>
            </Link>
          </figure>
        ))}
      </div>
    </section>
  );
}
