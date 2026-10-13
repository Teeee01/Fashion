"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";
import { getIntro, setIntro } from "@/lib/intro";
import { getProduct } from "@/lib/products";
import { registerNavigator, setTransition } from "@/lib/transition";
import { canFly, purgeTransitionLayers, takeOff, type Flight } from "@/lib/shared-transition";
import StairReveal, { type StairRevealHandle } from "./StairReveal";
import { NAV_OFFSET, clearHash, useLenis } from "./SmoothScroll";

/* ──────────────────────────────────────────────────────────────
   Page transitions. Any click on a link to another page of the site is
   caught and played as:
     columns (default): six ink columns rise from the bottom, left →
       right, to cover the screen; the new page's name shows small and
       centred in ivory; the page changes; the columns retract upward.
     shared (product cards, [data-transition="shared"]): the card's image
       lifts off and expands into the product page's main image
       ([data-shared-target]) while the rest of the page cross-fades.
       The flight itself lives in lib/shared-transition.ts. If the card
       isn't fully on screen (or its image hasn't loaded), the columns
       play instead.

   Every navigation gets a run number. Starting a new one (another click
   mid-transition) cancels the old one: its animations are killed and its
   layers deleted; the abandoned steps check their run number and stop.
   Route changes we didn't start (the browser's back/forward buttons)
   also cancel whatever is in flight. And on every route change, any
   leftover transition layer is removed before the new page shows.
   ────────────────────────────────────────────────────────────── */

const COLUMNS = { duration: 0.45, stagger: 0.03 }; // ≈0.6s each way

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

/**
 * Leaving the home page before its intro has finished (mid-entrance, or
 * while the hero holds): the next page uses the settled layout, and
 * scrolling must unlock there. Without this, leaving mid-entrance left the
 * intro unfinished and the next page's scroll locked.
 */
function leaveIntro() {
  const { phase } = getIntro();
  if (phase === "revealing" || phase === "done" || phase === "settling") setIntro({ phase: "settled" });
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
  /** The current navigation's number; 0 = none in progress. */
  const active = useRef(0);
  const counter = useRef(0);
  /** Everything the current navigation has running, so it can be stopped at once. */
  const running = useRef<{ anims: gsap.core.Animation[]; flight: Flight | null }>({ anims: [], flight: null });
  const arrived = useRef<((path: string) => void) | null>(null);
  const cancelRef = useRef<() => void>(() => {});

  useEffect(() => setMounted(true), []);

  // Every route change: resolve our pending navigation, or — if we didn't
  // start it (back/forward) — cancel whatever is in flight. Then sweep up
  // any transition layer that doesn't belong to a live navigation.
  useEffect(() => {
    const pending = arrived.current;
    if (pending) pending(pathname);
    // Not ours (back/forward): stop anything in flight and put the page at rest.
    else cancelRef.current();
    purgeTransitionLayers(active.current || undefined);
  }, [pathname]);

  useEffect(() => {
    if (!lenis) return;

    /** Stop the current navigation now and put everything back to rest. */
    const cancel = () => {
      const r = running.current;
      r.anims.forEach((a) => a.kill());
      r.flight?.cancel();
      running.current = { anims: [], flight: null };
      active.current = 0;
      arrived.current = null;
      purgeTransitionLayers();
      gsap.set(layer.current, { visibility: "hidden" });
      setTransition({ phase: "idle" });
      leaveIntro();
      if (getIntro().phase === "settled") lenis.start();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    cancelRef.current = cancel;

    const track = <T extends gsap.core.Animation>(a: T) => (running.current.anims.push(a), a);

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
      clearHash(); // never leave "#section" behind (see SmoothScroll)
      await nextFrame();
    };

    const finish = (run: number) => {
      if (active.current !== run) return;
      active.current = 0;
      running.current = { anims: [], flight: null };
      setTransition({ phase: "idle" });
      if (getIntro().phase === "settled") lenis.start();
    };

    // ── Columns ──
    const columns = async (run: number, url: URL, text: string) => {
      const alive = () => active.current === run;
      const reduced = prefersReducedMotion();
      setTransition({ phase: "covering", kind: "columns" });
      setLabelText(text);
      gsap.set(layer.current, { visibility: "visible" });
      const cover = track(gsap.timeline());
      const up = stair.current?.build("cover", COLUMNS);
      if (up) cover.add(up, 0);
      cover.fromTo(
        label.current,
        reduced ? { y: 0, yPercent: 0, autoAlpha: 0 } : { y: 0, yPercent: 100, autoAlpha: 1 },
        reduced ? { autoAlpha: 1, duration: DURATION.reduced, ease: "none" } : { yPercent: 0, duration: 0.5, ease: EASE.text },
        reduced ? ">" : ">-0.15",
      );
      await play(cover);
      if (!alive()) return;

      setTransition({ phase: "swapping" });
      leaveIntro();
      await goTo(url);
      if (!alive()) return;
      await settleScroll(url);
      if (!alive()) return;

      setTransition({ phase: "revealing" });
      const reveal = track(gsap.timeline());
      reveal.to(label.current, reduced ? { autoAlpha: 0, duration: DURATION.reduced / 2 } : { yPercent: -100, duration: 0.35, ease: EASE.text });
      const away = stair.current?.build("uncover", COLUMNS);
      if (away) reveal.add(away, reduced ? ">" : ">-0.1");
      reveal.set(layer.current, { visibility: "hidden" });
      await play(reveal);
      finish(run);
    };

    // ── Shared element: card image → product main image ──
    const shared = async (run: number, url: URL, source: HTMLElement) => {
      const alive = () => active.current === run;
      const flight = takeOff(source, run, prefersReducedMotion());
      running.current.flight = flight;
      setTransition({ phase: "covering", kind: "shared" });
      await flight.cover();
      if (!alive()) return;

      setTransition({ phase: "swapping" });
      leaveIntro();
      await goTo(url);
      if (!alive()) return;
      await settleScroll(url);
      if (!alive()) return;

      // The visible target (the desktop viewer and the phone carousel both mark one).
      const target =
        Array.from(document.querySelectorAll<HTMLElement>("[data-shared-target]")).find(
          (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().width > 0,
        ) ?? null;
      setTransition({ phase: "revealing" });
      // Hand-over: going idle un-hides the real image under the copy.
      await flight.land(target, () => alive() && setTransition({ phase: "idle" }));
      finish(run);
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
      // Another navigation is mid-way: stop it cleanly, then use the columns.
      const interrupted = active.current !== 0;
      if (interrupted) cancel();
      const run = ++counter.current;
      active.current = run;
      lenis!.stop();
      const source = link?.dataset.transition === "shared" ? link.querySelector<HTMLElement>("[data-shared-source]") : null;
      const flies = !interrupted && canFly(source);
      (flies ? shared(run, url, source) : columns(run, url, labelFor(url, link))).catch(() => {
        // Never leave the screen covered: fall back to a plain navigation.
        if (active.current !== run) return;
        cancel();
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
      if (active.current) cancel();
    };
  }, [lenis, router]);

  if (!mounted) return null;

  return createPortal(
    // Columns + page name. (The shared-element layers are created per flight by lib/shared-transition.ts.)
    <div ref={layer} className="page-transition pointer-events-none fixed inset-0 z-[1300]" aria-hidden="true">
      <StairReveal ref={stair} direction="up" columns={6} mobileColumns={4} color="var(--ink)" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="mask">
          <span ref={label} className="ui-label block text-ivory">
            {labelText}
          </span>
        </span>
      </div>
    </div>,
    document.body,
  );
}
