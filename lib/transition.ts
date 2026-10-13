"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { getIntro } from "./intro";

/* ──────────────────────────────────────────────────────────────
   Page transition state, shared between the transition layer and pages.
     idle      → nothing happening
     covering  → ink columns are rising over the old page
     swapping  → the screen is covered; the new page is loading
     revealing → the columns are retracting from the new page
   kind "shared": a product card's image is expanding into the product
   page's main image instead of the columns.
   ────────────────────────────────────────────────────────────── */

export type TransitionPhase = "idle" | "covering" | "swapping" | "revealing";
export type TransitionKind = "columns" | "shared";
type TransitionState = { phase: TransitionPhase; kind: TransitionKind };

let state: TransitionState = { phase: "idle", kind: "columns" };
const listeners = new Set<() => void>();

export function setTransition(next: Partial<TransitionState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
export const getTransition = () => state;

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTransitionState() {
  return useSyncExternalStore(subscribe, getTransition, () => ({ phase: "idle", kind: "columns" }) as TransitionState);
}

/* ── Programmatic navigation with the page transition ──
   Links are caught automatically; for buttons (e.g. "Buy now") call
   navigate(href). The transition layer registers the handler. */
let navigator: ((href: string) => void) | null = null;
export function registerNavigator(fn: (href: string) => void) {
  navigator = fn;
  return () => {
    if (navigator === fn) navigator = null;
  };
}
export function navigate(href: string) {
  if (navigator) navigator(href);
  else window.location.href = href;
}

/** Is the page on screen yet? (Not hidden by the preloader or a transition.) */
function pageVisible() {
  const intro = getIntro().phase;
  const t = state.phase;
  return intro !== "loading" && (t === "idle" || t === "revealing");
}

/**
 * Run `fn` once, as soon as this page is visible: straight away if it
 * already is, otherwise when the preloader or page transition reveals it.
 * Use it to start a page's entrance animation.
 */
export function usePageReveal(fn: () => void | (() => void)) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let cleanup: void | (() => void);
    let done = false;
    const check = () => {
      if (done || !pageVisible()) return;
      done = true;
      cleanup = fnRef.current();
    };
    check();
    if (done) return () => cleanup?.();
    // Watch both the intro and transition stores until the page shows.
    const id = window.setInterval(check, 50);
    const unsub = subscribe(check);
    return () => {
      window.clearInterval(id);
      unsub();
      cleanup?.();
    };
  }, []);
}
