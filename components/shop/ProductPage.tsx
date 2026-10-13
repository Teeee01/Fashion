"use client";

import Link from "next/link";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { usePageReveal, useTransitionState } from "@/lib/transition";
import { bag } from "@/lib/bag";
import { formatPrice, type Product, type Season } from "@/lib/products";
import EditorialImage from "@/components/EditorialImage";

/* ──────────────────────────────────────────────────────────────
   /product/[slug]
   Left: the images, stacked. The first is the shared-element target
   that a collection card's image expands into. Right: a sticky panel
   with name, price, sizes (square, hairline; selected = filled ink),
   "Add to bag" and a details accordion that opens on the house ease
   while its plus turns into a minus.
   ────────────────────────────────────────────────────────────── */

export default function ProductPage({ product, season }: { product: Product; season: Season }) {
  const panel = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [needSize, setNeedSize] = useState(false);
  const transition = useTransitionState();
  // While a card image is flying into place, keep the real one hidden underneath.
  const flying = transition.kind === "shared" && transition.phase !== "idle";

  useLayoutEffect(() => {
    gsap.set(panel.current?.querySelectorAll(".product-rise") ?? [], { yPercent: 100 });
  }, []);

  usePageReveal(() => {
    const reduced = prefersReducedMotion();
    const rise = panel.current?.querySelectorAll(".product-rise") ?? [];
    const tl = gsap.timeline({ delay: transition.kind === "shared" ? 0.3 : 0.1 });
    if (reduced) {
      gsap.set(rise, { yPercent: 0 });
      tl.fromTo(panel.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
    } else {
      tl.to(rise, { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines });
    }
    return () => void tl.kill();
  });

  const addToBag = () => {
    if (!size) {
      setNeedSize(true);
      return;
    }
    setNeedSize(false);
    bag.add(product.slug, size);
  };

  const sections = [
    { title: "Description", body: product.description },
    { title: "Composition & care", body: product.composition },
    { title: "Size & fit", body: product.fit },
    { title: "Shipping & returns", body: "Complimentary shipping on every order. Returns accepted within 30 days, unworn and with tags." },
  ];

  return (
    <main className="grid-12 gap-y-12 pb-[16vh] pt-[96px] md:pt-[110px]">
      {/* Images, stacked */}
      <div className="col-span-12 flex flex-col gap-gutter md:col-span-7">
        {product.images.map((im, i) => (
          <div
            key={im.src + i}
            className={`relative aspect-[3/4] overflow-hidden bg-loader-grey ${i === 0 && flying ? "invisible" : ""}`}
            data-shared-target={i === 0 ? "" : undefined}
            data-cursor="view"
          >
            <EditorialImage src={im.src} alt={im.alt} sizes="(max-width: 767px) 100vw, 58vw" priority={i === 0} />
          </div>
        ))}
      </div>

      {/* Sticky info panel */}
      <div className="col-span-12 md:col-span-4 md:col-start-9">
        <div ref={panel} className="md:sticky md:top-[110px]">
          <p className="ui-label mask text-stone">
            <span className="product-rise block">
              <Link href={`/collections/${season.slug}`} className="nav-link relative">
                Collection — {season.short}
              </Link>
            </span>
          </p>
          <h1 className="mask mt-6 font-display text-[36px] leading-[1.05] tracking-[-0.01em] md:text-[44px]">
            <span className="product-rise block">{product.name}</span>
          </h1>
          <p className="ui-label mask mt-4">
            <span className="product-rise block">{formatPrice(product.price)}</span>
          </p>

          {/* Sizes */}
          <fieldset className="mt-10">
            <legend className="ui-label mask mb-4 text-stone">
              <span className="product-rise block">Size</span>
            </legend>
            <div className="mask">
              <div className="product-rise flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={size === s}
                    onClick={() => {
                      setSize(s);
                      setNeedSize(false);
                    }}
                    className={`size-btn ui-label min-w-[48px] border px-3 py-3 ${
                      size === s ? "border-ink bg-ink text-ivory" : "border-hairline text-ink hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <p className="ui-label mt-3 min-h-[1.2em] text-stone" role="status" aria-live="polite">
              {needSize ? "Please choose a size." : ""}
            </p>
          </fieldset>

          <div className="mask mt-4">
            <button type="button" onClick={addToBag} className="product-rise ui-label block w-full bg-ink py-4 text-ivory transition-opacity duration-500 hover:opacity-85">
              Add to bag
            </button>
          </div>

          {/* Details */}
          <div className="mask mt-12">
            <div className="product-rise">
              {sections.map((sec) => (
                <AccordionItem key={sec.title} title={sec.title}>
                  {sec.body}
                </AccordionItem>
              ))}
              <div className="h-px bg-hairline" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/** One accordion row: height animates on the house ease; + becomes −. */
function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const id = useId();

  const toggle = () => {
    const next = !open;
    setOpen(next);
    const reduced = prefersReducedMotion();
    const d = reduced ? DURATION.reduced : 0.6;
    const ease = reduced ? "none" : EASE.big;
    gsap.to(body.current, { height: next ? "auto" : 0, duration: d, ease, overwrite: "auto" });
    // The plus's vertical bar folds flat, leaving a minus.
    gsap.to(bar.current, { scaleY: next ? 0 : 1, duration: d, ease, overwrite: "auto" });
  };

  return (
    <div className="border-t border-hairline">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
      >
        <span className="ui-label">{title}</span>
        <span className="relative h-[9px] w-[9px]" aria-hidden="true">
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink" />
          <span ref={bar} className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ink" />
        </span>
      </button>
      <div ref={body} id={id} role="region" className="h-0 overflow-hidden" aria-hidden={!open}>
        <p className="body-copy pb-5 text-stone">{children}</p>
      </div>
    </div>
  );
}
