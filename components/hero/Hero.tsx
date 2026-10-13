"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { registerIntroTimeline, type IntroMode } from "@/lib/intro";
import { ribbonState } from "@/lib/ribbon-state";
import Nav from "@/components/Nav";
import Monogram from "./Monogram";
import RibbonStage from "./RibbonStage";

/* Entrance timing, in seconds from the hero's own start (which is 0.4s
   into the staircase). Real times from the start of the reveal are +0.4:
   nav 0.4 · monogram draws 0.6 · captions 0.75 · ribbon + warm background
   1.2 (as the overlay leaves) · monogram fills 1.9 → done ≈ 2.4s. */
const AT = {
  nav: 0,
  draw: 0.2,
  captions: 0.35,
  ribbon: 0.8,
  fill: 1.5,
};

const LEFT_LINES = ["Garments shaped slowly,", "worn for years."];
const RIGHT_LINES = ["Discover the new collection, designed to feel", "like a second skin."];

export default function Hero() {
  const nav = useRef<HTMLElement>(null);
  const monogram = useRef<SVGSVGElement>(null);
  const ribbon = useRef<HTMLDivElement>(null);
  const captions = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const build = (mode: IntroMode) => {
      const links = nav.current?.querySelectorAll(".nav-link") ?? [];
      const outlines = monogram.current?.querySelectorAll(".monogram-path") ?? [];
      const lines = captions.current?.querySelectorAll(".hero-line") ?? [];
      const html = document.documentElement;
      const pageBg = [html, document.body];
      const warmed = () => {
        html.classList.remove("is-intro-white");
        gsap.set(pageBg, { clearProps: "backgroundColor" });
      };

      const tl = gsap.timeline();

      if (mode === "reduced") {
        // Reduced motion: everything simply fades in together, 0.3s.
        const fade = { autoAlpha: 1, duration: DURATION.reduced, ease: "none" };
        ribbonState.contrast = 1;
        gsap.set(links, { y: 0 });
        gsap.set(lines, { y: 0, yPercent: 0 });
        gsap.set(outlines, { strokeDashoffset: 0, fill: "#0E0E0E", strokeOpacity: 0 });
        return tl
          .fromTo([...links, monogram.current, ...lines, ribbon.current], { autoAlpha: 0 }, fade, 0)
          .fromTo(pageBg, { backgroundColor: "#FFFFFF" }, { backgroundColor: "#F2F1EE", duration: DURATION.reduced, ease: "none", onComplete: warmed }, 0);
      }

      // 1 · Nav links, one by one, left to right.
      tl.fromTo(
        links,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: DURATION.ui, ease: EASE.text, stagger: STAGGER.nav },
        AT.nav,
      );

      // 2a · Monogram draws itself: 1px ink stroke, no fill.
      tl.fromTo(
        outlines,
        { strokeDashoffset: 1, fill: "rgba(14,14,14,0)", strokeOpacity: 1 },
        // autoRound off: the offset runs 1 → 0, so whole-pixel rounding would snap it.
        { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", autoRound: false },
        AT.draw,
      );

      // 3 · Caption lines rise from behind their masks.
      tl.fromTo(
        lines,
        { y: 0, yPercent: 100 },
        { yPercent: 0, duration: 0.8, ease: EASE.text, stagger: STAGGER.lines },
        AT.captions,
      );

      // 4 · Ribbon fades in, gains contrast and settles; background warms.
      tl.fromTo(
        ribbon.current,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE.text },
        AT.ribbon,
      )
        .fromTo(ribbonState, { contrast: 0 }, { contrast: 1, duration: 1.2, ease: EASE.text }, AT.ribbon)
        .fromTo(
          pageBg,
          { backgroundColor: "#FFFFFF" },
          { backgroundColor: "#F2F1EE", duration: 1.2, ease: EASE.text, onComplete: warmed },
          AT.ribbon,
        );

      // 2b · Monogram fills with ink as its outline fades away.
      tl.to(outlines, { fill: "rgba(14,14,14,1)", strokeOpacity: 0, duration: 0.5, ease: EASE.text }, AT.fill);

      return tl;
    };

    return registerIntroTimeline(build);
  }, []);

  return (
    <section className="hero relative h-svh overflow-hidden" aria-label="Maison Sève">
      <Nav ref={nav} />

      <RibbonStage ref={ribbon} className="absolute inset-0" />

      <Monogram
        ref={monogram}
        className="hero-fg absolute left-[13vw] top-1/2 h-[22vh] w-auto -translate-y-1/2"
      />

      <div
        ref={captions}
        className="hero-fg absolute inset-x-pad bottom-pad flex flex-col gap-5 text-[13px] leading-[1.45] text-ink md:flex-row md:items-end md:justify-between"
      >
        <p>
          {LEFT_LINES.map((line) => (
            <span key={line} className="mask">
              <span className="hero-line block">{line}</span>
            </span>
          ))}
        </p>
        <div className="text-right">
          <p>
            {RIGHT_LINES.map((line) => (
              <span key={line} className="mask">
                <span className="hero-line block">{line}</span>
              </span>
            ))}
          </p>
          <span className="mask mt-2">
            <span className="hero-line block">
              <Link
                href="/#collections"
                className="underline decoration-1 underline-offset-[3px] transition-colors duration-500 hover:text-stone"
              >
                View collection
              </Link>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
