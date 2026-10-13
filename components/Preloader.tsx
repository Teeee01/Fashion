"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { COUNT_FINAL_STEP, COUNT_STEPS, EASE, prefersReducedMotion } from "@/lib/motion";
import { waitForAssets } from "@/lib/loading";
import {
  buildIntroTimeline,
  hasSeenIntro,
  markIntroSeen,
  setIntro,
  useIntro,
  type IntroMode,
} from "@/lib/intro";
import { useLenis } from "./SmoothScroll";
import StairReveal, { type StairPlayOptions, type StairRevealHandle } from "./StairReveal";

/* The counter follows the house count curve (lib/motion COUNT_STEPS):
   fast at first, a hold at 23, a jump to 67, a creep to 90, then a slow
   crawl to 98 (≈1.6s). The last 98 → 100 only plays once every asset is
   ready, making ≈1.8s in total. */

const HOLD_AT_100 = 0.25;
const EMPTY_PAUSE = 0.35;

/**
 * Column timing per mode. Full: 0.9s per column, 0.06s apart (≈1.2s).
 * Quick (returning visit): squeezed into 0.6s in total.
 * Reduced motion: StairReveal swaps the columns for a 0.3s fade on its own.
 */
const STAIR_TIMING: Record<IntroMode, StairPlayOptions> = {
  full: { duration: 0.9, stagger: 0.06 },
  quick: { duration: 0.45, stagger: 0.03 },
  reduced: {},
};

/**
 * When the page entrance (hero) starts, measured from the first column moving.
 * Full: 0.4s into the staircase. Quick: the entrance plays at double speed, so
 * everything lands in step with the 0.6s staircase. Reduced: after the fade.
 */
const ENTRANCE_AT: Record<IntroMode, number | "after"> = { full: 0.4, quick: 0.2, reduced: "after" };
const ENTRANCE_SPEED: Record<IntroMode, number> = { full: 1, quick: 2, reduced: 1 };

export default function Preloader() {
  const overlay = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const stair = useRef<StairRevealHandle>(null);
  const [mounted, setMounted] = useState(true);
  const { phase } = useIntro();
  const lenis = useLenis();

  // Scrolling stays locked through the preloader, the entrance and the
  // hero's settle sequence; it unlocks once the page has settled.
  useEffect(() => {
    if (!lenis) return;
    if (phase === "settled") {
      lenis.start();
    } else {
      if (phase === "loading") lenis.scrollTo(0, { immediate: true, force: true });
      lenis.stop();
    }
  }, [lenis, phase]);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const mode: IntroMode = prefersReducedMotion() ? "reduced" : hasSeenIntro() ? "quick" : "full";
    setIntro({ phase: "loading", mode });

    let cancelled = false;
    const tweens: gsap.core.Animation[] = [];
    const play = (anim: gsap.core.Animation) => {
      tweens.push(anim);
      return new Promise<void>((resolve) => anim.eventCallback("onComplete", () => resolve()));
    };

    const value = { n: 0 };
    const render = () => {
      if (counter.current) counter.current.textContent = `${Math.round(value.n)}%`;
    };

    // One timeline for the whole intro: white columns rise over the grey,
    // the page entrance starts while they're still rising, and the moment
    // the last column is full the overlay and columns are removed together,
    // leaving the page white underneath.
    const exit = async () => {
      if (cancelled) return;
      const master = gsap.timeline();
      const columns = stair.current?.build("cover", STAIR_TIMING[mode]);
      if (columns) master.add(columns, 0);
      const columnsDone = master.duration();

      master.call(
        () => {
          markIntroSeen();
          const html = document.documentElement;
          html.classList.add("is-intro-white");
          html.classList.remove("is-preloading");
          setMounted(false);
          setIntro({ phase: "revealing" });
        },
        undefined,
        columnsDone,
      );

      const entrance = buildIntroTimeline(mode);
      if (entrance) {
        entrance.timeScale(ENTRANCE_SPEED[mode]);
        const at = ENTRANCE_AT[mode];
        master.add(entrance, at === "after" ? columnsDone : at);
      }

      await play(master);
      if (cancelled) return;
      // A page with an entrance settles itself afterwards; otherwise we're done.
      setIntro({ phase: entrance ? "done" : "settled" });
    };

    (async () => {
      if (mode !== "full") {
        // Returning visit or reduced motion: no count, just wait for assets.
        await waitForAssets();
        await exit();
        return;
      }

      // Count to 98 and wait for real loading, whichever takes longer.
      const toNinetyEight = gsap.timeline({ onUpdate: render });
      for (const step of COUNT_STEPS) {
        toNinetyEight.to(value, { n: step.to * 100, duration: step.duration, ease: step.ease });
      }
      await Promise.all([play(toNinetyEight), waitForAssets()]);
      if (cancelled) return;

      const finish = gsap
        .timeline()
        .to(value, { n: 100, duration: COUNT_FINAL_STEP.duration, ease: COUNT_FINAL_STEP.ease, onUpdate: render })
        .to(counter.current, { opacity: 0, y: -6, duration: 0.4, ease: EASE.text }, `+=${HOLD_AT_100}`)
        .to({}, { duration: EMPTY_PAUSE }); // the empty grey screen — keep it
      await play(finish);
      await exit();
    })();

    return () => {
      cancelled = true;
      tweens.forEach((t) => t.kill());
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={overlay}
      aria-hidden="true"
      className="preloader fixed inset-0 z-[1000] bg-loader-grey"
    >
      <span
        ref={counter}
        className="preloader-count absolute left-[12vw] top-[55vh] font-sans text-[12px] leading-none text-loader-ink tabular-nums"
      >
        0%
      </span>
      <StairReveal ref={stair} direction="up" columns={6} mobileColumns={4} color="var(--white)" />
    </div>
  );
}
