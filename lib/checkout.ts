import type { BagItem } from "./bag";
import type { Currency } from "./currency";
import { amountIn } from "./currency";
import { getProduct } from "./products";

/* ──────────────────────────────────────────────────────────────
   Checkout. Front end only for now: placeOrder() pretends to take the
   payment and returns an order number.

   To take real payments later, replace the body of placeOrder() with a
   call to your payment provider:
     Stripe   → create a Checkout Session on your server, then redirect
                 to session.url (or confirm a PaymentIntent with Stripe.js).
     Paystack → call PaystackPop.newTransaction({ key, email, amount:
                 total * 100, currency }) and resolve on its onSuccess.
   Nothing else on the page needs to change: it only awaits placeOrder().
   ────────────────────────────────────────────────────────────── */

export type Delivery = { id: "standard" | "express"; label: string; detail: string; price: { usd: number; ngn: number } };

export const DELIVERY_OPTIONS: Delivery[] = [
  { id: "standard", label: "Standard", detail: "Complimentary · 2–8 working days", price: { usd: 0, ngn: 0 } },
  { id: "express", label: "Express", detail: "1–3 working days", price: { usd: 45, ngn: 70000 } },
];

export type CheckoutDetails = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  delivery: Delivery["id"];
  provider: PaymentProvider;
};

export type PaymentProvider = "card" | "paystack";

export type OrderTotals = { subtotal: number; delivery: number; total: number };

export function totalsFor(items: BagItem[], delivery: Delivery["id"], currency: Currency): OrderTotals {
  const subtotal = items.reduce((sum, i) => {
    const p = getProduct(i.slug);
    return p ? sum + amountIn(p.price, currency) * i.qty : sum;
  }, 0);
  const option = DELIVERY_OPTIONS.find((d) => d.id === delivery) ?? DELIVERY_OPTIONS[0];
  const shipping = amountIn(option.price, currency);
  return { subtotal, delivery: shipping, total: subtotal + shipping };
}

export type Order = { number: string; email: string; totals: OrderTotals; currency: Currency };

/** Placeholder payment: waits a moment and confirms. Swap for Stripe or Paystack (see above). */
export async function placeOrder(details: CheckoutDetails, items: BagItem[], currency: Currency): Promise<Order> {
  if (items.length === 0) throw new Error("Your bag is empty.");
  await new Promise((r) => setTimeout(r, 900));
  const number = `MS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  return { number, email: details.email, totals: totalsFor(items, details.delivery, currency), currency };
}
