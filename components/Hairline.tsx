"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";

/**
 * The site's section divider: a 1px hairline across the full content width
 * that draws itself left → right as it scrolls into view.
 */
export default function Hairline({ className = "" }: { className?: string }) {
  const line = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const tween = gsap.fromTo(
      line.current,
      reduced ? { scaleX: 1, autoAlpha: 0 } : { scaleX: 0 },
      {
        ...(reduced ? { autoAlpha: 1, duration: DURATION.reduced, ease: "none" } : { scaleX: 1, duration: 1.2, ease: EASE.big }),
        scrollTrigger: { trigger: line.current, start: "top 92%", once: true },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div className={`relative px-pad ${className}`} role="separator">
      <div ref={line} className="hairline-draw h-px origin-left bg-hairline" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
