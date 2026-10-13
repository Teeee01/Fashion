"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getTransition, useTransitionState } from "@/lib/transition";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";

/* ──────────────────────────────────────────────────────────────
   Custom cursor: a small ink dot that trails the mouse with a soft lag.
   The system cursor stays visible; this sits on top, ignoring clicks.

   States, picked from what's under the pointer:
     default → 10px dot
     link    → dot at half size (any <a>, <button> or [data-cursor="link"])
     view    → 72px disc with "VIEW" ([data-cursor="view"] on, or inside, a
               real link with an href; anywhere else it's the plain dot)
     zoom    → 72px disc with "ZOOM" ([data-cursor="zoom"], product images)
     drag    → 72px disc with "DRAG" ([data-cursor="drag"])
     play    → 72px disc with "PLAY" ([data-cursor="play"])
     none    → hidden ([data-cursor="none"])

   The disc is drawn at its full 72px and scaled down for the dot, so the
   label is never stretched when it grows.
   ────────────────────────────────────────────────────────────── */

type CursorState = "default" | "link" | "view" | "zoom" | "drag" | "play" | "none";

const FULL = 72;
const DOT = 10;
const SCALE: Record<CursorState, number> = {
  default: DOT / FULL,
  link: (DOT / FULL) * 0.5,
  view: 1,
  zoom: 1,
  drag: 1,
  play: 1,
  none: 0,
};
const LABEL: Partial<Record<CursorState, string>> = { view: "View", zoom: "Zoom", drag: "Drag", play: "Play" };

function stateFor(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "default";
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) {
    const value = tagged.dataset.cursor as CursorState;
    // VIEW promises a destination: only on an actual link (the tagged element
    // is the <a href>, or sits inside one). Never for a container that merely
    // holds a link somewhere, so empty space, text and drawings get the dot.
    if (value === "view") return tagged.closest("a[href]") ? "view" : "default";
    if (value in SCALE) return value;
  }
  if (target.closest("a, button, [role='button'], label, summary")) return "link";
  return "default";
}

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const recheck = useRef<() => void>(() => {});
  const pathname = usePathname();
  const transition = useTransitionState();

  // Only on devices with a real mouse, and not on phone-sized screens.
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)");
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
    let lastX = -1;
    let lastY = -1;

    const setState = (next: CursorState) => {
      if (next === current) return;
      current = next;
      el.dataset.state = next; // handy for checking in the browser
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
      lastX = e.clientX;
      lastY = e.clientY;
      show(true);
      setState(stateFor(e.target));
    };
    const onLeave = () => show(false);

    // The page under a still mouse can change (a transition covers it, a new
    // page arrives): re-read what's under the pointer instead of keeping
    // the old page's label (e.g. VIEW) on screen.
    recheck.current = () => {
      if (!shown) return;
      const { phase } = getTransition();
      if (phase === "covering" || phase === "swapping") return setState("default");
      requestAnimationFrame(() => setState(stateFor(document.elementFromPoint(lastX, lastY))));
    };

    // Scrolling with a still mouse slides a different element under it:
    // re-read it (once per frame), so a label from an image that has scrolled
    // away (e.g. VIEW) doesn't linger over empty space.
    let queued = false;
    const onScroll = () => {
      if (queued || !shown) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        setState(stateFor(document.elementFromPoint(lastX, lastY)));
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf([el, disc.current, label.current]);
      recheck.current = () => {};
    };
  }, [enabled]);

  useEffect(() => recheck.current(), [pathname, transition.phase]);

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
