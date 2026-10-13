"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";

/* ──────────────────────────────────────────────────────────────
   StairReveal — a row of solid vertical columns that grow in (or
   shrink away) one after another, left to right, like a staircase.

   Use it declaratively:
     <StairReveal play="cover" onComplete={...} />
   or drive it from a parent timeline via a ref:
     const stair = useRef<StairRevealHandle>(null);
     await stair.current.cover();

   It fills its nearest positioned parent (absolute inset-0), so it
   works full-screen inside a fixed layer, or over a single image.
   ────────────────────────────────────────────────────────────── */

export type StairAction = "cover" | "uncover";

export type StairRevealProps = {
  /** "up": columns grow from the bottom edge. "down": from the top edge. */
  direction?: "up" | "down";
  /** Number of columns on tablet/desktop. */
  columns?: number;
  /** Number of columns below 768px wide. Defaults to `columns`. */
  mobileColumns?: number;
  /** Any CSS colour; use a token, e.g. "var(--white)". */
  color?: string;
  /** Seconds each column takes. */
  duration?: number;
  /** Seconds between neighbouring columns. */
  stagger?: number;
  /** Start state: columns empty ("hidden") or full ("covered"). */
  initial?: "hidden" | "covered";
  /** Set to play an action declaratively; changing it plays again. */
  play?: StairAction;
  onComplete?: (action: StairAction) => void;
  className?: string;
};

export type StairPlayOptions = { duration?: number; stagger?: number };

export type StairRevealHandle = {
  /** Columns grow to full height. Resolves when the last column is full. */
  cover: (options?: StairPlayOptions) => Promise<void>;
  /** Columns shrink away, continuing in the same direction. */
  uncover: (options?: StairPlayOptions) => Promise<void>;
};

const StairReveal = forwardRef<StairRevealHandle, StairRevealProps>(function StairReveal(
  {
    direction = "up",
    columns = 6,
    mobileColumns,
    color = "var(--white)",
    duration = 0.9,
    stagger = STAGGER.columns,
    initial = "hidden",
    play,
    onComplete,
    className = "",
  },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  const active = useRef<gsap.core.Animation | null>(null);
  const mobile = mobileColumns ?? columns;
  const count = Math.max(columns, mobile);

  // Bottom-anchored for "up", top-anchored for "down". When uncovering,
  // the anchor flips so the columns keep travelling the same way.
  const origin = (action: StairAction) => {
    const growsFromBottom = direction === "up";
    const anchorBottom = action === "cover" ? growsFromBottom : !growsFromBottom;
    return anchorBottom ? "50% 100%" : "50% 0%";
  };

  const run = (action: StairAction, options: StairPlayOptions = {}) =>
    new Promise<void>((resolve) => {
      const el = root.current;
      if (!el) return resolve();
      // Only the columns visible at this screen size take part.
      const cols = Array.from(el.children as HTMLCollectionOf<HTMLElement>).filter(
        (c) => getComputedStyle(c).display !== "none",
      );
      active.current?.kill();

      const done = () => {
        onComplete?.(action);
        resolve();
      };

      if (prefersReducedMotion()) {
        gsap.set(cols, { scaleY: 1 });
        active.current = gsap.fromTo(
          el,
          { autoAlpha: action === "cover" ? 0 : 1 },
          { autoAlpha: action === "cover" ? 1 : 0, duration: DURATION.reduced, ease: "none", onComplete: done },
        );
        return;
      }

      gsap.set(el, { autoAlpha: 1 });
      active.current = gsap.fromTo(
        cols,
        { scaleY: action === "cover" ? 0 : 1, transformOrigin: origin(action) },
        {
          scaleY: action === "cover" ? 1 : 0,
          duration: options.duration ?? duration,
          stagger: options.stagger ?? stagger,
          ease: EASE.big,
          onComplete: done,
        },
      );
    });

  useImperativeHandle(ref, () => ({
    cover: (o) => run("cover", o),
    uncover: (o) => run("uncover", o),
  }));

  useEffect(() => {
    if (play) run(play);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  useEffect(() => () => void active.current?.kill(), []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex ${className}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`stair-col h-full flex-1 will-change-transform ${
            i >= columns ? "hidden max-md:block" : i >= mobile ? "max-md:hidden" : ""
          }`}
          style={{
            background: color,
            transform: `scaleY(${initial === "covered" ? 1 : 0})`,
            transformOrigin: direction === "up" ? "50% 100%" : "50% 0%",
          }}
        />
      ))}
    </div>
  );
});

export default StairReveal;
