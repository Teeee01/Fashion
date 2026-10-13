"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";
import { getIntro, isSettledLayout } from "@/lib/intro";
import StairReveal, { type StairRevealHandle } from "./StairReveal";
import { useLenis } from "./SmoothScroll";

type MobileMenuProps = {
  links: { label: string; href: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The nav header, whose text turns ivory while the menu is open. */
  header: RefObject<HTMLElement | null>;
};

const LINK_STAGGER = 0.06;

/**
 * Mobile only: a "MENU" button that opens a full-screen ink panel.
 * Opening: ink columns grow DOWN from the top (StairReveal), then the links
 * rise in large Bodoni Moda. Closing plays it the other way and the columns
 * carry on downwards out of view.
 */
export default function MobileMenu({ links, open, onOpenChange, header }: MobileMenuProps) {
  const panel = useRef<HTMLDivElement>(null);
  const stair = useRef<StairRevealHandle>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const first = useRef(true);
  const [mounted, setMounted] = useState(false);
  const lenis = useLenis();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Skip the very first render (menu starts closed, nothing to animate).
    if (first.current) {
      first.current = false;
      return;
    }
    const items = panel.current?.querySelectorAll(".menu-link") ?? [];
    const reduced = prefersReducedMotion();
    // The frosted band would read as a grey strip over the ink panel.
    const band = header.current?.querySelector(".nav-band") ?? null;
    tl.current?.kill();
    const t = gsap.timeline();
    tl.current = t;

    if (open) {
      lenis?.stop();
      gsap.set(panel.current, { visibility: "visible" });
      const cover = stair.current?.build("cover", { duration: 0.9, stagger: 0.06 });
      if (cover) t.add(cover, 0);
      t.to(band, { autoAlpha: 0, duration: reduced ? DURATION.reduced : 0.3, ease: EASE.text }, 0);
      t.to(header.current, { color: "#F2F1EE", duration: reduced ? DURATION.reduced : 0.4, ease: EASE.text }, reduced ? 0 : 0.3);
      if (reduced) {
        t.fromTo(items, { y: 0, yPercent: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" }, ">");
      } else {
        t.fromTo(
          items,
          { y: 0, yPercent: 100, autoAlpha: 1 },
          { yPercent: 0, duration: 0.8, ease: EASE.text, stagger: LINK_STAGGER },
          ">-0.3",
        );
      }
      t.call(() => (items[0] as HTMLElement | undefined)?.focus({ preventScroll: true }));
    } else {
      if (reduced) {
        t.to(items, { autoAlpha: 0, duration: DURATION.reduced / 2, ease: "none" });
      } else {
        t.to(items, { yPercent: -100, duration: 0.4, ease: EASE.text, stagger: 0.03 });
      }
      const uncover = stair.current?.build("uncover", { duration: 0.9, stagger: 0.06 });
      if (uncover) t.add(uncover, reduced ? ">" : ">-0.15");
      t.to(header.current, { color: "#0E0E0E", duration: 0.4, ease: EASE.text, clearProps: "color" }, "<0.2");
      if (isSettledLayout(getIntro().phase)) {
        t.to(band, { autoAlpha: 1, duration: 0.5, ease: EASE.text }, "<");
      }
      t.set(panel.current, { visibility: "hidden" });
      // Only unlock scrolling if the intro had already unlocked it.
      t.call(() => getIntro().phase === "settled" && lenis?.start());
    }
  }, [open, lenis, header]);

  // Escape closes; growing past mobile width closes too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => wide.matches && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open, onOpenChange]);

  useEffect(() => () => void tl.current?.kill(), []);

  return (
    <>
      <button
        type="button"
        className="nav-item nav-menu-btn ui-label pointer-events-auto ml-auto md:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => onOpenChange(!open)}
      >
        {open ? "Close" : "Menu"}
      </button>

      {mounted &&
        createPortal(
          <div
            ref={panel}
            id="mobile-menu"
            className="mobile-menu fixed inset-0 z-[1090] md:hidden"
            inert={!open}
            aria-hidden={!open}
          >
            <StairReveal ref={stair} direction="down" columns={4} color="var(--ink)" />
            <nav aria-label="Menu" className="relative px-pad pt-[28vh]">
              <ul>
                {links.map((link) => (
                  <li key={link.label} className="mask">
                    <Link
                      href={link.href}
                      className="menu-link block font-display text-[48px] leading-[1.1] tracking-[-0.02em] text-ivory"
                      onClick={() => onOpenChange(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
