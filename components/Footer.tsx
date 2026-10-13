"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { DURATION, EASE, prefersReducedMotion } from "@/lib/motion";
import { ribbonState } from "@/lib/ribbon-state";
import { setCurrency, useCurrency, type Currency } from "@/lib/currency";
import { useLenis } from "./SmoothScroll";

/* ──────────────────────────────────────────────────────────────
   Footer: newsletter, four columns of links, back-to-top, and a huge
   MAISON SÈVE wordmark sized to exactly fit the screen width. Its
   letters rise one by one (0.04s apart) as it comes into view, and the
   3D ribbon returns — small, still turning — behind it, so the site
   starts and ends with the ribbon.
   ────────────────────────────────────────────────────────────── */

type FooterLink = { label: string; href?: string };

/* Links without an href are placeholders until those pages exist. */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "House",
    links: [{ label: "The house", href: "/#house" }, { label: "Atelier", href: "/#atelier" }, { label: "Journal", href: "/#journal" }, { label: "Careers" }],
  },
  {
    title: "Collections",
    links: [{ label: "Collections", href: "/collections" }, { label: "New collection", href: "/collections/aw26" }, { label: "Lookbook", href: "/#lookbook" }, { label: "Campaign film", href: "/#film" }],
  },
  {
    title: "Client care",
    links: [{ label: "Contact" }, { label: "Checkout", href: "/checkout" }, { label: "Shipping" }, { label: "Returns" }, { label: "Garment care" }],
  },
  {
    title: "Follow",
    links: [{ label: "Instagram" }, { label: "Press" }, { label: "Stockists" }],
  },
];

const WORDMARK = "Maison Sève";

export default function Footer() {
  const footer = useRef<HTMLElement>(null);
  const wordmark = useRef<HTMLParagraphElement>(null);
  const [sent, setSent] = useState(false);
  const lenis = useLenis();

  useLayoutEffect(() => {
    const el = wordmark.current;
    if (!el) return;

    // Size the wordmark so it exactly fills the width: measure at a known
    // size, then scale. Re-fit on resize and once the web font is in.
    const fit = () => {
      el.style.fontSize = "100px";
      const width = el.scrollWidth;
      const available = el.parentElement?.clientWidth ?? window.innerWidth;
      if (width > 0) el.style.fontSize = `${(100 * available) / width}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (el.parentElement) ro.observe(el.parentElement);

    const reduced = prefersReducedMotion();
    let split: SplitText | undefined;
    const ctx = gsap.context(() => {
      // Letters rise one by one from the wordmark's mask.
      split = SplitText.create(el, { type: "chars", charsClass: "wordmark-char", aria: "hidden" });
      fit(); // splitting into letters changes spacing slightly; re-fit
      gsap.fromTo(
        split.chars,
        reduced ? { y: 0, yPercent: 0, autoAlpha: 0 } : { y: 0, yPercent: 110 },
        {
          ...(reduced
            ? { autoAlpha: 1, duration: DURATION.reduced, ease: "none" }
            : { yPercent: 0, duration: 1, ease: EASE.big, stagger: 0.04 }),
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
        },
      );

      // The ribbon returns behind the wordmark as the footer arrives.
      if (!reduced) {
        const place = () => {
          // Where the wordmark's centre sits on screen once the page is
          // scrolled to the very bottom, minus any drift on the ribbon layer.
          const r = el.getBoundingClientRect();
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const centreY = r.top + window.scrollY - maxScroll + r.height / 2;
          const layer = document.querySelector(".hero-ribbon");
          const driftX = layer ? Number(gsap.getProperty(layer, "x")) : 0;
          const driftY = layer ? Number(gsap.getProperty(layer, "y")) : 0;
          ribbonState.outroX = (r.left + r.width / 2 - driftX) / window.innerWidth;
          ribbonState.outroY = (centreY - driftY) / window.innerHeight;
        };
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: footer.current,
              start: "top bottom",
              end: "bottom bottom",
              scrub: 0.6,
              onRefresh: place,
              onEnter: place,
            },
          })
          .fromTo(ribbonState, { outro: 0 }, { outro: 1, duration: 1, ease: EASE.big }, 0)
          .fromTo(ribbonState, { outroFade: 0 }, { outroFade: 1, duration: 0.6 }, 0.3);
      }
    }, footer);

    document.fonts.ready.then(() => {
      fit();
      ScrollTrigger.refresh();
    });

    return () => {
      ro.disconnect();
      ctx.revert();
      split?.revert();
      ribbonState.outro = 0;
      ribbonState.outroFade = 0;
    };
  }, []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Not connected to a mailing service yet: confirm and clear.
    setSent(true);
    e.currentTarget.reset();
  };

  const backToTop = () => {
    const reduced = prefersReducedMotion();
    if (lenis) lenis.scrollTo(0, { duration: reduced ? 0 : 1.8, easing: gsap.parseEase(EASE.big), immediate: reduced });
    else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <footer ref={footer} id="contact" className="footer relative overflow-hidden pt-[18vh]">
      {/* Newsletter */}
      <div className="grid-12 gap-y-8">
        <p
          className="col-span-12 max-w-[22ch] font-display text-[32px] leading-[1.1] tracking-[-0.01em] md:col-span-6 md:text-[40px]"
          data-reveal="lines"
        >
          Letters from the atelier, four times a year.
        </p>
        <form className="col-span-12 self-end md:col-span-5 md:col-start-8" onSubmit={onSubmit} noValidate={false}>
          <span className="mask mb-4">
            <label htmlFor="newsletter-email" className="ui-label block text-stone" data-reveal="block">
              Email address
            </label>
          </span>
          <div className="newsletter-field relative flex items-center border-b border-hairline">
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-transparent py-3 text-[14px] text-ink outline-none placeholder:text-stone"
              onInput={() => sent && setSent(false)}
            />
            <button type="submit" aria-label="Subscribe" className="newsletter-submit ml-4 py-3 text-[18px] leading-none">
              →
            </button>
            {/* The ink underline draws in from the left on focus. */}
            <span className="newsletter-line pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left bg-ink" aria-hidden="true" />
          </div>
          <p className="ui-label mt-4 min-h-[1.2em] text-stone" role="status" aria-live="polite">
            {sent ? "Thank you. The next letter will find you." : ""}
          </p>
        </form>
      </div>

      {/* Links */}
      <nav aria-label="Footer" className="grid-12 mt-[14vh] gap-y-10">
        {COLUMNS.map((col) => (
          <div key={col.title} className="col-span-6 md:col-span-3">
            <p className="ui-label mask mb-5 text-stone">
              <span className="block" data-reveal="block">
                {col.title}
              </span>
            </p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label} className="ui-label mask">
                  <span className="block" data-reveal="block">
                    {link.href ? (
                      <Link href={link.href} className="nav-link relative inline-block">
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-stone">{link.label}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom row: copyright and credit, currency, back to top */}
      <div className="mt-[12vh] flex flex-wrap items-baseline justify-between gap-x-10 gap-y-5 px-pad">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <p className="ui-label mask text-stone">
            <span className="block" data-reveal="block">
              © 2026 Maison Sève
            </span>
          </p>
          <p className="ui-label mask text-stone">
            <span className="block" data-reveal="block">
              Designed by{" "}
              <a
                href="https://akinyemititilope.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link relative inline-block text-ink"
              >
                Akinyemi Titilope<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </span>
          </p>
        </div>
        <CurrencySwitch />
        <span className="mask">
          <button type="button" onClick={backToTop} className="nav-link ui-label relative block" data-reveal="block">
            Back to top ↑
          </button>
        </span>
      </div>

      {/* Wordmark: exactly the screen's width; the ribbon turns behind it. */}
      <div className="wordmark-box mt-6 overflow-hidden">
        <p
          ref={wordmark}
          className="wordmark inline-block whitespace-nowrap font-display uppercase leading-[0.82] tracking-[-0.02em]"
        >
          {WORDMARK}
        </p>
        <span className="sr-only">Maison Sève</span>
      </div>
    </footer>
  );
}

/** USD / NGN. Prices everywhere switch at once; the choice is remembered. */
function CurrencySwitch() {
  const { currency } = useCurrency();
  const options: Currency[] = ["USD", "NGN"];
  return (
    <div className="ui-label mask flex items-baseline gap-3" role="group" aria-label="Currency">
      <span className="flex gap-3" data-reveal="block">
        <span className="text-stone">Currency</span>
        {options.map((c, i) => (
          <span key={c} className="flex gap-3">
            {i > 0 && <span className="text-stone" aria-hidden="true">/</span>}
            <button
              type="button"
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
              className={`nav-link relative transition-colors duration-500 ${currency === c ? "is-active text-ink" : "text-stone hover:text-ink"}`}
            >
              {c}
            </button>
          </span>
        ))}
      </span>
    </div>
  );
}
