"use client";

import { useSyncExternalStore } from "react";

/* ──────────────────────────────────────────────────────────────
   The shopping bag: which products (and sizes) are in it, and whether
   the drawer is open. Remembered in this browser between visits
   (localStorage, wrapped in try/catch so private modes still work).
   There's no checkout yet: this is the front end only.
   ────────────────────────────────────────────────────────────── */

export type BagItem = { slug: string; size: string; qty: number };
type BagState = { items: BagItem[]; open: boolean };

const KEY = "seve:bag";
let state: BagState = { items: [], open: false };
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(saved)) state = { ...state, items: saved };
  } catch {
    // Unreadable storage: start with an empty bag.
  }
}

function set(next: Partial<BagState>) {
  state = { ...state, ...next };
  if (next.items) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {
      // Storage blocked: the bag still works for this visit.
    }
  }
  listeners.forEach((l) => l());
}

export const bag = {
  add(slug: string, size: string) {
    load();
    const items = [...state.items];
    const found = items.find((i) => i.slug === slug && i.size === size);
    if (found) found.qty += 1;
    else items.push({ slug, size, qty: 1 });
    set({ items, open: true });
  },
  remove(slug: string, size: string) {
    set({ items: state.items.filter((i) => !(i.slug === slug && i.size === size)) });
  },
  open() {
    load();
    set({ open: true });
  },
  close() {
    set({ open: false });
  },
};

const EMPTY: BagState = { items: [], open: false };

export function useBag() {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      // Saved items appear once we're in the browser.
      queueMicrotask(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => EMPTY,
  );
}

export const bagCount = (items: BagItem[]) => items.reduce((n, i) => n + i.qty, 0);
