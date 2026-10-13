"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { EASE } from "@/lib/motion";
import { isSettledLayout, useIntro } from "@/lib/intro";
import Monogram from "@/components/hero/Monogram";
import MobileMenu from "./MobileMenu";
import { useLenis } from "./SmoothScroll";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/#collections" },
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

  const show = (visible: boolean) => {
    if (hidden.current === !visible) return;
    hidden.current = !visible;
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
          aria-label="Maison Sève, home"
          className={`nav-logo pointer-events-auto absolute left-pad top-0 h-[32px] ${settled ? "" : "invisible"}`}
        >
          <Monogram variant="solid" flipId="monogram" className="h-full w-auto" title="Maison Sève" />
        </Link>

        <ul className={`hidden w-full md:flex ${settled ? "justify-end gap-[28px]" : "justify-between"}`}>
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="nav-item nav-link ui-label pointer-events-auto relative inline-block">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <MobileMenu links={NAV_LINKS} open={menuOpen} onOpenChange={setMenuOpen} header={header} />
      </nav>
    </header>
  );
}
