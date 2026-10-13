"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Flip, gsap } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import {
  getIntro,
  isSettledLayout,
  registerIntroTimeline,
  setIntro,
  useIntro,
  type IntroMode,
} from "@/lib/intro";
import { ribbonState } from "@/lib/ribbon-state";
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

/* Settle sequence, after the entrance and a hold. Seconds from its start:
   captions out 0 · monogram glides to the nav 0.1 · links cluster 0.15
   (staggered) · ribbon drifts 0.2 · frosted band 0.3 → ≈1.1s. */
const HOLD: Record<IntroMode, number> = { full: 0.8, quick: 0.4, reduced: 0.8 };
const SETTLE_SPEED: Record<IntroMode, number> = { full: 1, quick: 2, reduced: 1 };

/** Only the nav items showing at this screen size (links on desktop, MENU on mobile). */
const visible = (selector: string) =>
  gsap.utils.toArray<HTMLElement>(selector).filter((el) => el.getClientRects().length > 0);

const LEFT_LINES = ["Garments shaped slowly,", "worn for years."];
const RIGHT_LINES = ["Discover the new collection, designed to feel", "like a second skin."];

export default function Hero() {
  const monogram = useRef<SVGSVGElement>(null);
  const ribbon = useRef<HTMLDivElement>(null);
  const captions = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const build = (mode: IntroMode) => {
      const links = visible("header.nav .nav-item");
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

    // Coming back to the home page after the intro has already played
    // (e.g. from a collection page): show the hero in its settled state.
    if (getIntro().phase === "settled") {
      ribbonState.contrast = 1;
      gsap.set(ribbon.current, { autoAlpha: 1, x: window.innerWidth * 0.04, y: window.innerHeight * 0.06 });
      gsap.set(captions.current, { autoAlpha: 0 });
    }

    return registerIntroTimeline(build);
  }, []);

  // After the entrance: hold, then settle into the browsing layout.
  const { phase } = useIntro();
  const settleScheduled = useRef(false);
  const settleAnims = useRef<gsap.core.Animation[]>([]);

  useEffect(() => {
    if (phase !== "done" || settleScheduled.current) return;
    settleScheduled.current = true;
    const { mode } = getIntro();

    const settle = () => {
      const links = visible("header.nav .nav-link.nav-item");
      const logo = document.querySelector<SVGSVGElement>(".nav-logo svg");
      const band = document.querySelector<HTMLElement>(".nav-band");
      const done = () => setIntro({ phase: "settled" });

      // Record where everything is now, switch the nav to its settled
      // layout (logo shown, links clustered), then Flip glides from old to new.
      const monogramState = Flip.getState(monogram.current);
      const linkState = Flip.getState(links);
      flushSync(() => setIntro({ phase: "settling" }));

      const tl = gsap.timeline({ onComplete: done });
      settleAnims.current.push(tl);

      if (mode === "reduced") {
        // Reduced motion: cross-fade into the settled layout, 0.3s in total.
        const half = DURATION.reduced / 2;
        return tl
          .to([captions.current, monogram.current], { autoAlpha: 0, duration: half, ease: "none" }, 0)
          .fromTo([logo, ...links, band, ...visible("header.nav .nav-bag")], { autoAlpha: 0 }, { autoAlpha: 1, duration: half, ease: "none" }, half);
      }

      tl.timeScale(SETTLE_SPEED[mode]);

      // 1 · Captions lift away.
      tl.to(captions.current, { opacity: 0, y: -8, duration: 0.4, ease: EASE.text }, 0);

      // 2 · The monogram shrinks and glides into the nav: it is the logo now.
      if (logo) {
        tl.add(Flip.from(monogramState, { targets: logo, scale: true, duration: 0.9, ease: EASE.big }), 0.1);
      }

      // 3 · Links slide from the spread layout into the right-hand cluster.
      if (links.length) {
        tl.add(Flip.from(linkState, { duration: 0.55, ease: EASE.big, stagger: STAGGER.nav }), 0.15);
      }

      // 5 · The ribbon drifts down and right (it keeps rotating).
      tl.to(
        ribbon.current,
        { x: window.innerWidth * 0.04, y: window.innerHeight * 0.06, duration: 0.9, ease: EASE.big },
        0.2,
      );

      // 4 · The frosted band fades in behind the nav, and the bag joins the links.
      tl.fromTo(band, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: EASE.text }, 0.3);
      tl.fromTo(visible("header.nav .nav-bag"), { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.ui, ease: EASE.text }, 0.6);

      // 6 · Scrolling unlocks when the timeline completes (phase "settled").
      return tl;
    };

    settleAnims.current.push(gsap.delayedCall(HOLD[mode], settle));
  }, [phase]);

  useEffect(() => () => settleAnims.current.forEach((a) => a.kill()), []);

  const monogramHidden = isSettledLayout(phase);

  return (
    <section className="hero relative h-svh overflow-hidden" aria-label="Maison Sève">

      {/* Fixed, so the ribbon stays on screen through the manifesto below.
          20% taller than the screen (10vh spare above and below) so it still
          runs off both edges after it drifts down. */}
      <RibbonStage ref={ribbon} className="fixed inset-x-0 -top-[10svh] h-[120svh]" />

      <Monogram
        ref={monogram}
        flipId="monogram"
        className={`hero-fg absolute left-[13vw] top-1/2 h-[22vh] w-auto -translate-y-1/2 ${
          monogramHidden ? "invisible" : ""
        }`}
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
