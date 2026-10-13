"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

const LenisContext = createContext<Lenis | null>(null);

/** Access the Lenis instance (e.g. `lenis?.scrollTo("#collection")`, `lenis?.stop()`). */
export function useLenis() {
  return useContext(LenisContext);
}

/**
 * Smooth scrolling for the whole site.
 * Lenis is driven by GSAP's ticker (one animation clock for everything)
 * and tells ScrollTrigger to update on every scroll frame.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    const instance = new Lenis({
      autoRaf: false,
      lerp: 0.08,
      smoothWheel: !reduced,
    });

    instance.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
