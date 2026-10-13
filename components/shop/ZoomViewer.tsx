"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";
import { getIntro } from "@/lib/intro";
import EditorialImage from "@/components/EditorialImage";
import StairReveal, { type StairRevealHandle } from "@/components/StairReveal";
import { useLenis } from "@/components/SmoothScroll";

type Img = { src: string; alt: string };

/**
 * Full-screen zoom: ink columns rise to cover the page (StairReveal), then
 * the image appears enlarged. Move the mouse (or drag a finger) to pan;
 * ← → or the arrows to change image; Esc or CLOSE to leave.
 */
export default function ZoomViewer({ images, index, onClose }: { images: Img[]; index: number | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const root = useRef<HTMLDivElement>(null);
  const stair = useRef<StairRevealHandle>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pan = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const first = useRef(true);
  const lenis = useLenis();
  const open = index !== null;

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (index !== null) setCurrent(index);
  }, [index]);

  // The enlarged image covers the screen 1.6× over (3:4 photos).
  useEffect(() => {
    const size = () => {
      const w = Math.max(window.innerWidth, window.innerHeight * 0.75) * 1.6;
      setBox({ w, h: (w * 4) / 3 });
    };
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, []);

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
      const cover = stair.current?.build("cover", { duration: 0.6, stagger: 0.04 });
      if (cover) tl.add(cover, 0);
      tl.fromTo(stage.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? DURATION.reduced : 0.5, ease: EASE.text }, reduced ? ">" : ">-0.15");
      tl.call(() => closeBtn.current?.focus({ preventScroll: true }));
    } else {
      tl.to(stage.current, { autoAlpha: 0, duration: reduced ? DURATION.reduced / 2 : 0.3, ease: EASE.text });
      const uncover = stair.current?.build("uncover", { duration: 0.6, stagger: 0.04 });
      if (uncover) tl.add(uncover, ">");
      tl.set(root.current, { visibility: "hidden" });
      tl.call(() => {
        if (getIntro().phase === "settled") lenis?.start();
        returnTo.current?.focus({ preventScroll: true });
      });
    }
    return () => void tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  // Pan with the pointer (mouse position, or finger while dragging).
  useEffect(() => {
    if (!open || !pan.current) return;
    const el = pan.current;
    const reduced = prefersReducedMotion();
    const toX = gsap.quickTo(el, "x", { duration: reduced ? 0.01 : 0.6, ease: "power3" });
    const toY = gsap.quickTo(el, "y", { duration: reduced ? 0.01 : 0.6, ease: "power3" });
    const move = (e: PointerEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      toX(-(e.clientX / vw) * Math.max(box.w - vw, 0));
      toY(-(e.clientY / vh) * Math.max(box.h - vh, 0));
    };
    gsap.set(el, { x: -(box.w - window.innerWidth) / 2, y: -(box.h - window.innerHeight) / 2 });
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [open, box, current]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, images.length]);

  if (!mounted) return null;
  const img = images[current];

  return createPortal(
    <div ref={root} className="zoom-root fixed inset-0 z-[1260] touch-none" role="dialog" aria-modal="true" aria-label="Image zoom" inert={!open} aria-hidden={!open}>
      <StairReveal ref={stair} direction="up" columns={6} mobileColumns={4} color="var(--ink)" />
      <div ref={stage} className="absolute inset-0 overflow-hidden opacity-0" data-cursor="none">
        <div ref={pan} className="absolute left-0 top-0" style={{ width: box.w, height: box.h }}>
          {img && <EditorialImage key={img.src} src={img.src} alt={img.alt} sizes="160vw" fallback="dark" />}
        </div>
        <div className="pointer-events-none absolute inset-x-pad top-[20px] flex items-center justify-between text-ivory mix-blend-difference">
          <p className="ui-label tabular-nums">
            {current + 1} / {images.length}
          </p>
        </div>
        <button ref={closeBtn} type="button" onClick={onClose} className="ui-label absolute right-pad top-[20px] text-ivory mix-blend-difference">
          Close ✕
        </button>
        {images.length > 1 && (
          <div className="absolute inset-x-pad bottom-pad flex justify-between">
            <button type="button" className="ui-label text-ivory mix-blend-difference" onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}>
              ← Previous
            </button>
            <button type="button" className="ui-label text-ivory mix-blend-difference" onClick={() => setCurrent((c) => (c + 1) % images.length)}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
