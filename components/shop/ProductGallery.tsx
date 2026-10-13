"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { EASE, prefersReducedMotion } from "@/lib/motion";
import { clipRise } from "@/lib/reveal";
import { useTransitionState } from "@/lib/transition";
import EditorialImage from "@/components/EditorialImage";
import { NAV_OFFSET, useLenis } from "@/components/SmoothScroll";

type Img = { src: string; alt: string };

/**
 * Desktop: images stacked vertically, each revealed with the clip-path
 * rise, beside a sticky column of thumbnails that tracks the image in view
 * (click one to glide to it). Phones: a swipeable carousel with dots.
 * Clicking any image opens the zoom viewer.
 */
export default function ProductGallery({ images, onZoom }: { images: Img[]; onZoom: (i: number) => void }) {
  const stack = useRef<HTMLDivElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [slide, setSlide] = useState(0);
  const lenis = useLenis();
  const transition = useTransitionState();
  // While a card image is flying into place, keep the real first image hidden underneath.
  const flying = transition.kind === "shared" && transition.phase !== "idle";

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const frames = gsap.utils.toArray<HTMLElement>(".gallery-frame", stack.current);
      frames.forEach((frame, i) => {
        // Reveal each image as it comes into view (the first is already on screen).
        const reveal = clipRise(frame.querySelector(".gallery-media"), frame.querySelector(".gallery-photo"), reduced);
        ScrollTrigger.create({ trigger: frame, start: "top 90%", once: true, onEnter: () => reveal.play() });
        // Track which image is in view for the thumbnails.
        ScrollTrigger.create({
          trigger: frame,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });
    }, stack);
    return () => ctx.revert();
  }, []);

  const goTo = (i: number) => {
    const el = stack.current?.querySelectorAll<HTMLElement>(".gallery-frame")[i];
    if (!el || !lenis) return;
    lenis.scrollTo(el, { offset: -NAV_OFFSET - 38, duration: prefersReducedMotion() ? 0 : 1.2, easing: gsap.parseEase(EASE.big) });
  };

  const onCarouselScroll = () => {
    const el = carousel.current;
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      {/* Desktop: thumbnails + stacked images */}
      <div className="hidden gap-gutter md:flex">
        <ol className="sticky top-[110px] flex h-fit w-[56px] shrink-0 flex-col gap-2" aria-label="Images">
          {images.map((im, i) => (
            <li key={im.src + i}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={active === i}
                className={`relative block aspect-[3/4] w-full overflow-hidden bg-loader-grey outline-offset-2 transition-opacity duration-500 ${
                  active === i ? "opacity-100 outline outline-1 outline-ink" : "opacity-50 hover:opacity-100"
                }`}
              >
                <EditorialImage src={im.src} alt="" sizes="56px" />
              </button>
            </li>
          ))}
        </ol>
        <div ref={stack} className="flex flex-1 flex-col gap-gutter">
          {images.map((im, i) => (
            <button
              key={im.src + i}
              type="button"
              onClick={() => onZoom(i)}
              aria-label={`Zoom: ${im.alt}`}
              className={`gallery-frame block text-left ${i === 0 && flying ? "invisible" : ""}`}
              data-cursor="zoom"
              data-shared-target={i === 0 ? "" : undefined}
            >
              <div className={`gallery-media relative aspect-[3/4] overflow-hidden bg-loader-grey ${i === 0 ? "gallery-first" : ""}`}>
                <div className="gallery-photo absolute inset-0">
                  <EditorialImage src={im.src} alt={im.alt} sizes="(max-width: 767px) 100vw, 52vw" priority={i === 0} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Phones: swipe carousel with dots */}
      <div className="md:hidden">
        <div ref={carousel} onScroll={onCarouselScroll} className="product-carousel -mx-pad flex snap-x snap-mandatory overflow-x-auto">
          {images.map((im, i) => (
            <button
              key={im.src + i}
              type="button"
              onClick={() => onZoom(i)}
              aria-label={`Zoom: ${im.alt}`}
              className={`relative aspect-[3/4] w-screen shrink-0 snap-start overflow-hidden bg-loader-grey ${i === 0 && flying ? "invisible" : ""}`}
              data-shared-target={i === 0 ? "" : undefined}
            >
              <EditorialImage src={im.src} alt={im.alt} sizes="100vw" priority={i === 0} />
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
          {images.map((_, i) => (
            <span key={i} className={`h-[5px] w-[5px] transition-colors duration-500 ${slide === i ? "bg-ink" : "bg-hairline"}`} />
          ))}
        </div>
      </div>
    </>
  );
}
