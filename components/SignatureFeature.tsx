"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE } from "@/lib/motion";
import { getProduct } from "@/lib/products";
import type { Callout, Frame, Side, Signature } from "@/lib/signatures";
import EditorialImage from "./EditorialImage";

/* ──────────────────────────────────────────────────────────────
   One piece of the signature series (data: lib/signatures.ts).
   Pinned while 200vh of scroll passes. Starts with a small centred
   image between two huge words (THE · COAT). Scrubbed by scroll:
     0    → 0.6   the image opens out to fill the screen; the words
                  slide apart and off the edges
     0.6  → 0.92  the detail callouts arrive one after another: a point
                  on the garment, a 1px line that draws itself, then
                  the label rising from its mask
     0.92 → 1     "Shop the …" rises; hold
   The full-screen image links to the product (VIEW cursor).

   The starting frame depends on the piece: a small upright frame, a
   tall narrow slit (the pants) or a low wide band (the shoe; its words
   sit above and below instead of either side).

   With `angles` (the cap), the section stays pinned for longer and
   scrolling turns the piece: each angle crossfades into the next, holds
   while it eases 1 → 1.03 and drifts a few px in the turn's direction,
   with its own callout and a FRONT · SIDE · BACK · SIDE indicator.
   Scrolling back plays it all in reverse.
   ────────────────────────────────────────────────────────────── */

/** Scroll per unit of timeline: 1 unit = 200vh. */
const UNIT_VH = 200;
/** Extra pinned scroll per extra angle (≈250vh for four angles). */
const PER_ANGLE = 1.25 / 3;
/** How far each angle drifts while it holds, in px (the direction of the turn). */
const DRIFT = -10;

const LABEL_POSITION: Record<Side, string> = {
  left: "-translate-x-full -translate-y-1/2 pr-2 text-right",
  right: "-translate-y-1/2 pl-2",
  "above-left": "-translate-y-full pb-1.5",
  "above-right": "-translate-x-full -translate-y-full pb-1.5 text-right",
  "below-left": "pt-1.5",
};

const NUMERALS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];

/* The small frame each piece starts from, and the half-size the words keep clear of. */
const FRAMES: Record<Frame, { size: (vw: number, vh: number, mobile: boolean) => [number, number]; half: { desktop: string; mobile: string } }> = {
  portrait: {
    size: (vw, _vh, m) => {
      const w = vw * (m ? 0.28 : 0.2);
      return [w, (w * 4) / 3];
    },
    half: { desktop: "10vw", mobile: "14vw" },
  },
  slit: {
    size: (vw, vh, m) => [vw * (m ? 0.1 : 0.06), vh * 0.7],
    half: { desktop: "3vw", mobile: "5vw" },
  },
  band: {
    size: (vw, vh, m) => [vw * (m ? 0.84 : 0.6), vh * (m ? 0.12 : 0.14)],
    half: { desktop: "7vh", mobile: "6vh" },
  },
};

function CalloutSet({ callouts, layout, className }: { callouts: Callout[]; layout: "desktop" | "mobile"; className: string }) {
  return (
    <div className={`absolute inset-0 ${className}`} data-layout={layout}>
      {/* Lines in screen percentages (no viewBox), so 1px stays 1px and
          pathLength="1" lets each one draw on with a 1 → 0 dash offset. */}
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {callouts.map((c) => {
          const { point, end } = c[layout];
          return (
            <line
              key={c.label}
              className="sig-line"
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
        {callouts.map((c, i) => {
          const { point, end, side } = c[layout];
          return (
            <li key={c.label}>
              <span
                className="sig-point absolute h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 bg-current"
                style={{ left: `${point[0]}%`, top: `${point[1]}%` }}
              />
              {/* Spacing sits outside the mask, so the hidden text can't peek through it. */}
              <span className={`ui-label absolute whitespace-nowrap ${LABEL_POSITION[side]}`} style={{ left: `${end[0]}%`, top: `${end[1]}%` }}>
                <span className="mask">
                  <span className="sig-label-text block">
                    ({NUMERALS[i]}) {c.label}
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

export default function SignatureFeature({ signature: sig }: { signature: Signature }) {
  const section = useRef<HTMLElement>(null);
  const media = useRef<HTMLAnchorElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLSpanElement>(null);
  const right = useRef<HTMLSpanElement>(null);
  const kicker = useRef<HTMLParagraphElement>(null);
  const callouts = useRef<HTMLDivElement>(null);
  const shop = useRef<HTMLSpanElement>(null);
  const indicator = useRef<HTMLDivElement>(null);

  const angles = sig.angles ?? [];
  const turning = angles.length > 1;
  const extra = turning ? (angles.length - 1) * PER_ANGLE : 0;
  const length = 1 + extra;
  const allCallouts = angles.length ? angles.map((a) => a.callout) : sig.callouts;
  const layers = angles.length ? angles : [{ name: "", ...sig.media }];
  const vertical = sig.frame === "band";
  const product = getProduct(sig.product);
  const frame = FRAMES[sig.frame];

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
        const mobile = window.innerWidth < 768;
        // Animate whichever callout layout (desktop or phone) is showing.
        const scope = callouts.current?.querySelector(`[data-layout="${mobile ? "mobile" : "desktop"}"]`);
        const points = gsap.utils.toArray<HTMLElement>(".sig-point", scope);
        const lines = gsap.utils.toArray<SVGLineElement>(".sig-line", scope);
        const labels = gsap.utils.toArray<HTMLElement>(".sig-label-text", scope);
        const layerEls = gsap.utils.toArray<HTMLElement>(".sig-layer", media.current);
        const ticks = gsap.utils.toArray<HTMLElement>(".sig-tick", indicator.current);
        const underline = indicator.current?.querySelector<HTMLElement>(".sig-underline");

        if (reduced) {
          // Reduced motion: the piece is simply shown full screen; the callouts
          // fade in once (0.3s) as it arrives. (The cap shows a 2×2 grid instead.)
          if (turning) return;
          gsap.set(media.current, { clipPath: "inset(0px 0px 0px 0px)" });
          gsap.set([left.current, right.current], { autoAlpha: 0 });
          gsap.set(lines, { strokeDashoffset: 0 });
          gsap.set(points, { autoAlpha: 1 });
          gsap.set([...labels, shop.current], { y: 0, yPercent: 0 });
          gsap.fromTo(
            [callouts.current, shop.current],
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: DURATION.reduced, ease: "none", scrollTrigger: { trigger: section.current, start: "top 60%", once: true } },
          );
          return;
        }

        // The small centred frame, measured fresh on every refresh/resize.
        const startFrame = () => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const [w, h] = frame.size(vw, vh, vw < 768);
          const y = Math.max((vh - h) / 2, 0);
          const x = Math.max((vw - w) / 2, 0);
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
        tl.set({}, {}, length); // pad to exactly `length`, so 1 unit = 200vh of scroll

        // 1 · The image opens out to full screen; the photo settles as it grows.
        tl.fromTo(media.current, { clipPath: startFrame }, { clipPath: "inset(0px 0px 0px 0px)", duration: 0.6, ease: EASE.big }, 0).fromTo(
          photo.current,
          { scale: 1.25 },
          { scale: 1, duration: 0.6, ease: EASE.big },
          0,
        );

        // 2 · The words slide apart and off-screen (sideways, or up and down for the band).
        if (vertical) {
          tl.fromTo(left.current, { y: 0 }, { y: () => -((left.current?.getBoundingClientRect().bottom ?? 0) + 40), duration: 0.5, ease: EASE.big }, 0).fromTo(
            right.current,
            { y: 0 },
            { y: () => window.innerHeight - (right.current?.getBoundingClientRect().top ?? 0) + 40, duration: 0.5, ease: EASE.big },
            0,
          );
        } else {
          tl.fromTo(left.current, { x: 0 }, { x: () => -((left.current?.getBoundingClientRect().right ?? 0) + 40), duration: 0.5, ease: EASE.big }, 0).fromTo(
            right.current,
            { x: 0 },
            { x: () => window.innerWidth - (right.current?.getBoundingClientRect().left ?? 0) + 40, duration: 0.5, ease: EASE.big },
            0,
          );
        }
        tl.to(kicker.current, { autoAlpha: 0, duration: 0.15 }, 0);

        // A callout arrives: point → line draws → label rises. Leaving reverses it.
        const calloutIn = (i: number, at: number) =>
          tl
            .fromTo(points[i], { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.03 }, at)
            .fromTo(lines[i], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.08, autoRound: false }, at + 0.02)
            .fromTo(labels[i], { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.06, ease: EASE.text }, at + 0.08);
        const calloutOut = (i: number, at: number) =>
          tl
            .to(labels[i], { yPercent: -100, duration: 0.05, ease: EASE.text }, at)
            .to(lines[i], { strokeDashoffset: 1, duration: 0.06, autoRound: false }, at + 0.02)
            .to(points[i], { autoAlpha: 0, scale: 0, duration: 0.03 }, at + 0.06);
        const shopIn = (at: number) => tl.fromTo(shop.current, { y: 0, yPercent: 100 }, { yPercent: 0, duration: 0.06, ease: EASE.text }, at);

        if (!angles.length) {
          // 3 · Callouts one after another, then the shop link.
          allCallouts.forEach((_, i) => calloutIn(i, 0.6 + i * 0.11));
          shopIn(Math.min(0.6 + allCallouts.length * 0.11 + 0.02, 0.94));
          return;
        }

        // 3 · The cap: the first angle's callout and the indicator arrive…
        calloutIn(0, 0.62);
        if (indicator.current) tl.fromTo(indicator.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.6);
        const tickColour = (on: boolean) => getComputedStyle(document.documentElement).getPropertyValue(on ? "--ink" : "--stone").trim();
        ticks.forEach((t, i) => tl.set(t, { color: tickColour(i === 0) }, 0));
        if (underline && ticks[0]) tl.set(underline, { x: () => ticks[0].offsetLeft, width: () => ticks[0].offsetWidth }, 0);

        // …then each turn: crossfade to the next angle, move the indicator, swap the callout.
        const slot = turning ? extra / (angles.length - 1) : 0;
        const turnAt = (k: number) => 1 + (k - 1) * slot + slot * 0.3; // k = 1 … n-1
        const FADE = 0.14;
        for (let k = 1; k < angles.length; k++) {
          const at = turnAt(k);
          calloutOut(k - 1, at - 0.08);
          tl.fromTo(layerEls[k], { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE }, at);
          tl.to(ticks[k - 1], { color: tickColour(false), duration: FADE }, at).to(ticks[k], { color: tickColour(true), duration: FADE }, at);
          if (underline) tl.to(underline, { x: () => ticks[k].offsetLeft, width: () => ticks[k].offsetWidth, duration: FADE, ease: EASE.big }, at);
          calloutIn(k, at + FADE - 0.02);
        }
        // Each angle eases 1 → 1.03 and drifts while it's on screen.
        layerEls.forEach((el, k) => {
          const from = k === 0 ? 0.6 : turnAt(k);
          const to = k === layerEls.length - 1 ? length : turnAt(k + 1) + FADE;
          tl.fromTo(el.firstElementChild, { scale: 1, x: 0 }, { scale: 1.03, x: DRIFT, duration: to - from }, from);
        });
        // The shop link once the last angle has settled.
        shopIn(turning ? Math.min(turnAt(angles.length - 1) + FADE + 0.12, length - 0.06) : 0.9);
      },
      section,
    );

    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordSize = sig.wordSize ?? { desktop: vertical ? "16vw" : "14vw", mobile: vertical ? "16vw" : "12vw" };
  const vars = {
    "--size-d": wordSize.desktop,
    "--size-m": wordSize.mobile,
    "--half-d": frame.half.desktop,
    "--half-m": frame.half.mobile,
    height: `${100 + UNIT_VH * length}svh`,
  } as CSSProperties;
  const href = `/product/${sig.product}`;
  const name = product?.name ?? sig.title;

  return (
    <section
      ref={section}
      id={`signature-${sig.id}`}
      aria-labelledby={`signature-${sig.id}-title`}
      className={`relative ${turning ? "motion-reduce:!h-auto" : "motion-reduce:!h-svh"}`}
      style={vars}
    >
      <h2 id={`signature-${sig.id}-title`} className="sr-only">
        {sig.title}
      </h2>
      <div className={`sticky top-0 h-svh overflow-hidden motion-reduce:static ${turning ? "motion-reduce:hidden" : ""}`}>
        {/* The piece: full-screen photo(s), framed down to a small centred window to start. */}
        <Link
          ref={media}
          href={href}
          className="sig-media absolute inset-0 block"
          data-cursor="view"
          data-transition-label={name}
          aria-label={`${sig.shop}: ${name}`}
        >
          <div ref={photo} className="absolute inset-0">
            {layers.map((l, k) => (
              <div key={k} className={`sig-layer absolute inset-0 ${k > 0 ? "sig-layer-next" : ""}`}>
                <div className="absolute inset-0">
                  {/* All angles load together as the section approaches, so turning never waits. */}
                  <EditorialImage src={l.src} alt={l.alt} sizes="100vw" fallback="dark" />
                </div>
              </div>
            ))}
          </div>
        </Link>

        {/* Split headline: THE ← image → COAT (or above and below, for the band) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 font-display uppercase leading-none ${vertical ? "sig-words-v" : "sig-words-h"}`}
        >
          <span ref={left} className="sig-word sig-word-left absolute">
            {sig.words[0]}
          </span>
          <span ref={right} className="sig-word sig-word-right absolute">
            {sig.words[1]}
          </span>
        </div>

        <p ref={kicker} className="ui-label absolute left-pad top-[112px]">
          ({sig.index}) — {sig.title}
        </p>

        {/* Detail callouts (one layout for desktop, one for phones) */}
        <div ref={callouts} className="pointer-events-none absolute inset-0 text-ivory">
          <CalloutSet callouts={allCallouts} layout="desktop" className="hidden md:block" />
          <CalloutSet callouts={allCallouts} layout="mobile" className="md:hidden" />
        </div>

        {/* FRONT · SIDE · BACK · SIDE */}
        {turning && (
          <div
            ref={indicator}
            className="sig-indicator absolute bottom-[72px] left-1/2 -translate-x-1/2 bg-ivory px-4 py-3 md:bottom-pad"
            aria-hidden="true"
          >
            <div className="ui-label relative flex items-center gap-2 pb-1.5">
              {angles.map((a, k) => (
                <span key={k} className="flex items-center gap-2">
                  {k > 0 && <span className="text-stone">·</span>}
                  <span className="sig-tick text-stone">{a.name}</span>
                </span>
              ))}
              <span className="sig-underline absolute bottom-0 left-0 h-px w-0 bg-ink" />
            </div>
          </div>
        )}

        {/* Shop the … */}
        <p className="ui-label mask absolute bottom-pad left-pad z-[2]">
          <span ref={shop} className="sig-shop block">
            <Link href={href} className="nav-link relative inline-block text-ivory" data-transition-label={name}>
              {sig.shop} →
            </Link>
          </span>
        </p>
      </div>

      {/* Reduced motion, the cap: every angle at once, in a 2×2 grid. */}
      {turning && (
        <div className="hidden px-pad py-[16vh] motion-reduce:block">
          <p className="ui-label mb-10">
            ({sig.index}) — {sig.title}
          </p>
          <ul className="mx-auto grid max-w-[880px] grid-cols-2 gap-gutter">
            {angles.map((a, k) => (
              <li key={k}>
                <Link href={href} className="block" data-cursor="view" aria-label={`${a.name}: ${a.callout.label}. ${sig.shop}`}>
                  <div className="relative aspect-[4/5] overflow-hidden bg-loader-grey">
                    <EditorialImage src={a.src} alt={a.alt} sizes="50vw" />
                  </div>
                  <p className="ui-label mt-3 text-stone">{a.name}</p>
                  <p className="ui-label mt-1">{a.callout.label}</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="ui-label mt-10">
            <Link href={href} className="nav-link relative inline-block" data-transition-label={name}>
              {sig.shop} →
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
