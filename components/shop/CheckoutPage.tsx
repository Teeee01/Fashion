"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { DURATION, EASE, STAGGER, prefersReducedMotion } from "@/lib/motion";
import { usePageReveal } from "@/lib/transition";
import { itemKey, useBag } from "@/lib/bag";
import { formatAmount, useCurrency } from "@/lib/currency";
import { getProduct } from "@/lib/products";
import { DELIVERY_OPTIONS, placeOrder, totalsFor, type CheckoutDetails, type Order } from "@/lib/checkout";
import EditorialImage from "../EditorialImage";

/* ──────────────────────────────────────────────────────────────
   /checkout
   Left: contact, shipping address, delivery method, payment method.
   Right (sticky on desktop): the order summary in the chosen currency.
   "Place order" calls placeOrder() in lib/checkout.ts (a placeholder
   today, Stripe or Paystack later), then shows the confirmation.
   ────────────────────────────────────────────────────────────── */

const EMPTY: CheckoutDetails = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  state: "",
  postcode: "",
  country: "Nigeria",
  delivery: "standard",
  provider: "card",
};

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "France", "Italy", "United States", "Other"];

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = true,
  span = "col-span-12",
}: {
  label: string;
  name: keyof CheckoutDetails;
  value: string;
  onChange: (name: keyof CheckoutDetails, v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  span?: string;
}) {
  return (
    <label className={`checkout-rise block ${span}`}>
      <span className="ui-label text-stone">
        {label}
        {!required && " (optional)"}
      </span>
      <input
        className="checkout-input mt-2 block w-full border-b border-hairline bg-transparent py-3 text-[15px] outline-none transition-colors duration-500 focus:border-ink"
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        onChange={(e) => onChange(name, e.target.value)}
      />
    </label>
  );
}

export default function CheckoutPage() {
  const { items, ready, clear } = useBag();
  const { currency, money } = useCurrency();
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);

  const lines = items.map((i) => ({ ...i, product: getProduct(i.slug) })).filter((l) => l.product);
  const totals = totalsFor(items, details.delivery, currency);
  const set = (name: keyof CheckoutDetails, v: string) => setDetails((d) => ({ ...d, [name]: v }));

  useLayoutEffect(() => {
    if (!prefersReducedMotion()) gsap.set(root.current?.querySelectorAll(".checkout-rise") ?? [], { autoAlpha: 0, y: 24 });
  }, []);

  usePageReveal(() => {
    const reduced = prefersReducedMotion();
    const split = SplitText.create(title.current, { type: "lines", mask: "lines", aria: "none" });
    const ctx = gsap.context(() => {
      const rise = root.current?.querySelectorAll(".checkout-rise") ?? [];
      if (reduced) {
        gsap.fromTo([split.lines, ...rise], { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" });
        return;
      }
      gsap
        .timeline({ delay: 0.1 })
        .fromTo(split.lines, { yPercent: 100 }, { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines })
        .fromTo(rise, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: DURATION.ui, ease: EASE.text, stagger: 0.04 }, 0.3);
    });
    return () => {
      ctx.revert();
      split.revert();
    };
  });

  // Confirmation: the thank-you lines rise from their masks.
  useLayoutEffect(() => {
    if (!order || !confirmation.current) return;
    const reduced = prefersReducedMotion();
    window.scrollTo(0, 0);
    const lines = confirmation.current.querySelectorAll(".confirm-rise");
    const anim = reduced
      ? gsap.fromTo(lines, { autoAlpha: 0 }, { autoAlpha: 1, duration: DURATION.reduced, ease: "none" })
      : gsap.fromTo(lines, { yPercent: 100 }, { yPercent: 0, duration: DURATION.text, ease: EASE.text, stagger: STAGGER.lines, delay: 0.1 });
    return () => {
      anim.kill();
    };
  }, [order]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (placing) return;
    setError("");
    setPlacing(true);
    try {
      const placed = await placeOrder(details, items, currency);
      setOrder(placed);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong there. Mind trying again?");
    } finally {
      setPlacing(false);
    }
  };

  if (order) {
    return (
      <main id="main" tabIndex={-1} className="flex min-h-svh items-center pt-[120px] pb-[14vh]">
        <div ref={confirmation} className="grid-12 w-full" role="status">
          <div className="col-span-12 md:col-span-8 md:col-start-3">
            <p className="ui-label mask">
              <span className="confirm-rise block">Order {order.number}</span>
            </p>
            <h1 className="headline mt-6">
              <span className="mask block">
                <span className="confirm-rise block">Thank you.</span>
              </span>
            </h1>
            <p className="body-copy mask mt-8 max-w-[44ch] text-stone">
              <span className="confirm-rise block">
                Your order&apos;s in. We&apos;ve sent a receipt for {formatAmount(order.totals.total, order.currency)} to {order.email}, and
                we&apos;ll email you again as soon as your pieces ship.
              </span>
            </p>
            <p className="mask mt-12">
              <span className="confirm-rise block">
                <Link href="/collections" className="btn-ink ui-label inline-block px-8 py-4 text-center">
                  <span>Continue browsing</span>
                </Link>
              </span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const empty = ready && lines.length === 0;

  return (
    <main ref={root} id="main" tabIndex={-1} className="pt-[160px] pb-[14vh]">
      <div className="grid-12 gap-y-14">
        <div className="col-span-12">
          <p className="ui-label checkout-rise mb-6">Checkout</p>
          <h1 ref={title} className="headline">
            {empty ? "Your bag is empty." : "Checkout"}
          </h1>
          {empty && (
            <p className="checkout-rise mt-10">
              <Link href="/collections" className="btn-ink ui-label inline-block px-8 py-4 text-center">
                <span>Browse the collections</span>
              </Link>
            </p>
          )}
        </div>

        {!empty && (
          <>
            <form onSubmit={submit} className="col-span-12 md:col-span-7" aria-label="Checkout">
              <fieldset className="grid-12 gap-y-8 !px-0">
                <legend className="ui-label checkout-rise mb-8 w-full border-b border-hairline pb-4">01 Contact</legend>
                <Field label="Email" name="email" type="email" autoComplete="email" value={details.email} onChange={set} />
                <Field label="Phone" name="phone" type="tel" autoComplete="tel" value={details.phone} onChange={set} />
              </fieldset>

              <fieldset className="grid-12 mt-16 gap-y-8 !px-0">
                <legend className="ui-label checkout-rise mb-8 w-full border-b border-hairline pb-4">02 Shipping address</legend>
                <Field label="First name" name="firstName" autoComplete="given-name" value={details.firstName} onChange={set} span="col-span-6" />
                <Field label="Last name" name="lastName" autoComplete="family-name" value={details.lastName} onChange={set} span="col-span-6" />
                <Field label="Address" name="address" autoComplete="street-address" value={details.address} onChange={set} />
                <Field label="City" name="city" autoComplete="address-level2" value={details.city} onChange={set} span="col-span-6" />
                <Field label="State / region" name="state" autoComplete="address-level1" value={details.state} onChange={set} span="col-span-6" />
                <Field label="Postcode" name="postcode" autoComplete="postal-code" value={details.postcode} onChange={set} required={false} span="col-span-6" />
                <label className="checkout-rise col-span-6 block">
                  <span className="ui-label text-stone">Country</span>
                  <select
                    className="checkout-input mt-2 block w-full appearance-none border-b border-hairline bg-transparent py-3 text-[15px] outline-none focus:border-ink"
                    autoComplete="country-name"
                    value={details.country}
                    onChange={(e) => set("country", e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </fieldset>

              <fieldset className="mt-16">
                <legend className="ui-label checkout-rise mb-8 w-full border-b border-hairline pb-4">03 Delivery</legend>
                <div className="flex flex-col gap-3">
                  {DELIVERY_OPTIONS.map((d) => (
                    <label
                      key={d.id}
                      className={`checkout-rise flex cursor-pointer items-center justify-between border px-5 py-4 transition-colors duration-500 ${
                        details.delivery === d.id ? "border-ink" : "border-hairline"
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <input type="radio" name="delivery" className="accent-ink" checked={details.delivery === d.id} onChange={() => set("delivery", d.id)} />
                        <span className="ui-label">{d.label}</span>
                        <span className="ui-label text-stone">{d.detail}</span>
                      </span>
                      <span className="ui-label">{d.price.usd === 0 ? "Free" : money(d.price)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-16">
                <legend className="ui-label checkout-rise mb-8 w-full border-b border-hairline pb-4">04 Payment</legend>
                <div className="flex flex-col gap-3">
                  {(
                    [
                      ["card", "Card", "Visa · Mastercard · Amex"],
                      ["paystack", "Paystack", "Card, bank transfer or USSD"],
                    ] as const
                  ).map(([id, label, detail]) => (
                    <label
                      key={id}
                      className={`checkout-rise flex cursor-pointer items-center gap-4 border px-5 py-4 transition-colors duration-500 ${
                        details.provider === id ? "border-ink" : "border-hairline"
                      }`}
                    >
                      <input type="radio" name="provider" className="accent-ink" checked={details.provider === id} onChange={() => set("provider", id)} />
                      <span className="ui-label">{label}</span>
                      <span className="ui-label text-stone">{detail}</span>
                    </label>
                  ))}
                </div>
                <p className="ui-label checkout-rise mt-4 text-stone">You'll confirm the payment securely in the next step.</p>
              </fieldset>

              {error && (
                <p className="ui-label mt-8" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" disabled={placing || !ready} className="btn-ink ui-label checkout-rise mt-12 block w-full py-5 disabled:opacity-60">
                <span>{placing ? "Placing order…" : `Place order · ${formatAmount(totals.total, currency)}`}</span>
              </button>
            </form>

            <aside className="col-span-12 md:col-span-4 md:col-start-9" aria-label="Order summary">
              <div className="md:sticky md:top-[120px]">
                <p className="ui-label checkout-rise border-b border-hairline pb-4">Order summary</p>
                <ul>
                  {lines.map((l) => {
                    const p = l.product!;
                    return (
                      <li key={itemKey(l)} className="checkout-rise flex gap-4 border-b border-hairline py-5">
                        <Link href={`/product/${p.slug}`} className="relative aspect-[3/4] w-[64px] shrink-0 overflow-hidden bg-loader-grey">
                          <EditorialImage src={p.images[0].src} alt={p.images[0].alt} sizes="64px" />
                        </Link>
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <p className="font-display text-[18px] leading-[1.15]">{p.name}</p>
                            <p className="ui-label mt-2 text-stone">
                              {l.colour} · {l.size} · Qty {l.qty}
                            </p>
                          </div>
                        </div>
                        <p className="ui-label">{money(p.price, l.qty)}</p>
                      </li>
                    );
                  })}
                </ul>
                <dl className="checkout-rise mt-5 flex flex-col gap-3">
                  <div className="flex justify-between">
                    <dt className="ui-label text-stone">Subtotal</dt>
                    <dd className="ui-label">{formatAmount(totals.subtotal, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="ui-label text-stone">Delivery</dt>
                    <dd className="ui-label">{totals.delivery === 0 ? "Free" : formatAmount(totals.delivery, currency)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-hairline pt-4">
                    <dt className="ui-label">Total</dt>
                    <dd className="ui-label">{formatAmount(totals.total, currency)}</dd>
                  </div>
                </dl>
                <p className="ui-label checkout-rise mt-6 text-stone">Prices in {currency}. Change currency in the footer.</p>
              </div>
            </aside>
          </>
        )}
      </div>
    </main>
  );
}
