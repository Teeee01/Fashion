"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { getIntro } from "@/lib/intro";
import { useLenis } from "./SmoothScroll";

/**
 * A panel that slides in from the right (0.7s, house ease) while the page
 * behind dims to 30% ink; anything marked `.drawer-rise` inside then
 * rises from its mask, staggered. Escape, the backdrop or CLOSE shut it.
 * Used by the bag and the size guide.
 */
export default function Drawer({
  open,
  onClose,
  label,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const first = useRef(true);
  const lenis = useLenis();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (first.current) {
      first.current = false;
      if (!open) return;
    }
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline();
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      lenis?.stop();
      gsap.set(root.current, { visibility: "visible" });
      if (reduced) {
        tl.set(panel.current, { x: 0, xPercent: 0 }).fromTo([dim.current, panel.current], { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
      } else {
        tl.fromTo(dim.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: EASE.text }, 0)
          .fromTo(panel.current, { x: 0, xPercent: 100, autoAlpha: 1 }, { xPercent: 0, duration: 0.7, ease: EASE.big }, 0)
          .fromTo(
            panel.current?.querySelectorAll(".drawer-rise") ?? [],
            { y: 0, yPercent: 100 },
            { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines },
            0.45,
          );
      }
      tl.call(() => closeBtn.current?.focus({ preventScroll: true }));
    } else {
      if (reduced) tl.to([dim.current, panel.current], { autoAlpha: 0, duration: DURATION.reduced, ease: "none" });
      else tl.to(panel.current, { xPercent: 100, duration: 0.7, ease: EASE.big }, 0).to(dim.current, { autoAlpha: 0, duration: 0.6, ease: EASE.text }, 0.1);
      tl.set(root.current, { visibility: "hidden" });
      tl.call(() => {
        if (getIntro().phase === "settled") lenis?.start();
        returnTo.current?.focus({ preventScroll: true });
      });
    }
    return () => void tl.kill();
    // Content changing while open shouldn't replay the slide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div ref={root} className="drawer-root fixed inset-0 z-[1250]" inert={!open} aria-hidden={!open}>
      <div ref={dim} className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="drawer-panel absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-ivory px-pad pb-pad pt-[20px]"
      >
        <div className="flex items-center justify-between">
          <p className="ui-label">{title}</p>
          <button ref={closeBtn} type="button" className="nav-link ui-label relative" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-10 flex-1 overflow-y-auto" data-lenis-prevent>
          {children}
        </div>
        {footer}
      </div>
    </div>,
    document.body,
  );
}
