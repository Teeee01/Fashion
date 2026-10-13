"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { getIntro, requestSettle } from "@/lib/intro";
import { SCROLL_MEMORY_KEY } from "@/lib/intro-key";

/** Anchor targets land this far below the top, clear of the nav (20px + 32px logo + 20px). */
export const NAV_OFFSET = 72;

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
      wheelMultiplier: 0.9,
      smoothWheel: !reduced,
    });

    instance.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    setLenis(instance);

    // Same-page anchor links (e.g. "/#atelier") scroll smoothly with Lenis,
    // landing just below the nav. Caught before Next.js's own link handling,
    // which would otherwise jump straight there.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.classList.contains("skip-link")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;

      const target = url.hash ? document.querySelector<HTMLElement>(decodeURIComponent(url.hash)) : null;
      if (url.hash && !target) return; // no such section on this page: let the browser handle it
      e.preventDefault();
      e.stopPropagation();
      // While the hero is holding, settle it first; it then scrolls to the target.
      const phase = getIntro().phase;
      if (phase === "done") {
        requestSettle(target);
        if (url.hash) history.pushState(null, "", url.hash);
        return;
      }
      // While the intro has scrolling locked, links don't move the page.
      if (phase !== "settled") return;
      instance.scrollTo(target ?? 0, { offset: target ? -NAV_OFFSET : 0 });
      history.pushState(null, "", url.hash || url.pathname);
    };
    document.addEventListener("click", onClick, { capture: true });

    // Remember where we were, so a refresh mid-page comes back to it.
    const remember = () => {
      try {
        sessionStorage.setItem(SCROLL_MEMORY_KEY + location.pathname, String(Math.round(instance.scroll)));
      } catch {
        // Storage blocked: a refresh simply starts at the top.
      }
    };
    window.addEventListener("pagehide", remember);

    return () => {
      window.removeEventListener("pagehide", remember);
      document.removeEventListener("click", onClick, { capture: true });
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
