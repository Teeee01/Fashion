"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";

/* ──────────────────────────────────────────────────────────────
   Custom cursor: a small ink dot that trails the mouse with a soft lag.
   The system cursor stays visible; this sits on top, ignoring clicks.

   States, picked from what's under the pointer:
     default → 10px dot
     link    → dot at half size (any <a>, <button> or [data-cursor="link"])
     view    → 72px disc with "VIEW" (any <img> or [data-cursor="view"])
     drag    → 72px disc with "DRAG" ([data-cursor="drag"])
     none    → hidden ([data-cursor="none"])

   The disc is drawn at its full 72px and scaled down for the dot, so the
   label is never stretched when it grows.
   ────────────────────────────────────────────────────────────── */

type CursorState = "default" | "link" | "view" | "drag" | "none";

const FULL = 72;
const DOT = 10;
const SCALE: Record<CursorState, number> = {
  default: DOT / FULL,
  link: (DOT / FULL) * 0.5,
  view: 1,
  drag: 1,
  none: 0,
};
const LABEL: Partial<Record<CursorState, string>> = { view: "View", drag: "Drag" };

function stateFor(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "default";
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) {
    const value = tagged.dataset.cursor as CursorState;
    if (value in SCALE) return value;
  }
  if (target.closest("img")) return "view";
  if (target.closest("a, button, [role='button'], label, summary")) return "link";
  return "default";
}

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  // Only on devices with a real mouse; never on touch screens.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(fine.matches);
    update();
    fine.addEventListener("change", update);
    return () => fine.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !root.current || !disc.current || !label.current) return;
    const reduced = prefersReducedMotion();
    const el = root.current;
    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    gsap.set(disc.current, { scale: SCALE.default });

    // Soft lag: quickTo reuses one tween per axis, so following is cheap.
    // Under reduced motion it follows exactly, with no trailing.
    const lag = reduced ? 0.01 : 0.6;
    const toX = gsap.quickTo(el, "x", { duration: lag, ease: "power3" });
    const toY = gsap.quickTo(el, "y", { duration: lag, ease: "power3" });

    let current: CursorState = "default";
    let shown = false;

    const setState = (next: CursorState) => {
      if (next === current) return;
      current = next;
      const text = LABEL[next];
      if (text && label.current) label.current.textContent = text;
      const d = reduced ? DURATION.reduced : DURATION.ui;
      gsap.to(disc.current, { scale: SCALE[next], duration: d, ease: reduced ? "none" : EASE.text, overwrite: "auto" });
      gsap.to(label.current, {
        opacity: text ? 1 : 0,
        duration: text ? d : d / 2,
        delay: text && !reduced ? 0.1 : 0,
        ease: EASE.text,
        overwrite: "auto",
      });
    };

    const show = (visible: boolean) => {
      if (shown === visible) return;
      shown = visible;
      gsap.to(el, { autoAlpha: visible ? 1 : 0, duration: reduced ? DURATION.reduced : 0.4, ease: EASE.text, overwrite: "auto" });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) gsap.set(el, { x: e.clientX, y: e.clientY }); // start where the mouse is
      toX(e.clientX);
      toY(e.clientY);
      show(true);
      setState(stateFor(e.target));
    };
    const onLeave = () => show(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([el, disc.current, label.current]);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={root} aria-hidden="true" className="cursor pointer-events-none fixed left-0 top-0 z-[2000]">
      <div
        ref={disc}
        className="flex items-center justify-center rounded-full bg-ink"
        style={{ width: FULL, height: FULL }}
      >
        <span ref={label} className="ui-label text-[10px] text-ivory opacity-0" />
      </div>
    </div>
  );
}
