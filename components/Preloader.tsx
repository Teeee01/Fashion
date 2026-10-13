"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";
import { waitForAssets } from "@/lib/loading";
import { hasSeenIntro, markIntroSeen, setIntro, useIntro, type IntroMode } from "@/lib/intro";
import { useLenis } from "./SmoothScroll";

/**
 * The counter's path to 98%: fast at first, a hold at 23, a jump to 67,
 * a creep to 90, then a slow crawl to 98 (≈1.6s). The last 98 → 100
 * only plays once every asset is ready, making ≈1.8s in total.
 */
const COUNT_STEPS: { to: number; duration: number; ease: string }[] = [
  { to: 23, duration: 0.3, ease: "power2.out" },
  { to: 23, duration: 0.22, ease: "none" }, // hold
  { to: 67, duration: 0.18, ease: "power3.out" }, // jump
  { to: 90, duration: 0.5, ease: "sine.out" }, // creep
  { to: 98, duration: 0.4, ease: "power2.out" },
];

const HOLD_AT_100 = 0.25;
const EMPTY_PAUSE = 0.35;

/** Temporary exit until the page reveal is built: the grey overlay fades away. */
const EXIT_DURATION: Record<IntroMode, number> = { full: 1.0, quick: 0.6, reduced: DURATION.reduced };

export default function Preloader() {
  const overlay = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(true);
  const { phase } = useIntro();
  const lenis = useLenis();

  // Lock scrolling while the preloader is on screen.
  useEffect(() => {
    if (!lenis) return;
    if (phase === "loading") {
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.stop();
    } else {
      lenis.start();
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

    const exit = async () => {
      if (cancelled) return;
      markIntroSeen();
      setIntro({ phase: "revealing" });
      document.documentElement.classList.remove("is-preloading");
      await play(
        gsap.to(overlay.current, {
          autoAlpha: 0,
          duration: EXIT_DURATION[mode],
          ease: mode === "reduced" ? "none" : EASE.text,
        }),
      );
      if (cancelled) return;
      setIntro({ phase: "done" });
      setMounted(false);
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
        toNinetyEight.to(value, { n: step.to, duration: step.duration, ease: step.ease });
      }
      await Promise.all([play(toNinetyEight), waitForAssets()]);
      if (cancelled) return;

      const finish = gsap
        .timeline()
        .to(value, { n: 100, duration: 0.2, ease: "power2.out", onUpdate: render })
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
    </div>
  );
}
