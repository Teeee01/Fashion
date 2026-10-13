"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { gsap } from "@/lib/gsap";
import { DURATION, prefersReducedMotion } from "@/lib/motion";
import { clipRise } from "@/lib/reveal";
import { getTransition, usePageReveal, useTransitionState } from "@/lib/transition";
import EditorialImage from "@/components/EditorialImage";

type Img = { src: string; alt: string };

/**
 * This product's images, and nothing else.
 * Desktop: a fixed viewer (it doesn't scroll with the page; see
 * ProductPage). One large image fills it, with the thumbnail strip
 * beside it; a thumbnail or the ← → arrows crossfade to that image
 * (0.5s). Clicking the image opens the full-screen zoom.
 * Phones: a swipeable carousel with dots.
 */
export default function ProductGallery({ images, onZoom }: { images: Img[]; onZoom: (i: number) => void }) {
  const frame = useRef<HTMLDivElement>(null);
  const layers = useRef<HTMLDivElement>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [slide, setSlide] = useState(0);
  const transition = useTransitionState();
  // While a card image is flying into place, keep the real image hidden underneath.
  const flying = transition.kind === "shared" && transition.phase !== "idle";
  const count = images.length;

  // Arriving by the flying-image transition: the image is already in place,
  // so skip its own reveal (it must never be clipped at the hand-over).
  useLayoutEffect(() => {
    const t = getTransition();
    if (t.kind === "shared" && t.phase !== "idle") gsap.set(frame.current, { clipPath: "inset(0% 0% 0% 0%)" });
  }, []);

  usePageReveal(() => {
    if (getComputedStyle(frame.current!).clipPath.startsWith("inset(0")) return;
    const reveal = clipRise(frame.current, layers.current, prefersReducedMotion());
    reveal.play();
    return () => void reveal.kill();
  });

  // Crossfade: the chosen image fades in over the others (0.5s).
  useLayoutEffect(() => {
    const els = gsap.utils.toArray<HTMLElement>(".viewer-layer", layers.current);
    const d = prefersReducedMotion() ? DURATION.reduced : 0.5;
    els.forEach((el, i) => gsap.to(el, { autoAlpha: i === active ? 1 : 0, duration: d, ease: "power2.inOut", overwrite: true }));
  }, [active]);

  const go = (i: number) => setActive(((i % count) + count) % count);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(active - 1);
    }
  };

  const onCarouselScroll = () => {
    const el = carousel.current;
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      {/* Desktop: thumbnails + one large image */}
      <div className="hidden h-full gap-gutter md:flex" onKeyDown={onKey}>
        <ol className="flex w-[64px] shrink-0 flex-col gap-2 overflow-y-auto" aria-label="Images" data-lenis-prevent>
          {images.map((im, i) => (
            <li key={im.src + i}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={active === i}
                className={`relative block aspect-[3/4] w-full overflow-hidden bg-loader-grey outline-offset-2 transition-opacity duration-500 ${
                  active === i ? "opacity-100 outline outline-1 outline-ink" : "opacity-50 hover:opacity-100"
                }`}
              >
                <EditorialImage src={im.src} alt="" sizes="64px" />
              </button>
            </li>
          ))}
        </ol>

        <div
          ref={frame}
          className={`gallery-media relative h-full flex-1 overflow-hidden bg-loader-grey ${flying ? "invisible" : ""}`}
          data-shared-target
        >
          <div ref={layers} className="absolute inset-0">
            {images.map((im, i) => (
              <div key={im.src + i} className={`viewer-layer absolute inset-0 ${i === 0 ? "" : "invisible opacity-0"}`} aria-hidden={i !== active}>
                <EditorialImage src={im.src} alt={im.alt} sizes="(max-width: 767px) 100vw, 52vw" priority={i === 0} />
              </div>
            ))}
          </div>
          {/* The whole image opens the zoom. */}
          <button type="button" onClick={() => onZoom(active)} aria-label={`Zoom: ${images[active].alt}`} className="absolute inset-0 block" data-cursor="zoom" />
          {count > 1 && (
            <div className="absolute bottom-4 right-4 flex items-center bg-ivory">
              <button type="button" onClick={() => go(active - 1)} aria-label="Previous image" className="ui-label h-10 w-10 hover:bg-ink hover:text-ivory">
                ←
              </button>
              <span className="ui-label w-14 text-center tabular-nums" aria-live="polite">
                {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              <button type="button" onClick={() => go(active + 1)} aria-label="Next image" className="ui-label h-10 w-10 hover:bg-ink hover:text-ivory">
                →
              </button>
            </div>
          )}
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
