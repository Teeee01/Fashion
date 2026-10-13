"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Flip, gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { usePageReveal } from "@/lib/transition";
import { CATEGORIES, type Category, type Product, type Season } from "@/lib/products";
import ProductCard from "./ProductCard";

/* ──────────────────────────────────────────────────────────────
   /collections/[season]
   Header: the season title rises from its mask once the page is on
   screen, with a filter row. Switching filters re-flows the grid with
   GSAP Flip: staying items glide to their new places, leaving items
   fade and shrink to 0.96, arriving items grow in from 0.96.
   Grid: 3 columns on desktop, 2 on phones.
   ────────────────────────────────────────────────────────────── */

export default function CollectionPage({ season, products }: { season: Season; products: Product[] }) {
  const title = useRef<HTMLHeadingElement>(null);
  const header = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const flip = useRef<gsap.core.Timeline | null>(null);

  // Hide the header pieces until the page is revealed (no flash).
  useLayoutEffect(() => {
    gsap.set(header.current?.querySelectorAll(".collection-rise") ?? [], { yPercent: 100 });
  }, []);

  usePageReveal(() => {
    const reduced = prefersReducedMotion();
    const split = SplitText.create(title.current, { type: "lines", mask: "lines" });
    const rise = header.current?.querySelectorAll(".collection-rise") ?? [];
    const cards = gsap.utils.toArray<HTMLElement>(".product-item", grid.current);
    const tl = gsap.timeline({ delay: 0.1 });
    if (reduced) {
      gsap.set(rise, { yPercent: 0 });
      tl.fromTo([split.lines, ...cards], { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
    } else {
      tl.fromTo(split.lines, { yPercent: 100 }, { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines })
        .to(rise, { yPercent: 0, duration: DURATION.ui, ease: EASE.text, stagger: STAGGER.nav }, 0.3);
      // Cards rise in as they come into view.
      ScrollTrigger.batch(cards, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(batch, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.columns }),
      });
    }
    return () => {
      tl.kill();
      split.revert();
    };
  });

  const choose = (next: Category | "all") => {
    if (next === filter || !grid.current) return;
    const reduced = prefersReducedMotion();
    const items = gsap.utils.toArray<HTMLElement>(".product-item", grid.current);
    flip.current?.progress(1);

    // Record positions, show/hide items directly, then let Flip animate.
    const state = Flip.getState(items, { props: "opacity" });
    items.forEach((el) => {
      el.style.display = next === "all" || el.dataset.category === next ? "" : "none";
    });
    setFilter(next);

    flip.current = Flip.from(state, {
      duration: reduced ? DURATION.reduced : 0.9,
      ease: reduced ? "none" : EASE.big,
      absolute: true,
      scale: false,
      stagger: reduced ? 0 : 0.03,
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, scale: reduced ? 1 : 0.96 }, { opacity: 1, scale: 1, duration: reduced ? DURATION.reduced : 0.6, ease: EASE.text, delay: reduced ? 0 : 0.25 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: reduced ? 1 : 0.96, duration: reduced ? DURATION.reduced : 0.4, ease: EASE.text }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  };

  return (
    <main className="pt-[160px]">
      <div ref={header} className="grid-12 items-end gap-y-10 pb-[10vh]">
        <div className="col-span-12 md:col-span-7">
          <p className="ui-label mask mb-6">
            <span className="collection-rise block">Collection — {season.short}</span>
          </p>
          <h1 ref={title} className="headline">
            {season.title}
          </h1>
        </div>
        <p className="body-copy mask col-span-12 text-stone md:col-span-4 md:col-start-9">
          <span className="collection-rise block">{season.intro}</span>
        </p>

        {/* Filters */}
        <div className="col-span-12 mt-6 flex flex-wrap gap-x-7 gap-y-3" role="group" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <span key={c.id} className="mask">
              <button
                type="button"
                aria-pressed={filter === c.id}
                onClick={() => choose(c.id)}
                className={`collection-rise nav-link ui-label relative block transition-colors duration-500 ${
                  filter === c.id ? "is-active text-ink" : "text-stone hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            </span>
          ))}
        </div>
      </div>

      <ul ref={grid} className="grid grid-cols-2 gap-x-gutter gap-y-14 px-pad pb-[18vh] md:grid-cols-3 md:gap-y-20">
        {products.map((p, i) => (
          <li key={p.slug} className="product-item" data-category={p.category}>
            <ProductCard product={p} priority={i < 3} />
          </li>
        ))}
      </ul>
    </main>
  );
}
