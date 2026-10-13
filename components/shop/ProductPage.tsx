"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { navigate, usePageReveal } from "@/lib/transition";
import { useBag } from "@/lib/bag";
import { useCurrency } from "@/lib/currency";
import {
  CATEGORY_LABEL,
  alsoLike,
  deliveryCopy,
  getProduct,
  isSoldOut,
  sizeChartFor,
  type Colour,
  type Product,
} from "@/lib/products";
import ProductGallery from "./ProductGallery";
import ProductCard from "./ProductCard";
import ZoomViewer from "./ZoomViewer";
import SizeGuide from "./SizeGuide";
import QtyStepper from "@/components/QtyStepper";
import { NAV_OFFSET, useLenis } from "@/components/SmoothScroll";

/* ──────────────────────────────────────────────────────────────
   /product/[slug]
   Left (~60%): a fixed image viewer of THIS product's photos only
   (it stays put while the page scrolls; carousel on phones).
   Right (~40%): the details, which scroll with the page: breadcrumb,
   name, price, colours, sizes (sold out crossed out, with "Notify me"),
   size guide, quantity, ADD TO BAG (→ "ADDED ✓" and the bag drawer),
   BUY NOW (→ checkout), then accordions. The page ends where the
   details end. Below: "Worn with" and "You may also like", the only
   places other products appear. Phones get a sticky ADD TO BAG bar.
   ────────────────────────────────────────────────────────────── */

export default function ProductPage({ product }: { product: Product }) {
  const panel = useRef<HTMLDivElement>(null);
  const sizesRef = useRef<HTMLDivElement>(null);
  const sizeBox = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const oneSize = product.sizes.length === 1;
  const firstInStock = product.sizes.find((s) => !isSoldOut(product, s)) ?? null;
  const [colour, setColour] = useState<Colour>(product.colours[0]);
  const [size, setSize] = useState<string | null>(oneSize ? firstInStock : null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [guide, setGuide] = useState(false);
  const [notify, setNotify] = useState<"closed" | "open" | "sent">("closed");
  const { add } = useBag();
  const { money } = useCurrency();
  const soldOut = product.sizes.filter((s) => isSoldOut(product, s));
  const maxQty = size ? Math.max(product.stock[size] ?? 1, 1) : 9;
  const chart = sizeChartFor(product);

  useEffect(() => setQty((q) => Math.min(q, maxQty)), [maxQty]);

  useLayoutEffect(() => {
    gsap.set(panel.current?.querySelectorAll(".product-rise") ?? [], { yPercent: 100 });
  }, []);

  usePageReveal(() => {
    const reduced = prefersReducedMotion();
    const rise = panel.current?.querySelectorAll(".product-rise") ?? [];
    const tl = gsap.timeline({ delay: 0.15 });
    if (reduced) {
      gsap.set(rise, { yPercent: 0 });
      tl.fromTo(panel.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
    } else {
      tl.to(rise, { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines });
    }
    return () => void tl.kill();
  });

  /** No size yet: bring the sizes into view, shake them gently, outline them and say so. */
  const askForSize = () => {
    setSizeError(true);
    const box = sizeBox.current;
    if (!box) return;
    const reduced = prefersReducedMotion();
    const shake = () => {
      if (!reduced) gsap.fromTo(box, { x: 0 }, { keyframes: { x: [0, -4, 4, -4, 4, -4, 4, 0] }, duration: 0.3, ease: "none", overwrite: true });
      box.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    };
    const r = box.getBoundingClientRect();
    const inView = r.top >= NAV_OFFSET && r.bottom <= innerHeight - 80;
    if (inView || !lenis) return shake();
    lenis.scrollTo(box, { offset: -innerHeight / 3, duration: reduced ? 0 : 0.8, force: true, onComplete: shake });
  };

  const addToBag = (reveal: boolean) => {
    if (!size) {
      askForSize();
      return false;
    }
    add({ slug: product.slug, size, colour: colour.name, qty }, { reveal });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
    return true;
  };

  // BUY NOW: into the bag (no drawer), then straight to checkout.
  const buyNow = () => {
    if (addToBag(false)) navigate("/checkout");
  };

  const related = product.related.map(getProduct).filter((p): p is Product => !!p).slice(0, 4);
  const more = alsoLike(product, 4);

  const sections = [
    { title: "Description", body: product.description },
    { title: "Fabric & care", body: `${product.composition} ${product.care}` },
    { title: "Fit", body: product.fit },
    { title: "Delivery & returns", body: deliveryCopy },
  ];

  return (
    <main id="main" tabIndex={-1} className="pb-28 pt-[88px] md:pb-[12vh] md:pt-[110px]">
      <div className="grid-12 gap-y-10 md:items-start">
        {/* Gallery (~60%): fixed in place while the details scroll */}
        <div className="col-span-12 md:sticky md:top-[110px] md:col-span-7 md:h-[calc(100svh-134px)]">
          <ProductGallery images={product.images} onZoom={setZoom} />
        </div>

        {/* Details (~40%): scroll with the page */}
        <div className="col-span-12 md:col-span-4 md:col-start-9">
          <div ref={panel}>
            <nav aria-label="Breadcrumb" className="ui-label mask text-stone">
              <ol className="product-rise flex flex-wrap gap-x-2">
                <li>
                  <Link href="/" className="nav-link relative">
                    Home
                  </Link>{" "}
                  /
                </li>
                <li>
                  <Link href="/collections" className="nav-link relative">
                    Collection
                  </Link>{" "}
                  /
                </li>
                <li>
                  <Link href={`/collections?category=${product.category}`} className="nav-link relative" aria-current="page">
                    {CATEGORY_LABEL[product.category]}
                  </Link>
                </li>
              </ol>
            </nav>

            <h1 className="mask mt-6 font-display text-[34px] leading-[1.05] tracking-[-0.01em] md:text-[40px]">
              <span className="product-rise block">{product.name}</span>
            </h1>
            <p className="ui-label mask mt-4">
              <span className="product-rise block">{money(product.price)}</span>
            </p>
            <p className="body-copy mask mt-4 text-stone">
              <span className="product-rise block">{product.short}</span>
            </p>

            {/* Colours */}
            <fieldset className="mt-8">
              <legend className="ui-label mask mb-3 text-stone">
                <span className="product-rise block">Colour — {colour.name}</span>
              </legend>
              <div className="mask">
                <div className="product-rise flex gap-3 p-1">
                  {product.colours.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      aria-label={c.name}
                      aria-pressed={colour.name === c.name}
                      onClick={() => setColour(c)}
                      className={`h-6 w-6 border border-hairline outline-offset-[3px] ${colour.name === c.name ? "outline outline-1 outline-ink" : ""}`}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </fieldset>

            {/* Sizes */}
            <fieldset className="mt-8" ref={sizesRef as React.RefObject<HTMLFieldSetElement & HTMLDivElement>}>
              <legend className="mask mb-3 flex w-full justify-between">
                <span className="product-rise ui-label block text-stone">Size</span>
              </legend>
              {/* Outside the mask, so the outline and the shake aren't clipped. */}
              <div ref={sizeBox} className={`outline-offset-[6px] ${sizeError ? "outline outline-1 outline-ink" : ""}`}>
              <div className="mask">
                <div className="product-rise flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const out = isSoldOut(product, s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={out}
                        aria-pressed={size === s}
                        aria-label={out ? `${s}, sold out` : s}
                        onClick={() => {
                          setSize(s);
                          setSizeError(false);
                        }}
                        className={`size-btn ui-label relative min-w-[48px] border px-3 py-3 ${
                          out
                            ? "size-out cursor-not-allowed border-hairline text-stone"
                            : size === s
                              ? "border-ink bg-ink text-ivory"
                              : "border-hairline text-ink hover:border-ink"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
              {sizeError && (
                <p className="mt-4 text-[13px] leading-[1.4] text-ink" role="alert">
                  Please select a size
                </p>
              )}
              <div className="mask mt-3">
                <div className="product-rise flex flex-wrap items-baseline justify-between gap-3">
                  {chart !== "none" && (
                    <button type="button" className="nav-link ui-label relative" onClick={() => setGuide(true)}>
                      Size guide
                    </button>
                  )}
                  {soldOut.length > 0 && notify === "closed" && (
                    <button type="button" className="nav-link ui-label relative text-stone" onClick={() => setNotify("open")}>
                      {soldOut.join(", ")} sold out — Notify me
                    </button>
                  )}
                </div>
              </div>
              {notify === "open" && (
                <form
                  className="mt-4 flex items-end gap-3 border-b border-hairline"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setNotify("sent");
                  }}
                >
                  <label className="sr-only" htmlFor="notify-email">
                    Email for restock notice
                  </label>
                  <input
                    id="notify-email"
                    type="email"
                    required
                    placeholder="Email for a restock notice"
                    className="w-full bg-transparent py-2 text-[14px] outline-none placeholder:text-stone"
                  />
                  <button type="submit" className="ui-label py-2">
                    Notify me
                  </button>
                </form>
              )}
              {notify === "sent" && <p className="ui-label mt-3 text-stone">We'll write as soon as it's back.</p>}
            </fieldset>

            {/* Quantity + actions */}
            <div className="mask mt-6">
              <div className="product-rise flex items-center gap-4">
                <span className="ui-label text-stone">Quantity</span>
                <QtyStepper value={qty} max={maxQty} onChange={setQty} />
              </div>
            </div>
            <div className="mask mt-6">
              <button type="button" onClick={() => addToBag(true)} className="product-rise btn-ink ui-label block w-full py-4" aria-live="polite">
                <span>{added ? "Added ✓" : "Add to bag"}</span>
              </button>
            </div>
            <div className="mask mt-4 text-center">
              <button type="button" onClick={buyNow} className="product-rise buy-now ui-label relative inline-block cursor-pointer py-1">
                Buy now
              </button>
            </div>

            {/* Details */}
            <div className="mask mt-10">
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
      </div>

      {/* Worn with + You may also like */}
      {related.length > 0 && <ProductRow label="Worn with" products={related} />}
      {more.length > 0 && <ProductRow label="You may also like" products={more} />}

      {/* Phones: sticky ADD TO BAG bar */}
      <div className="fixed inset-x-0 bottom-0 z-[900] flex items-center gap-4 border-t border-hairline bg-ivory px-pad py-3 md:hidden">
        <div className="min-w-0 flex-1">
          <p className="ui-label truncate">{product.name}</p>
          <p className="ui-label text-stone">
            {money(product.price)}
            {size ? ` · ${size}` : ""}
          </p>
        </div>
        <button type="button" onClick={() => addToBag(true)} className="btn-ink ui-label shrink-0 px-6 py-3">
          <span>{added ? "Added ✓" : size ? "Add to bag" : "Choose size"}</span>
        </button>
      </div>

      <ZoomViewer images={product.images} index={zoom} onClose={() => setZoom(null)} />
      {chart !== "none" && <SizeGuide open={guide} onClose={() => setGuide(false)} kind={chart} />}
    </main>
  );
}

function ProductRow({ label, products }: { label: string; products: Product[] }) {
  return (
    <section aria-label={label} className="mt-[14vh]">
      <div className="grid-12 mb-8">
        <h2 className="ui-label col-span-12" data-reveal="lines">
          {label}
        </h2>
      </div>
      <ul className="grid grid-cols-2 gap-x-gutter gap-y-12 px-pad md:grid-cols-4">
        {products.map((p) => (
          <li key={p.slug} className="product-item" data-reveal="card">
            <ProductCard product={p} sizes="(max-width: 767px) 50vw, 25vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One accordion row: height animates on the house ease; + becomes −. */
function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const id = useId();

  const lenis = useLenis();
  const row = useRef<HTMLDivElement>(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    const reduced = prefersReducedMotion();
    const d = reduced ? DURATION.reduced : 0.6;
    const ease = reduced ? "none" : EASE.big;
    gsap.to(body.current, {
      height: next ? "auto" : 0,
      duration: d,
      ease,
      overwrite: "auto",
      onComplete: () => {
        // The page got taller or shorter: re-measure everything scroll-driven.
        ScrollTrigger.refresh();
        lenis?.resize();
        if (next) revealOpened();
      },
    });
    gsap.to(bar.current, { scaleY: next ? 0 : 1, duration: d, ease, overwrite: "auto" });
  };

  // If the opened text runs below the screen, glide it into view (without
  // pushing its heading up under the nav).
  const revealOpened = () => {
    const r = row.current?.getBoundingClientRect();
    if (!r || !lenis) return;
    const overflow = r.bottom - (innerHeight - 32);
    if (overflow <= 0) return;
    const by = Math.min(overflow, r.top - NAV_OFFSET - 16);
    if (by > 0) lenis.scrollTo(window.scrollY + by, { duration: prefersReducedMotion() ? 0 : 0.8, force: true });
  };

  return (
    <div ref={row} className="border-t border-hairline">
      <button type="button" className="flex w-full items-center justify-between py-4 text-left" aria-expanded={open} aria-controls={id} onClick={toggle}>
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
