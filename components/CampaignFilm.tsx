"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";
import StairReveal, { type StairRevealHandle } from "./StairReveal";
import { useLenis } from "./SmoothScroll";

/* ──────────────────────────────────────────────────────────────
   (09) Campaign Film — a 300vh section with a sticky stage.
   A muted looping film plays in a small centred window (40vw × 24vw;
   wider on phones). Scrubbed by scroll, the window opens out to full
   screen over the first 60%. At full screen a "PLAY FILM" button
   appears and the cursor turns into a 72px "PLAY" disc. Clicking opens
   the film full screen with sound: ink columns grow down (StairReveal),
   then the player fades in. Escape or CLOSE plays it back out.
   ────────────────────────────────────────────────────────────── */

const FILM = {
  mp4: "/campaign.mp4",
  webm: "/campaign.webm",
  poster: "/campaign-poster.jpg",
  title: "Volume, then silence — Autumn–Winter 2026",
};

/** Window size at the start, as fractions of the screen width. */
const WINDOW = { desktop: { w: 0.4, h: 0.24 }, mobile: { w: 0.8, h: 0.48 } };
/** Scroll fraction at which the window is fully open. */
const FULL_AT = 0.6;

function FilmSources() {
  return (
    <>
      <source src={FILM.mp4} type="video/mp4" />
      <source src={FILM.webm} type="video/webm" />
    </>
  );
}

export default function CampaignFilm() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const loop = useRef<HTMLVideoElement>(null);
  const kicker = useRef<HTMLDivElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const [full, setFull] = useState(false);
  const [open, setOpen] = useState(false);

  // ── Scroll: the window opens out to full screen ──
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add({ reduced: "(prefers-reduced-motion: reduce)", full: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const { reduced } = context.conditions as { reduced: boolean };

      if (reduced) {
        // Reduced motion: the film sits full screen and doesn't autoplay.
        gsap.set(media.current, { clipPath: "inset(0px 0px 0px 0px)" });
        gsap.set(kicker.current, { autoAlpha: 0 });
        loop.current?.pause();
        setFull(true);
        return;
      }

      const frame = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const size = vw < 768 ? WINDOW.mobile : WINDOW.desktop;
        const x = (vw * (1 - size.w)) / 2;
        const y = Math.max((vh - vw * size.h) / 2, 0);
        return `inset(${y}px ${x}px ${y}px ${x}px)`;
      };

      // The loop only downloads and plays while the section is on screen.
      ScrollTrigger.create({
        trigger: section.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          const v = loop.current;
          if (!v) return;
          if (self.isActive && !openRef.current) v.play().catch(() => {});
          else v.pause();
        },
      });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => setFull(self.progress >= FULL_AT),
        },
      });
      tl.set({}, {}, 1);
      tl.fromTo(media.current, { clipPath: frame }, { clipPath: "inset(0px 0px 0px 0px)", duration: FULL_AT, ease: EASE.big }, 0)
        .fromTo(loop.current, { scale: 1.2 }, { scale: 1, duration: FULL_AT, ease: EASE.big }, 0)
        .to(kicker.current, { autoAlpha: 0, duration: 0.2 }, 0);
    }, section);
    return () => mm.revert();
  }, []);

  // ── The PLAY FILM button appears only at full screen ──
  useEffect(() => {
    const reduced = prefersReducedMotion();
    gsap.to(playBtn.current, {
      autoAlpha: full ? 1 : 0,
      y: full || reduced ? 0 : 8,
      duration: reduced ? DURATION.reduced : DURATION.ui,
      ease: EASE.text,
      overwrite: "auto",
    });
  }, [full]);

  // The background loop rests while the full film is open (and resumes
  // afterwards only if the section is still on screen).
  const openRef = useRef(false);
  useEffect(() => {
    openRef.current = open;
    if (prefersReducedMotion()) return;
    const v = loop.current;
    if (!v) return;
    if (open) v.pause();
    else if (section.current) {
      const r = section.current.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) v.play().catch(() => {});
    }
  }, [open]);

  return (
    <section ref={section} id="film" aria-labelledby="film-label" className="relative h-[300svh] motion-reduce:h-svh">
      <div
        ref={stage}
        className="sticky top-0 h-svh overflow-hidden motion-reduce:static"
        data-cursor={full ? "play" : undefined}
        onClick={() => full && setOpen(true)}
      >
        <div ref={media} className="film-media absolute inset-0 bg-ink">
          <video
            ref={loop}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="none"
            poster={FILM.poster}
            aria-hidden="true"
          >
            <FilmSources />
          </video>
        </div>

        <div ref={kicker} className="pointer-events-none absolute inset-x-pad top-[112px] flex justify-between">
          <p id="film-label" className="ui-label" data-reveal="lines">
            (09) — Campaign Film
          </p>
          <p className="ui-label text-stone" data-reveal="lines">
            AW26
          </p>
        </div>

        <button
          ref={playBtn}
          type="button"
          className="film-play ui-label absolute bottom-[48px] left-1/2 -translate-x-1/2 text-ivory mix-blend-difference"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          tabIndex={full ? 0 : -1}
          aria-hidden={!full}
        >
          Play film
        </button>
      </div>

      <FilmPlayer open={open} onClose={() => setOpen(false)} returnFocus={playBtn} />
    </section>
  );
}

/* ── Full-screen player: ink columns down, then the film with sound ── */
function FilmPlayer({
  open,
  onClose,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  returnFocus: React.RefObject<HTMLButtonElement | null>;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const stair = useRef<StairRevealHandle>(null);
  const player = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const first = useRef(true);
  const [mounted, setMounted] = useState(false);
  const lenis = useLenis();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline();
    if (open) {
      lenis?.stop();
      gsap.set(panel.current, { visibility: "visible" });
      const cover = stair.current?.build("cover", { duration: 0.9, stagger: 0.06 });
      if (cover) tl.add(cover, 0);
      tl.fromTo(player.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? DURATION.reduced : 0.6, ease: EASE.text }, reduced ? ">" : ">-0.2");
      tl.call(() => {
        const v = video.current;
        if (v) {
          v.currentTime = 0;
          v.muted = false;
          v.play().catch(() => {
            // If the browser blocks sound, start muted rather than not at all.
            v.muted = true;
            v.play().catch(() => {});
          });
        }
        close.current?.focus({ preventScroll: true });
      });
    } else {
      video.current?.pause();
      tl.to(player.current, { autoAlpha: 0, duration: reduced ? DURATION.reduced / 2 : 0.4, ease: EASE.text });
      const uncover = stair.current?.build("uncover", { duration: 0.9, stagger: 0.06 });
      if (uncover) tl.add(uncover, reduced ? ">" : ">-0.1");
      tl.set(panel.current, { visibility: "hidden" });
      tl.call(() => {
        lenis?.start();
        returnFocus.current?.focus({ preventScroll: true });
      });
    }
    return () => void tl.kill();
  }, [open, lenis, returnFocus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panel}
      className="film-player fixed inset-0 z-[1200]"
      role="dialog"
      aria-modal="true"
      aria-label={FILM.title}
      inert={!open}
      aria-hidden={!open}
    >
      <StairReveal ref={stair} direction="down" columns={6} mobileColumns={4} color="var(--ink)" />
      <div ref={player} className="absolute inset-0 flex items-center justify-center opacity-0">
        <video ref={video} className="max-h-full w-full" controls playsInline preload="none" poster={FILM.poster}>
          <FilmSources />
        </video>
        <button
          ref={close}
          type="button"
          className="ui-label absolute right-pad top-[20px] text-ivory"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
