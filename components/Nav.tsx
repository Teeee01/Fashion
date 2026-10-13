"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import { isSettledLayout, useIntro } from "@/lib/intro";
import Monogram from "@/components/hero/Monogram";
import MobileMenu from "./MobileMenu";
import { bag, bagCount, useBag } from "@/lib/bag";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import { useLenis } from "./SmoothScroll";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/collections/aw26" },
  { label: "Lookbook", href: "/#lookbook" },
  { label: "Atelier", href: "/#atelier" },
  { label: "Journal", href: "/#journal" },
  { label: "Contact", href: "/#contact" },
];

/** Below this scroll position the nav always shows. */
const ALWAYS_SHOW_ABOVE = 110;

/**
 * Two layouts:
 *   starting → six links spread evenly across the full width, no logo
 *   settled  → monogram logo top-left, links clustered on the right (28px gap)
 * The hero glides between them with GSAP Flip. Once settled, the nav hides
 * on scroll down and comes back on scroll up.
 * It sits above the preloader layer so it can stagger in over the columns.
 */
export default function Nav() {
  const header = useRef<HTMLElement>(null);
  const hidden = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { phase } = useIntro();
  const settled = isSettledLayout(phase);
  const lenis = useLenis();
  const { items } = useBag();
  const count = bagCount(items);

  // Pages without the home intro (e.g. a product page opened directly):
  // once the preloader has gone, simply fade the nav in.
  useEffect(() => {
    if (phase !== "settled") return;
    const hidden = gsap.utils
      .toArray<HTMLElement>(".nav-item, .nav-band, .nav-bag", header.current)
      .filter((el) => getComputedStyle(el).opacity === "0");
    if (hidden.length) gsap.to(hidden, { autoAlpha: 1, duration: DURATION.ui, ease: EASE.text, stagger: 0.04 });
  }, [phase]);

  const show = (visible: boolean) => {
    if (hidden.current === !visible) return;
    hidden.current = !visible;
    if (prefersReducedMotion()) {
      gsap.to(header.current, { autoAlpha: visible ? 1 : 0, duration: DURATION.reduced, ease: "none", overwrite: "auto" });
      return;
    }
    gsap.to(header.current, { yPercent: visible ? 0 : -100, duration: 0.5, ease: EASE.big, overwrite: "auto" });
  };

  // Opening the menu always brings the nav back.
  useEffect(() => {
    if (menuOpen) show(true);
  }, [menuOpen]);

  useEffect(() => {
    if (!lenis || phase !== "settled") return;
    const onScroll = ({ scroll, direction }: { scroll: number; direction: number }) => {
      if (menuOpen || scroll < ALWAYS_SHOW_ABOVE) show(true);
      else if (direction === 1) show(false);
      else if (direction === -1) show(true);
    };
    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis, phase, menuOpen]);

  return (
    <header
      ref={header}
      className="nav pointer-events-none fixed inset-x-0 top-0 z-[1100] h-[110px] text-ink"
      data-menu-open={menuOpen || undefined}
    >
      {/* Frosted band: blurred, softly fading out towards the bottom. */}
      <div className="nav-band absolute inset-0" aria-hidden="true" />

      <nav
        aria-label="Main"
        className={`relative flex h-[32px] px-pad top-[20px] ${settled ? "items-center" : "items-start"}`}
      >
        <Link
          href="/"
          className={`nav-logo pointer-events-auto absolute left-pad top-0 h-[32px] ${settled ? "" : "invisible"}`}
        >
          <Monogram variant="solid" flipId="monogram" className="h-full w-auto" title="Maison Sève home" />
        </Link>

        <ul className={`hidden w-full md:flex ${settled ? "justify-end gap-[28px]" : "justify-between"}`}>
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="nav-item nav-link ui-label pointer-events-auto relative inline-block">
                {link.label}
              </Link>
            </li>
          ))}
          {/* The bag joins the cluster once the nav has settled. */}
          <li className={settled ? "" : "hidden"}>
            <button type="button" className="nav-bag nav-link ui-label pointer-events-auto relative" onClick={() => bag.open()}>
              Bag ({count})
            </button>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-6 md:hidden">
          <button
            type="button"
            className={`nav-bag ui-label pointer-events-auto ${settled ? "" : "invisible"}`}
            onClick={() => bag.open()}
          >
            Bag ({count})
          </button>
          <MobileMenu links={NAV_LINKS} open={menuOpen} onOpenChange={setMenuOpen} header={header} />
        </div>
      </nav>
    </header>
  );
}
