"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";
import { getIntro, setIntro } from "@/lib/intro";
import { getProduct } from "@/lib/products";
import { registerNavigator, setTransition } from "@/lib/transition";
import StairReveal, { type StairRevealHandle } from "./StairReveal";
import { NAV_OFFSET, useLenis } from "./SmoothScroll";

/* ──────────────────────────────────────────────────────────────
   Page transitions. Any click on a link to another page of the site is
   caught and played as:
     columns (default): six ink columns rise from the bottom, left →
       right, to cover the screen; the new page's name shows small and
       centred in ivory; the page changes; the columns retract upward.
       ≈1.2s plus however long the new page takes to arrive.
     shared (product cards, [data-transition="shared"]): the card's image
       lifts off and expands into the product page's main image
       ([data-shared-target]) while the rest of the page cross-fades.
   ────────────────────────────────────────────────────────────── */

const COLUMNS = { duration: 0.45, stagger: 0.03 }; // ≈0.6s each way
const SHARED_MOVE = 1.1;

const titleCase = (s: string) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** The name shown while the screen is covered. */
function labelFor(url: URL, link: HTMLAnchorElement | null) {
  if (link?.dataset.transitionLabel) return link.dataset.transitionLabel;
  const [first, second] = url.pathname.split("/").filter(Boolean);
  if (!first) return url.hash ? titleCase(url.hash.slice(1)) : "Maison Sève";
  if (first === "product" && second) return getProduct(second)?.name ?? "Product";
  if (first === "look" && second) return `Look ${second.padStart(2, "0")}`;
  if (first === "journal") return "Journal";
  return titleCase(first);
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
const play = (anim: gsap.core.Animation) => new Promise<void>((r) => anim.eventCallback("onComplete", () => r()));

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const [mounted, setMounted] = useState(false);
  const layer = useRef<HTMLDivElement>(null);
  const stair = useRef<StairRevealHandle>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [labelText, setLabelText] = useState("");
  const veil = useRef<HTMLDivElement>(null);
  const clone = useRef<HTMLDivElement>(null);
  const cloneImg = useRef<HTMLImageElement>(null);
  const busy = useRef(false);
  const arrived = useRef<((path: string) => void) | null>(null);

  useEffect(() => setMounted(true), []);

  // Resolve a pending navigation once the new page has rendered.
  useEffect(() => {
    arrived.current?.(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!lenis) return;

    const goTo = (url: URL) =>
      new Promise<void>((resolve) => {
        arrived.current = (path) => {
          if (path === url.pathname) {
            arrived.current = null;
            resolve();
          }
        };
        router.push(url.pathname + url.search, { scroll: false });
      });

    // Land at the top, or at the linked section, before revealing.
    const settleScroll = async (url: URL) => {
      await nextFrame();
      // The new page has a different height: re-measure pins and the
      // scroll range before jumping, or a deep link would fall short.
      ScrollTrigger.refresh();
      lenis.resize();
      const target = url.hash ? document.querySelector<HTMLElement>(decodeURIComponent(url.hash)) : null;
      lenis.scrollTo(target ?? 0, { immediate: true, force: true, offset: target ? -NAV_OFFSET : 0 });
      if (url.hash) history.replaceState(null, "", url.pathname + url.hash);
      await nextFrame();
    };

    const finish = () => {
      setTransition({ phase: "idle" });
      busy.current = false;
      if (getIntro().phase === "settled") lenis.start();
    };

    // ── Columns ──
    const columns = async (url: URL, text: string) => {
      const reduced = prefersReducedMotion();
      setTransition({ phase: "covering", kind: "columns" });
      setLabelText(text);
      gsap.set(layer.current, { visibility: "visible" });
      const cover = gsap.timeline();
      const up = stair.current?.build("cover", COLUMNS);
      if (up) cover.add(up, 0);
      cover.fromTo(
        label.current,
        reduced ? { y: 0, yPercent: 0, autoAlpha: 0 } : { y: 0, yPercent: 100, autoAlpha: 1 },
        reduced ? { autoAlpha: 1, duration: DURATION.reduced, ease: "none" } : { yPercent: 0, duration: 0.5, ease: EASE.text },
        reduced ? ">" : ">-0.15",
      );
      await play(cover);

      setTransition({ phase: "swapping" });
      // Leaving the holding hero: the next page uses the settled layout.
      if (getIntro().phase === "done") setIntro({ phase: "settled" });
      await goTo(url);
      await settleScroll(url);

      setTransition({ phase: "revealing" });
      const reveal = gsap.timeline();
      reveal.to(label.current, reduced ? { autoAlpha: 0, duration: DURATION.reduced / 2 } : { yPercent: -100, duration: 0.35, ease: EASE.text });
      const away = stair.current?.build("uncover", COLUMNS);
      if (away) reveal.add(away, reduced ? ">" : ">-0.1");
      reveal.set(layer.current, { visibility: "hidden" });
      await play(reveal);
      finish();
    };

    // ── Shared element: card image → product main image ──
    const shared = async (url: URL, source: HTMLElement) => {
      const reduced = prefersReducedMotion();
      const from = source.getBoundingClientRect();
      const sourceImg = source.querySelector("img");
      const src = sourceImg?.currentSrc ?? "";
      setTransition({ phase: "covering", kind: "shared" });

      if (cloneImg.current) {
        cloneImg.current.src = src;
        cloneImg.current.style.visibility = src ? "visible" : "hidden";
        // Match the source exactly (e.g. greyscale placeholders).
        cloneImg.current.style.filter = sourceImg ? getComputedStyle(sourceImg).filter : "";
      }
      gsap.set(clone.current, { visibility: "visible", left: from.left, top: from.top, width: from.width, height: from.height });
      await play(gsap.fromTo(veil.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? DURATION.reduced : 0.4, ease: EASE.text }));

      setTransition({ phase: "swapping" });
      if (getIntro().phase === "done") setIntro({ phase: "settled" });
      await goTo(url);
      await settleScroll(url);

      // The visible one (the desktop gallery and the phone carousel both mark one).
      const target = Array.from(document.querySelectorAll<HTMLElement>("[data-shared-target]")).find(
        (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0,
      );
      const to = target?.getBoundingClientRect();
      setTransition({ phase: "revealing" });
      const tl = gsap.timeline();
      if (to) {
        tl.to(clone.current, {
          left: to.left,
          top: to.top,
          width: to.width,
          height: to.height,
          duration: reduced ? 0 : SHARED_MOVE,
          ease: EASE.big,
        });
      }
      tl.to(veil.current, { autoAlpha: 0, duration: reduced ? DURATION.reduced : 0.7, ease: EASE.text }, reduced ? 0 : 0.35);
      await play(tl);
      // The real image is in place underneath: hand over and tidy up.
      finish();
      await nextFrame();
      gsap.set(clone.current, { visibility: "hidden" });
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return; // same page: smooth scroll handles it
      e.preventDefault();
      e.stopPropagation();
      start(url, link);
    };

    function start(url: URL, link: HTMLAnchorElement | null) {
      if (busy.current) return;
      busy.current = true;
      lenis!.stop();
      const source = link?.dataset.transition === "shared" ? link.querySelector<HTMLElement>("[data-shared-source]") : null;
      (source ? shared(url, source) : columns(url, labelFor(url, link))).catch(() => {
        // Never leave the screen covered: fall back to a plain navigation.
        busy.current = false;
        setTransition({ phase: "idle" });
        window.location.href = url.href;
      });
    }

    document.addEventListener("click", onClick, { capture: true });
    // Buttons (e.g. "Buy now") navigate through the same transition.
    const unregister = registerNavigator((href) => {
      const url = new URL(href, location.href);
      if (url.pathname !== location.pathname) start(url, null);
    });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      unregister();
    };
  }, [lenis, router]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Columns + page name */}
      <div ref={layer} className="page-transition pointer-events-none fixed inset-0 z-[1300]" aria-hidden="true">
        <StairReveal ref={stair} direction="up" columns={6} mobileColumns={4} color="var(--ink)" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="mask">
            <span ref={label} className="ui-label block text-ivory">
              {labelText}
            </span>
          </span>
        </div>
      </div>

      {/* Shared-element transition: an ivory veil over the page, and the card image on top */}
      <div ref={veil} className="page-veil pointer-events-none fixed inset-0 z-[1290] bg-ivory" aria-hidden="true" />
      <div ref={clone} className="page-clone pointer-events-none fixed z-[1300] overflow-hidden bg-loader-grey" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={cloneImg} alt="Product image, enlarging" className="h-full w-full object-cover" />
      </div>
    </>,
    document.body,
  );
}
