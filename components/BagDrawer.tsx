"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { bag, bagCount, useBag } from "@/lib/bag";
import { formatPrice, getProduct } from "@/lib/products";
import { getIntro } from "@/lib/intro";
import EditorialImage from "./EditorialImage";
import { useLenis } from "./SmoothScroll";

/**
 * The bag drawer: slides in from the right (0.7s, house ease) while the
 * page behind dims to 30% ink; then its items rise in, staggered.
 * Escape, the backdrop or CLOSE shut it.
 */
export default function BagDrawer() {
  const { items, open } = useBag();
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const dim = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const first = useRef(true);
  const lenis = useLenis();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (first.current) {
      first.current = false;
      if (!open) return;
    }
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline();
    if (open) {
      returnTo.current = document.activeElement as HTMLElement | null;
      lenis?.stop();
      gsap.set(root.current, { visibility: "visible" });
      if (reduced) {
        tl.set(panel.current, { x: 0, xPercent: 0 }).fromTo([dim.current, panel.current], { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
      } else {
        tl.fromTo(dim.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: EASE.text }, 0)
          .fromTo(panel.current, { x: 0, xPercent: 100, autoAlpha: 1 }, { xPercent: 0, duration: 0.7, ease: EASE.big }, 0)
          .fromTo(
            panel.current?.querySelectorAll(".bag-rise") ?? [],
            { y: 0, yPercent: 100 },
            { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines },
            0.45,
          );
      }
      tl.call(() => closeBtn.current?.focus({ preventScroll: true }));
    } else {
      if (reduced) tl.to([dim.current, panel.current], { autoAlpha: 0, duration: DURATION.reduced, ease: "none" });
      else
        tl.to(panel.current, { xPercent: 100, duration: 0.7, ease: EASE.big }, 0).to(dim.current, { autoAlpha: 0, duration: 0.6, ease: EASE.text }, 0.1);
      tl.set(root.current, { visibility: "hidden" });
      tl.call(() => {
        if (getIntro().phase === "settled") lenis?.start();
        returnTo.current?.focus({ preventScroll: true });
      });
    }
    return () => void tl.kill();
    // Items changing while open shouldn't replay the slide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && bag.close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  const lines = items.map((i) => ({ ...i, product: getProduct(i.slug) })).filter((l) => l.product);
  const total = lines.reduce((sum, l) => sum + (l.product?.price ?? 0) * l.qty, 0);

  return createPortal(
    <div ref={root} className="bag-root fixed inset-0 z-[1250]" inert={!open} aria-hidden={!open}>
      {/* The page behind dims to 30% ink. */}
      <div ref={dim} className="absolute inset-0 bg-ink/30" onClick={() => bag.close()} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className="bag-panel absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col bg-ivory px-pad pb-pad pt-[20px]"
      >
        <div className="flex items-center justify-between">
          <p className="ui-label">Bag ({bagCount(items)})</p>
          <button ref={closeBtn} type="button" className="nav-link ui-label relative" onClick={() => bag.close()}>
            Close
          </button>
        </div>

        <div className="mt-10 flex-1 overflow-y-auto" data-lenis-prevent>
          {lines.length === 0 ? (
            <p className="mask">
              <span className="bag-rise block font-display text-[28px] leading-[1.1]">Your bag is empty.</span>
            </p>
          ) : (
            <ul>
              {lines.map((l) => (
                <li key={`${l.slug}-${l.size}`} className="mask border-t border-hairline">
                  <div className="bag-rise flex gap-4 py-5">
                    <div className="relative aspect-[3/4] w-[84px] shrink-0 overflow-hidden bg-loader-grey">
                      <EditorialImage src={l.product!.images[0].src} alt={l.product!.images[0].alt} sizes="84px" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link href={`/product/${l.slug}`} className="font-display text-[20px] leading-[1.1]" onClick={() => bag.close()}>
                          {l.product!.name}
                        </Link>
                        <p className="ui-label mt-2 text-stone">
                          Size {l.size}
                          {l.qty > 1 ? ` · ×${l.qty}` : ""}
                        </p>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <p className="ui-label">{formatPrice(l.product!.price * l.qty)}</p>
                        <button type="button" className="nav-link ui-label relative text-stone" onClick={() => bag.remove(l.slug, l.size)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="mask mt-6">
            <div className="bag-rise border-t border-hairline pt-5">
              <div className="flex items-baseline justify-between">
                <p className="ui-label">Subtotal</p>
                <p className="ui-label">{formatPrice(total)}</p>
              </div>
              <button type="button" className="ui-label mt-5 w-full bg-ink py-4 text-ivory" disabled aria-disabled="true" title="Checkout isn't connected yet">
                Checkout
              </button>
              <p className="ui-label mt-3 text-center text-stone">Shipping and duties calculated at checkout</p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
