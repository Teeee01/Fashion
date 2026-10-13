"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Price } from "./products";

/* ──────────────────────────────────────────────────────────────
   Display currency. USD by default; visitors can switch to NGN in the
   footer. Remembered in this browser (localStorage, try/catch).
   ────────────────────────────────────────────────────────────── */

export type Currency = "USD" | "NGN";
const KEY = "seve:currency";
let current: Currency = "USD";
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "USD" || saved === "NGN") current = saved;
  } catch {
    // Storage blocked: stay on USD.
  }
}

export function setCurrency(next: Currency) {
  current = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // Not remembered, but still switches for this visit.
  }
  listeners.forEach((l) => l());
}

const FORMAT: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  NGN: new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }),
};

export const amountIn = (price: Price, c: Currency) => (c === "USD" ? price.usd : price.ngn);
export const formatAmount = (amount: number, c: Currency) => FORMAT[c].format(amount);

/** The current currency, and a formatter for prices in it. */
export function useCurrency() {
  const currency = useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      queueMicrotask(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => "USD" as Currency,
  );
  const money = useCallback((price: Price, qty = 1) => formatAmount(amountIn(price, currency) * qty, currency), [currency]);
  return { currency, money };
}
