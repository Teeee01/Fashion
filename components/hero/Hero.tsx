"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Flip, gsap } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import {
  getIntro,
  isSettledLayout,
  registerIntroTimeline,
  registerSettleRequest,
  setIntro,
  useIntro,
  type IntroMode,
} from "@/lib/intro";
import { SCROLL_MEMORY_KEY } from "@/lib/intro-key";
import { NAV_OFFSET, useLenis } from "@/components/SmoothScroll";
import { ribbonState } from "@/lib/ribbon-state";
import Monogram, { MONOGRAM_SIZE } from "./Monogram";
import RibbonStage from "./RibbonStage";

/* Entrance timing, in seconds from the hero's own start (0.4s into the
   staircase; add 0.4 for real time from the start of the reveal):
     nav links stagger in .................... 0
     a 1px "needle" line grows at the centre .. 0.15  (0.6s)
     the M traces itself, stroke by stroke .... 0.55  (1.1s; the needle fades)
       while rising 30px and settling 1.08 → 1
     captions rise ............................ 0.6
     ribbon fades in, background warms ........ 0.8   (1.2s)
     ink washes up through the letter ......... 1.9   (0.7s; outline fades)
     a thin shine crosses it once ............. 2.6   (0.6s) → done ≈ 3.2s */
const AT = {
  nav: 0,
  needle: 0.15,
  trace: 0.55,
  captions: 0.6,
  ribbon: 0.8,
  wash: 1.9,
  shine: 2.6,
};
const TRACE = { total: 1.1, stagger: 0.12 }; // four strokes, 0.12s apart, 1.1s in all

/** Only the nav items showing at this screen size (links on desktop, MENU on mobile). */
const visible = (selector: string) =>
  gsap.utils.toArray<HTMLElement>(selector).filter((el) => el.getClientRects().length > 0);

const LEFT_LINES = ["Garments shaped slowly,", "worn for years."];
const RIGHT_LINES = ["Discover the new collection, designed to feel", "like a second skin."];

export default function Hero() {
  const monogram = useRef<SVGSVGElement>(null);
  const ribbon = useRef<HTMLDivElement>(null);
  const captions = useRef<HTMLDivElement>(null);
  const needle = useRef<HTMLSpanElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const cueLine = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const svg = monogram.current;
    const bands = svg ? Array.from(svg.querySelectorAll(".monogram-band")) : [];
    const strokes = svg?.querySelectorAll(".monogram-stroke") ?? [];
    const wash = svg?.querySelector(".monogram-wash") ?? null;
    const shine = svg?.querySelector(".monogram-shine") ?? null;
    const { width: W, height: H } = MONOGRAM_SIZE;
    // Before the entrance: no fill yet (the wash rectangle sits below the letter).
    gsap.set(wash, { attr: { y: H + 20 } });

    const build = (mode: IntroMode) => {
      const links = visible("header.nav .nav-item");
      const lines = captions.current?.querySelectorAll(".hero-line") ?? [];
      const html = document.documentElement;
      const pageBg = [html, document.body];
      const warmed = () => {
        html.classList.remove("is-intro-white");
        gsap.set(pageBg, { clearProps: "backgroundColor" });
      };

      const tl = gsap.timeline();

      if (mode === "reduced") {
        // Reduced motion: the finished M and everything else simply fade in, 0.3s.
        const fade = { autoAlpha: 1, duration: DURATION.reduced, ease: "none" };
        ribbonState.contrast = 1;
        gsap.set(links, { y: 0 });
        gsap.set(lines, { y: 0, yPercent: 0 });
        gsap.set(strokes, { strokeDashoffset: 0, opacity: 0 });
        gsap.set(wash, { attr: { y: 0 } });
        gsap.set(needle.current, { autoAlpha: 0 });
        return tl
          .fromTo([...links, svg, ...lines, ribbon.current], { autoAlpha: 0 }, fade, 0)
          .fromTo(pageBg, { backgroundColor: "#FFFFFF" }, { backgroundColor: "#F2F1EE", duration: DURATION.reduced, ease: "none", onComplete: warmed }, 0);
      }

      // 1 · Nav links, one by one, left to right.
      tl.fromTo(
        links,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: DURATION.ui, ease: EASE.text, stagger: STAGGER.nav },
        AT.nav,
      );

      // 2a · A 1px vertical hairline grows from the centre — needle and thread.
      tl.fromTo(
        needle.current,
        { scaleY: 0, autoAlpha: 1 },
        { scaleY: 1, duration: 0.6, ease: EASE.big, transformOrigin: "50% 50%" },
        AT.needle,
      );

      // 2b · The M traces itself along it, stroke by stroke (left stem → left
      // diagonal → right diagonal → right stem), as the needle fades away.
      const each = TRACE.total - TRACE.stagger * (bands.length - 1);
      bands.forEach((band, i) => {
        tl.fromTo(
          band.querySelectorAll(".monogram-stroke"),
          { strokeDashoffset: 1, opacity: 1 },
          // autoRound off: the offset runs 1 → 0, so whole-pixel rounding would snap it.
          { strokeDashoffset: 0, duration: each, ease: "power2.inOut", autoRound: false },
          AT.trace + i * TRACE.stagger,
        );
      });
      tl.to(needle.current, { autoAlpha: 0, duration: 0.5, ease: EASE.text }, AT.trace + 0.35);

      // 2c · While it draws, the letter rises gently and settles from 1.08 → 1.
      tl.fromTo(svg, { y: 30, scale: 1.08 }, { y: 0, scale: 1, duration: TRACE.total + 0.2, ease: EASE.text }, AT.trace);

      // 3 · Caption lines rise from behind their masks.
      tl.fromTo(
        lines,
        { y: 0, yPercent: 100 },
        { yPercent: 0, duration: 0.8, ease: EASE.text, stagger: STAGGER.lines },
        AT.captions,
      );

      // 4 · Ribbon fades in, gains contrast and settles; background warms.
      tl.fromTo(
        ribbon.current,
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE.text },
        AT.ribbon,
      )
        .fromTo(ribbonState, { contrast: 0 }, { contrast: 1, duration: 1.2, ease: EASE.text }, AT.ribbon)
        .fromTo(
          pageBg,
          { backgroundColor: "#FFFFFF" },
          { backgroundColor: "#F2F1EE", duration: 1.2, ease: EASE.text, onComplete: warmed },
          AT.ribbon,
        );

      // 2d · Ink washes up through the letter, bottom → top, like ink soaking
      // into fabric, while the outline fades away.
      tl.fromTo(wash, { attr: { y: H + 20 } }, { attr: { y: 0 }, duration: 0.7, ease: EASE.big }, AT.wash);
      tl.to(strokes, { opacity: 0, duration: 0.5, ease: EASE.text }, AT.wash + 0.1);

      // 2e · A thin light band sweeps once across the filled M.
      tl.fromTo(
        shine,
        { attr: { x: -W * 0.4 }, opacity: 0.55 },
        { attr: { x: W * 1.3 }, duration: 0.6, ease: "power2.inOut" },
        AT.shine,
      ).set(shine, { opacity: 0 });

      return tl;
    };

    // Coming back to the home page after the intro has already played
    // (e.g. from a collection page): show the hero in its settled state.
    if (getIntro().phase === "settled") {
      ribbonState.contrast = 1;
      gsap.set(strokes, { opacity: 0 });
      gsap.set(wash, { attr: { y: 0 } });
      gsap.set(needle.current, { autoAlpha: 0 });
      gsap.set(ribbon.current, { autoAlpha: 1, x: window.innerWidth * 0.04, y: window.innerHeight * 0.06 });
      gsap.set(captions.current, { autoAlpha: 0 });
    }

    return registerIntroTimeline(build);
  }, []);

  // ── After the entrance: hold until the first scroll ─────────────────
  // The hero stays in its full state (scroll locked) with a SCROLL cue.
  // The first downward scroll intent plays the settle AND glides the page
  // to the Manifesto; scrolling back up at the very top reverses it.
  const { phase } = useIntro();
  const lenis = useLenis();
  const mode = useRef<"idle" | "hero" | "busy" | "settled">("idle");
  const anims = useRef<gsap.core.Animation[]>([]);
  const cueLoop = useRef<gsap.core.Timeline | null>(null);
  const armed = useRef(false);
  const teardown = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (phase !== "done" || armed.current || !lenis) return;
    armed.current = true;
    const reduced = getIntro().mode === "reduced";
    const track = <T extends gsap.core.Animation>(a: T) => (anims.current.push(a), a);

    const links = () => visible("header.nav .nav-link.nav-item");
    const logo = () => document.querySelector<SVGSVGElement>(".nav-logo svg");
    const band = () => document.querySelector<HTMLElement>(".nav-band");
    const bags = () => visible("header.nav .nav-bag");
    const manifestoTop = () => {
      const el = document.querySelector<HTMLElement>("#house");
      return el ? el.getBoundingClientRect().top + lenis.scroll : window.innerHeight;
    };

    // ── SCROLL cue: fades in, its line draws downward and loops ──
    const showCue = (visibleNow: boolean, delay = 0) => {
      gsap.to(cue.current, { autoAlpha: visibleNow ? 1 : 0, duration: reduced ? DURATION.reduced : DURATION.ui, delay, ease: EASE.text, overwrite: "auto" });
      if (visibleNow && !reduced && !cueLoop.current) {
        cueLoop.current = gsap
          .timeline({ repeat: -1, repeatDelay: 0.25, delay })
          .fromTo(cueLine.current, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.9, ease: EASE.big })
          .to(cueLine.current, { scaleY: 0, transformOrigin: "50% 100%", duration: 0.9, ease: EASE.big });
      }
      if (!visibleNow) {
        cueLoop.current?.kill();
        cueLoop.current = null;
      }
    };

    // ── The settle: captions out, M → nav logo (Flip), links cluster (Flip),
    //    frosted band in, ribbon drifts. Returns its timeline. ──
    const playSettle = () => {
      const ls = links();
      const lg = logo();
      const monogramState = Flip.getState(monogram.current);
      const linkState = Flip.getState(ls);
      flushSync(() => setIntro({ phase: "settling" }));
      const tl = track(gsap.timeline());
      if (reduced) {
        const half = DURATION.reduced / 2;
        return tl
          .to([captions.current, monogram.current], { autoAlpha: 0, duration: half, ease: "none" }, 0)
          .fromTo([lg, ...ls, band(), ...bags()], { autoAlpha: 0 }, { autoAlpha: 1, duration: half, ease: "none" }, half);
      }
      tl.to(captions.current, { opacity: 0, y: -8, duration: 0.4, ease: EASE.text }, 0);
      if (lg) tl.add(Flip.from(monogramState, { targets: lg, scale: true, duration: 0.9, ease: EASE.big }), 0.1);
      if (ls.length) tl.add(Flip.from(linkState, { duration: 0.55, ease: EASE.big, stagger: STAGGER.nav }), 0.15);
      tl.to(ribbon.current, { x: window.innerWidth * 0.04, y: window.innerHeight * 0.06, duration: 0.9, ease: EASE.big }, 0.2);
      tl.fromTo(band(), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: EASE.text }, 0.3);
      tl.fromTo(bags(), { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.ui, ease: EASE.text }, 0.6);
      return tl;
    };

    // Wait until the wheel/touch has been quiet for a moment, so trackpad
    // momentum from the flick can't carry the page past the Manifesto.
    let lastInput = 0;
    const whenQuiet = (fn: () => void) => {
      const check = () => (performance.now() - lastInput > 220 ? fn() : track(gsap.delayedCall(0.1, check)));
      check();
    };

    const finishSettled = () => {
      mode.current = "settled";
      setIntro({ phase: "settled" }); // unlocks Lenis
    };

    // ── First scroll (or a link): settle and land on the Manifesto / target ──
    const settle = (target?: HTMLElement | null) => {
      if (mode.current !== "hero") return;
      mode.current = "busy";
      showCue(false);
      const tl = playSettle();
      if (reduced) {
        // No snapping: cross-fade into the settled layout and let the page scroll.
        tl.eventCallback("onComplete", () => {
          finishSettled();
          if (target) lenis.scrollTo(target, { immediate: true, force: true, offset: -NAV_OFFSET });
        });
        return;
      }
      const dest = target ? target.getBoundingClientRect().top + lenis.scroll - NAV_OFFSET : manifestoTop();
      let scrolled = false;
      let settled = false;
      const maybeDone = () => scrolled && settled && whenQuiet(finishSettled);
      tl.eventCallback("onComplete", () => {
        settled = true;
        maybeDone();
      });
      // The glide runs with Lenis still stopped (so no wheel or trackpad
      // momentum can add to it); afterwards Lenis is synced to where we landed.
      const from = { y: window.scrollY };
      track(
        gsap.to(from, {
          y: dest,
          duration: 1.2,
          ease: EASE.big,
          onUpdate: () => window.scrollTo(0, from.y),
          onComplete: () => {
            lenis.scrollTo(dest, { immediate: true, force: true });
            scrolled = true;
            maybeDone();
          },
        }),
      );
    };

    // ── Back at the very top, scrolling up: return to the hero ──
    const unsettle = () => {
      if (mode.current !== "settled" || reduced) return;
      mode.current = "busy";
      lenis.stop();
      lenis.scrollTo(0, { immediate: true, force: true });
      const lg = logo();
      const ls = links();
      const logoState = lg ? Flip.getState(lg) : null;
      const linkState = Flip.getState(ls);
      flushSync(() => setIntro({ phase: "done" }));
      const tl = track(gsap.timeline({ onComplete: () => whenQuiet(() => { mode.current = "hero"; showCue(true); }) }));
      if (logoState) tl.add(Flip.from(logoState, { targets: monogram.current, scale: true, duration: 0.9, ease: EASE.big }), 0);
      if (ls.length) tl.add(Flip.from(linkState, { duration: 0.55, ease: EASE.big, stagger: STAGGER.nav }), 0.05);
      tl.to(ribbon.current, { x: 0, y: 0, duration: 0.9, ease: EASE.big }, 0.1);
      tl.to(band(), { autoAlpha: 0, duration: 0.5, ease: EASE.text }, 0.1);
      tl.to(captions.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE.text }, 0.4);
    };

    // ── Scroll intent: wheel/trackpad, touch swipes, keyboard ──
    const down = () => (mode.current === "hero" ? settle() : undefined);
    // The real scroll position: touch scrolling is native, so Lenis may lag behind it.
    const up = () => (mode.current === "settled" && window.scrollY <= 2 ? unsettle() : undefined);
    const onWheel = (e: WheelEvent) => {
      lastInput = performance.now();
      if (e.deltaY > 2) down();
      else if (e.deltaY < -2) up();
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
      lastInput = performance.now();
    };
    const onTouchMove = (e: TouchEvent) => {
      lastInput = performance.now();
      if (touchY === null) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (dy > 24) {
        touchY = null;
        down();
      } else if (dy < -24) {
        touchY = null;
        up();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName))) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        if (mode.current === "hero") e.preventDefault();
        down();
      } else if (["ArrowUp", "PageUp", "Home"].includes(e.key)) up();
    };

    // ── Arriving mid-page (refresh or a deep link): skip the hero state ──
    let restore: HTMLElement | number | null = null;
    const hashTarget = location.hash ? document.querySelector<HTMLElement>(decodeURIComponent(location.hash)) : null;
    if (hashTarget) restore = hashTarget;
    else {
      try {
        const saved = Number(sessionStorage.getItem(SCROLL_MEMORY_KEY + location.pathname) ?? 0);
        sessionStorage.removeItem(SCROLL_MEMORY_KEY + location.pathname);
        if (saved > window.innerHeight * 0.5) restore = saved;
      } catch {
        // No storage: start at the hero.
      }
    }

    mode.current = "hero";
    if (restore !== null) {
      mode.current = "busy";
      const tl = playSettle();
      tl.progress(1);
      finishSettled();
      requestAnimationFrame(() =>
        lenis.scrollTo(restore as HTMLElement | number, {
          immediate: true,
          force: true,
          offset: typeof restore === "number" ? 0 : -NAV_OFFSET,
        }),
      );
    } else {
      showCue(true, 0.6);
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    const unregister = registerSettleRequest((target) => settle(target));

    // These listeners must outlive the phase changes they cause, so they
    // are removed when the hero unmounts, not when the phase changes.
    teardown.current = () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      unregister();
    };
  }, [phase, lenis]);

  useEffect(
    () => () => {
      teardown.current?.();
      anims.current.forEach((a) => a.kill());
      cueLoop.current?.kill();
    },
    [],
  );

  const monogramHidden = isSettledLayout(phase);

  return (
    <section className="hero relative h-svh overflow-hidden" aria-label="Maison Sève">

      {/* Fixed, so the ribbon stays on screen through the manifesto below.
          20% taller than the screen (10vh spare above and below) so it still
          runs off both edges after it drifts down. */}
      <RibbonStage ref={ribbon} className="fixed inset-x-0 -top-[10svh] h-[120svh]" />

      {/* Centring lives on wrappers, so GSAP can scale and lift the
          elements inside without disturbing it. */}
      {/* The needle: a 1px hairline the M traces itself along. */}
      <div aria-hidden="true" className="hero-fg pointer-events-none absolute left-1/2 top-1/2 h-[34vh] w-px -translate-x-1/2 -translate-y-1/2">
        <span ref={needle} className="hero-needle block h-full w-full bg-ink" />
      </div>

      {/* The M: exactly centred, in front of the ribbon's middle. */}
      <div className="hero-fg absolute left-1/2 top-1/2 h-[22vh] -translate-x-1/2 -translate-y-1/2">
        <Monogram
          ref={monogram}
          flipId="monogram"
          decorative
          className={`hero-monogram block h-full w-auto ${monogramHidden ? "invisible" : ""}`}
        />
      </div>

      {/* SCROLL cue: shown while the hero holds; its line draws down and loops. */}
      <div
        ref={cue}
        aria-hidden="true"
        className="scroll-cue hero-fg pointer-events-none absolute left-1/2 top-[68svh] flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-pad md:top-auto"
      >
        <span className="ui-label">Scroll</span>
        <span className="relative block h-8 w-px overflow-hidden">
          <span ref={cueLine} className="absolute inset-0 bg-ink" style={{ transform: "scaleY(0)" }} />
        </span>
      </div>

      <div
        ref={captions}
        className="hero-fg absolute inset-x-pad bottom-pad flex flex-col gap-5 text-[13px] leading-[1.45] text-ink md:flex-row md:items-end md:justify-between"
      >
        <p>
          {LEFT_LINES.map((line) => (
            <span key={line} className="mask">
              <span className="hero-line block">{line}</span>
            </span>
          ))}
        </p>
        <div className="text-right">
          <p>
            {RIGHT_LINES.map((line) => (
              <span key={line} className="mask">
                <span className="hero-line block">{line}</span>
              </span>
            ))}
          </p>
          <span className="mask mt-2">
            <span className="hero-line block">
              <Link
                href="/#collections"
                className="underline decoration-1 underline-offset-[3px] transition-colors duration-500 hover:text-stone"
              >
                View collection
              </Link>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
