"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE } from "@/lib/motion";
import EditorialImage from "./EditorialImage";

/* ──────────────────────────────────────────────────────────────
   (04) The Signature Coat — pinned for 200vh of scroll.
   Starts with a small centred image (20vw) between a huge split
   headline: THE · COAT. Scrubbed by scroll:
     0    → 0.6   the image opens out to fill the screen; the words
                  slide apart and off both edges
     0.6  → 0.92  three detail callouts arrive one after another: a
                  point on the garment, a 1px line that draws itself,
                  then the label rising from its mask
     0.92 → 1     hold
   ────────────────────────────────────────────────────────────── */

const COAT = {
  src: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&crop=center&ar=16:9",
  alt: "The signature coat",
};

/**
 * Points on the garment and where each label sits, in % of the screen.
 * Phones get their own positions so every label stays on screen.
 *   left / right             → label beside the line's end
 *   above-left / above-right → label sits on top of the line's end
 *   below-left               → label hangs under the line's end
 */
type Side = "left" | "right" | "above-left" | "above-right" | "below-left";
type Placement = { point: readonly [number, number]; end: readonly [number, number]; side: Side };
const CALLOUTS: { label: string; desktop: Placement; mobile: Placement }[] = [
  {
    label: "Hand-rolled lapel",
    desktop: { point: [46, 30], end: [24, 20], side: "left" },
    mobile: { point: [46, 32], end: [6, 24], side: "above-left" },
  },
  {
    label: "Double-faced wool",
    desktop: { point: [58, 52], end: [80, 42], side: "right" },
    mobile: { point: [58, 50], end: [94, 42], side: "above-right" },
  },
  {
    label: "Horn buttons",
    desktop: { point: [50, 64], end: [26, 76], side: "left" },
    mobile: { point: [50, 62], end: [6, 72], side: "below-left" },
  },
];

const LABEL_POSITION: Record<Side, string> = {
  left: "-translate-x-full -translate-y-1/2 pr-2 text-right",
  right: "-translate-y-1/2 pl-2",
  "above-left": "-translate-y-full pb-1.5",
  "above-right": "-translate-x-full -translate-y-full pb-1.5 text-right",
  "below-left": "pt-1.5",
};

function CalloutSet({ layout, className }: { layout: "desktop" | "mobile"; className: string }) {
  return (
    <div className={`coat-callouts absolute inset-0 ${className}`} data-layout={layout}>
      {/* Lines in screen percentages (no viewBox), so 1px stays 1px and
          pathLength="1" lets each one draw on with a 1 → 0 dash offset. */}
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {CALLOUTS.map((c) => {
          const { point, end } = c[layout];
          return (
            <line
              key={c.label}
              className="coat-line"
              x1={`${point[0]}%`}
              y1={`${point[1]}%`}
              x2={`${end[0]}%`}
              y2={`${end[1]}%`}
              pathLength={1}
              stroke="currentColor"
              strokeWidth={1}
            />
          );
        })}
      </svg>
      <ul>
        {CALLOUTS.map((c, i) => {
          const { point, end, side } = c[layout];
          return (
            <li key={c.label}>
              <span
                className="coat-point absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 bg-current"
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
              />
              {/* Spacing sits outside the mask, so the hidden text can't peek through it. */}
              <span
                className={`ui-label absolute whitespace-nowrap ${LABEL_POSITION[side]}`}
                style={{ left: `${end[0]}%`, top: `${end[1]}%` }}
              >
                <span className="mask">
                  <span className="coat-label-text block">
                    ({["i", "ii", "iii"][i]}) {c.label}
                  </span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Small image width as a fraction of the screen width (wider on phones). */
const START_WIDTH = { desktop: 0.2, mobile: 0.28 };

export default function SignatureCoat() {
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLSpanElement>(null);
  const right = useRef<HTMLSpanElement>(null);
  const kicker = useRef<HTMLParagraphElement>(null);
  const callouts = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        full: "(prefers-reduced-motion: no-preference)",
        // Listed so the timeline rebuilds when crossing between phone and desktop.
        desktop: "(min-width: 768px)",
      },
      (context) => {
        const { reduced } = context.conditions as { reduced: boolean };
        // Animate whichever callout layout (desktop or phone) is showing.
        const set = (window.innerWidth < 768 ? "mobile" : "desktop") as "mobile" | "desktop";
        const scope = callouts.current?.querySelector(`[data-layout="${set}"]`);
        const points = gsap.utils.toArray<HTMLElement>(".coat-point", scope);
        const lines = gsap.utils.toArray<SVGLineElement>(".coat-line", scope);
        const labels = gsap.utils.toArray<HTMLElement>(".coat-label-text", scope);

        if (reduced) {
          // Reduced motion: the coat is simply shown full screen; the callouts
          // fade in once (0.3s) as the stage arrives.
          gsap.set(media.current, { clipPath: "inset(0px 0px 0px 0px)" });
          gsap.set([left.current, right.current, kicker.current], { autoAlpha: 0 });
          gsap.set(lines, { strokeDashoffset: 0 });
          gsap.set(labels, { y: 0, yPercent: 0 });
          gsap.fromTo(
            callouts.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: DURATION.reduced, ease: "none", scrollTrigger: { trigger: section.current, start: "top top", once: true } },
          );
          return;
        }

        // The small centred frame, measured fresh on every refresh/resize.
        const frame = () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const w = vw * (vw < 768 ? START_WIDTH.mobile : START_WIDTH.desktop);
          const h = (w * 4) / 3;
          const y = Math.max((vh - h) / 2, 0);
          const x = (vw - w) / 2;
          return `inset(${y}px ${x}px ${y}px ${x}px)`;
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.set({}, {}, 1); // pad to exactly 1 so positions read as scroll fractions

        // 1 · Image opens out to full screen; the photo settles as it grows.
        tl.fromTo(media.current, { clipPath: frame }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.6, ease: EASE.big }, 0)
          .fromTo(photo.current, { scale: 1.25 }, { scale: 1, duration: 0.6, ease: EASE.big }, 0);

        // 2 · The words slide apart and off-screen.
        tl.fromTo(
          left.current,
          { x: 0 },
          { x: () => -((left.current?.getBoundingClientRect().right ?? 0) + 40), duration: 0.5, ease: EASE.big },
          0,
        )
          .fromTo(
            right.current,
            { x: 0 },
            { x: () => window.innerWidth - (right.current?.getBoundingClientRect().left ?? 0) + 40, duration: 0.5, ease: EASE.big },
            0,
          )
          .to(kicker.current, { autoAlpha: 0, duration: 0.15 }, 0);

        // 3 · Callouts, one after another: point → line draws → label rises.
        CALLOUTS.forEach((_, i) => {
          const at = 0.6 + i * 0.11;
          tl.fromTo(points[i], { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.03 }, at)
            .fromTo(lines[i], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.08, autoRound: false }, at + 0.02)
            .fromTo(labels[i], { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.06, ease: EASE.text }, at + 0.08);
        });
      },
      section,
    );

    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="signature" aria-labelledby="signature-title" className="relative h-[300svh]">
      <h2 id="signature-title" className="sr-only">
        The signature coat
      </h2>
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* The coat: full-screen photo, framed down to a small centred window to start. */}
        <div ref={media} className="coat-media absolute inset-0" data-cursor="view">
          <div ref={photo} className="absolute inset-0">
            <EditorialImage src={COAT.src} alt={COAT.alt} sizes="100vw" fallback="dark" />
          </div>
        </div>

        {/* Split headline: THE ← image → COAT */}
        <div aria-hidden="true" className="coat-words pointer-events-none absolute inset-0 font-display uppercase leading-none">
          <span ref={left} className="coat-word coat-word-left absolute top-1/2">
            The
          </span>
          <span ref={right} className="coat-word coat-word-right absolute top-1/2">
            Coat
          </span>
        </div>

        <p ref={kicker} className="ui-label absolute left-pad top-[112px]">
          (04) — The Signature Coat
        </p>

        {/* Detail callouts (one layout for desktop, one for phones) */}
        <div ref={callouts} className="pointer-events-none absolute inset-0 text-ivory">
          <CalloutSet layout="desktop" className="hidden md:block" />
          <CalloutSet layout="mobile" className="md:hidden" />
        </div>
      </div>
    </section>
  );
}
