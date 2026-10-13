"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { ARTICLES } from "@/lib/journal";
import EditorialImage from "./EditorialImage";

/* ──────────────────────────────────────────────────────────────
   (07) Journal — a vertical list of five entries.
   Rows rise from their masks (with their hairline drawing in) as they
   come into view. With a mouse: hovering a row shows a 280×360
   thumbnail that trails the cursor (quickTo, 0.5s) and tilts with the
   mouse's speed (−3° to 3°); moving between rows cross-fades the image,
   and the other rows dim to 40%.
   ────────────────────────────────────────────────────────────── */

const THUMB = { w: 280, h: 360 };
const MAX_TILT = 3; // degrees
const TILT_PER_PX = 0.18; // degrees of tilt per pixel moved per frame

export default function Journal() {
  const section = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [hoverable, setHoverable] = useState(false);

  // ── Rows rise as they come into view ──
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      const rows = gsap.utils.toArray<HTMLElement>(".journal-row", list.current);
      gsap.set(rows.map((r) => r.querySelector(".journal-rule")), { scaleX: reduced ? 1 : 0 });
      ScrollTrigger.batch(rows, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => {
          const inner = batch.map((r) => r.querySelector(".journal-rise"));
          const rules = batch.map((r) => r.querySelector(".journal-rule"));
          if (reduced) {
            gsap.fromTo(inner, { y: 0, yPercent: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
            return;
          }
          gsap.to(rules, { scaleX: 1, duration: 1.2, ease: EASE.big, stagger: STAGGER.lines });
          gsap.fromTo(
            inner,
            { y: 0, yPercent: 100 },
            { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines, delay: 0.1 },
          );
        },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  // ── Hover thumbnail: only with a real mouse ──
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverable(fine.matches);
    update();
    fine.addEventListener("change", update);
    return () => fine.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = thumb.current;
    if (!hoverable || !el) return;
    const reduced = prefersReducedMotion();
    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.92 });

    const lag = reduced ? 0.01 : 0.5;
    const toX = gsap.quickTo(el, "x", { duration: lag, ease: "power3" });
    const toY = gsap.quickTo(el, "y", { duration: lag, ease: "power3" });
    const toTilt = gsap.quickTo(el, "rotation", { duration: 0.5, ease: "power3" });

    let mouseX = 0;
    let lastX = 0;
    let started = false;
    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      if (!started) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        lastX = e.clientX;
        started = true;
      }
      toX(e.clientX);
      toY(e.clientY);
    };
    // Tilt follows horizontal speed, measured each frame, and eases back to
    // level when the mouse rests.
    const tick = () => {
      if (reduced) return;
      const speed = mouseX - lastX;
      lastX = mouseX;
      toTilt(gsap.utils.clamp(-MAX_TILT, MAX_TILT, speed * TILT_PER_PX));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
      gsap.killTweensOf(el);
    };
  }, [hoverable]);

  // Show/hide the frame and cross-fade to the hovered entry's image.
  useEffect(() => {
    const el = thumb.current;
    if (!hoverable || !el) return;
    const reduced = prefersReducedMotion();
    const d = reduced ? DURATION.reduced : DURATION.ui;
    gsap.to(el, {
      autoAlpha: active === null ? 0 : 1,
      scale: active === null || reduced ? (reduced ? 1 : 0.92) : 1,
      duration: d,
      ease: EASE.text,
      overwrite: "auto",
    });
    if (active === null) return;
    el.querySelectorAll<HTMLElement>(".journal-thumb-img").forEach((img, i) => {
      gsap.to(img, { opacity: i === active ? 1 : 0, duration: d, ease: EASE.text, overwrite: "auto" });
    });
  }, [active, hoverable]);

  return (
    <section ref={section} id="journal" aria-labelledby="journal-label" className="relative py-[16vh]">
      <div className="grid-12 mb-12">
        <p id="journal-label" className="ui-label col-span-6" data-reveal="lines">
          (07) — Journal
        </p>
        <p className="ui-label col-span-6 text-right text-stone" data-reveal="lines">
          Notes from the atelier
        </p>
      </div>

      <ul ref={list} className="journal-list px-pad" onPointerLeave={() => setActive(null)}>
        {ARTICLES.map((a, i) => (
          <li key={a.number} className="journal-row relative" onPointerEnter={() => setActive(i)}>
            <span className="journal-rule absolute inset-x-0 top-0 h-px origin-left bg-hairline" aria-hidden="true" />
            <Link href={a.href} className="block overflow-hidden" onFocus={() => setActive(i)} onBlur={() => setActive(null)}>
              <div className="journal-rise grid grid-cols-12 items-baseline gap-x-gutter py-6 md:py-8">
                <span className="ui-label col-span-2 text-stone md:col-span-1">{a.number}</span>
                <span className="col-span-10 font-display text-[28px] leading-[1.05] tracking-[-0.01em] md:col-span-7 md:text-[40px]">
                  {a.title}
                </span>
                <span className="ui-label col-span-5 col-start-3 mt-3 md:col-span-2 md:col-start-9 md:mt-0">{a.category}</span>
                <span className="ui-label col-span-5 mt-3 text-right text-stone md:col-span-2 md:mt-0">{a.date}</span>
              </div>
            </Link>
          </li>
        ))}
        <li aria-hidden="true" className="h-px bg-hairline" />
      </ul>

      {/* Floating thumbnail (mouse only): all images stacked; one shows at a time. */}
      {hoverable && (
        <div
          ref={thumb}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[900] overflow-hidden bg-loader-grey"
          style={{ width: THUMB.w, height: THUMB.h }}
        >
          {ARTICLES.map((a) => (
            <div key={a.number} className="journal-thumb-img absolute inset-0 opacity-0">
              <EditorialImage src={a.image} alt={a.alt} label={a.category} sizes={`${THUMB.w}px`} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
