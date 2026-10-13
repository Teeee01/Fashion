"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, STAGGER } from "@/lib/motion";
import { LOOKS } from "@/lib/collection";
import { clipRise, riseLinesOnScroll } from "@/lib/reveal";
import EditorialImage from "@/components/EditorialImage";

/* ──────────────────────────────────────────────────────────────
   (02) New Collection
   Desktop: the headline rises line by line, then the section pins and
   the row (intro + looks) travels horizontally as you scroll down. Each
   look is revealed bottom → top (clip-path) as it comes into view while
   its photo settles from 1.2× to 1×; its caption rises after. A thin
   line at the bottom fills with progress.
   Mobile: no pinning; the headline sits above a swipeable row of looks
   that snaps to each one.
   ────────────────────────────────────────────────────────────── */

const HEADLINE = "The new collection";

export default function Collection() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        desktop: "(min-width: 768px)",
        mobile: "(max-width: 767px)",
        reduced: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { desktop, reduced } = context.conditions as { desktop: boolean; reduced: boolean };
        const cards = gsap.utils.toArray<HTMLElement>(".look", row.current);

        // ── One look's entrance (played once, when it comes into view) ──
        const revealLook = (card: HTMLElement) => {
          const lines = card.querySelectorAll(".look-cap-line");
          const tl = clipRise(card.querySelector(".look-media"), card.querySelector(".look-photo"), reduced);
          if (reduced) {
            gsap.set(lines, { y: 0, yPercent: 0 });
            return tl;
          }
          return tl.fromTo(
            lines,
            { y: 0, yPercent: 100 },
            { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines },
            0.5,
          );
        };

        // ── Headline: lines rise from their masks as the section arrives ──
        const split = riseLinesOnScroll(headline.current, reduced);

        let cleanup: (() => void) | undefined;

        if (desktop && !reduced) {
          // ── Pin and travel horizontally ──
          const distance = () => (track.current ? track.current.scrollWidth - window.innerWidth : 0);
          const travel = gsap.to(track.current, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: stage.current,
              pin: true,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: (self) => gsap.set(progress.current, { scaleX: self.progress }),
            },
          });

          // Looks already in view when the section arrives reveal as it
          // scrolls in; the rest reveal as the travel brings them on screen.
          cards.forEach((card, i) => {
            const reveal = revealLook(card);
            const left = card.getBoundingClientRect().left - (track.current?.getBoundingClientRect().left ?? 0);
            if (left < window.innerWidth * 0.9) {
              ScrollTrigger.create({
                trigger: stage.current,
                start: "top 55%",
                once: true,
                onEnter: () => reveal.delay(i * STAGGER.columns).play(),
              });
            } else {
              ScrollTrigger.create({
                trigger: card,
                containerAnimation: travel,
                start: "left 90%",
                once: true,
                onEnter: () => reveal.play(),
              });
            }
          });
        } else {
          // ── Phones (and reduced motion): a native swipe row; the progress line follows it ──
          cards.forEach((card, i) => {
            const reveal = revealLook(card);
            ScrollTrigger.create({
              trigger: row.current,
              start: "top 85%",
              once: true,
              onEnter: () => reveal.delay(i * STAGGER.columns).play(),
            });
          });
          const el = row.current!;
          const onRowScroll = () => {
            const max = el.scrollWidth - el.clientWidth;
            gsap.set(progress.current, { scaleX: max > 0 ? el.scrollLeft / max : 0 });
          };
          onRowScroll();
          el.addEventListener("scroll", onRowScroll, { passive: true });
          cleanup = () => el.removeEventListener("scroll", onRowScroll);
        }

        return () => {
          cleanup?.();
          split.revert();
        };
      },
      section,
    );

    document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => mm.revert();
  }, []);

  return (
    <section ref={section} id="collections" aria-labelledby="collection-title" className="collection relative">
      <div ref={stage} className="collection-stage relative overflow-hidden pb-[72px] pt-[96px] md:flex md:h-svh md:items-center md:py-0">
        <div ref={track} className="collection-track md:flex md:items-stretch md:gap-[2vw] md:px-pad">
          {/* Intro: first in the row on desktop, so it travels away with the looks. */}
          <div className="collection-intro mb-10 flex flex-col justify-between px-pad md:mb-0 md:shrink-0 md:px-0 md:pr-[4vw]">
            <p className="ui-label mb-8 md:mb-0" data-reveal="lines">(02) New Collection</p>
            <div>
              <h2 id="collection-title" ref={headline} className="headline">
                {HEADLINE}
              </h2>
              <p className="body-copy mt-6 text-stone" data-reveal="lines">Autumn Winter 2026. Eight looks for women and men, in wool, silk and linen.</p>
              <span className="mask mt-8">
                <Link href="/collections/aw26" className="btn-ink ui-label inline-block px-8 py-4 text-center" data-reveal="block">
                  <span>See the whole collection</span>
                </Link>
              </span>
            </div>
          </div>

          <div ref={row} className="look-row flex gap-[2vw]">
            {LOOKS.map((look) => (
              <article key={look.number} className="look shrink-0">
                <Link href={`/product/${look.slug}`} className="block" data-transition="shared" data-cursor="view">
                  <div className="look-media relative aspect-[3/4] overflow-hidden bg-loader-grey" data-shared-source>
                    <div className="look-photo absolute inset-0">
                      <div className="look-zoom absolute inset-0">
                        <EditorialImage
                          src={look.src}
                          alt={look.alt}
                          label={`Look ${look.number}`}
                          sizes="(max-width: 767px) 78vw, 28vw"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ui-label mt-3">
                    <span className="mask">
                      <span className="look-cap-line block text-stone">Look {look.number}</span>
                    </span>
                    <span className="mask">
                      <span className="look-cap-line block">{look.name}</span>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>

        {/* Progress: a hairline that fills left → right. */}
        <div className="pointer-events-none absolute inset-x-pad bottom-[32px] h-px bg-hairline" aria-hidden="true">
          <div ref={progress} className="h-full origin-left bg-ink" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
