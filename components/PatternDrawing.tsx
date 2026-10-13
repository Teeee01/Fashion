"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/* A sleeve pattern piece in thin ink lines: the outline (cap curve,
   underarm seams, wrist), then the grainline with its arrows, then the
   notches. It draws itself as you scroll past (scrubbed), each line in
   turn. Drawn 1:1 (viewBox = rendered size) so the stroke is a true 1px. */

const OUTLINE = "M20 112 C 52 102, 84 30, 140 20 C 196 30, 228 102, 260 112 L 222 340 L 58 340 Z";
const DETAILS = [
  "M140 70 L140 300", // grainline
  "M133 82 L140 70 L147 82", // arrow
  "M133 288 L140 300 L147 288", // arrow
  "M86 60 L79 53", // front notch
  "M193 59 L200 52", // back notches (double)
  "M201 67 L208 60",
  "M64 220 L216 220", // elbow line
];

export default function PatternDrawing({ className = "" }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const paths = svg.current?.querySelectorAll<SVGPathElement>(".pattern-line");
    if (!paths?.length) return;
    if (prefersReducedMotion()) {
      gsap.set(paths, { strokeDashoffset: 0 });
      const t = gsap.fromTo(svg.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "none", scrollTrigger: { trigger: svg.current, start: "top 85%", once: true } });
      return () => {
        t.scrollTrigger?.kill();
        t.kill();
      };
    }
    // Outline takes the first half of the scroll, the details share the rest.
    const tl = gsap.timeline({
      defaults: { ease: "none", autoRound: false },
      scrollTrigger: { trigger: svg.current, start: "top 90%", end: "bottom 65%", scrub: 0.6 },
    });
    tl.fromTo(paths[0], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5 });
    tl.fromTo(Array.from(paths).slice(1), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.12, stagger: 0.06 });
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <figure className={className}>
      <svg ref={svg} viewBox="0 0 280 360" width={280} height={360} className="h-auto max-w-full text-ink" aria-hidden="true">
        {[OUTLINE, ...DETAILS].map((d) => (
          <path key={d} d={d} className="pattern-line" pathLength={1} fill="none" stroke="currentColor" strokeWidth={1} />
        ))}
      </svg>
      <figcaption className="ui-label mt-4 text-stone">Sleeve · cut 2 · grain on fold</figcaption>
    </figure>
  );
}
