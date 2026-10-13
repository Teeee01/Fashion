"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";

/* ──────────────────────────────────────────────────────────────
   The shopping bag, as a React context: which products (size, colour,
   quantity) are in it, and whether the drawer is open. Remembered in
   this browser between visits (localStorage, wrapped in try/catch so
   private modes still work). Front end only: see lib/checkout.ts.
   ────────────────────────────────────────────────────────────── */

export type BagItem = { slug: string; size: string; colour: string; qty: number };
/** "added": the drawer shows just the item that was added; "bag": everything. */
export type BagView = "bag" | "added";
type State = { items: BagItem[]; open: boolean; ready: boolean; view: BagView; lastKey: string | null };
type Action =
  | { type: "load"; items: BagItem[] }
  | { type: "add"; item: BagItem }
  | { type: "qty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" }
  | { type: "open"; open: boolean; view?: BagView }
  | { type: "view"; view: BagView };

const KEY = "seve:bag";
export const itemKey = (i: Pick<BagItem, "slug" | "size" | "colour">) => `${i.slug}|${i.size}|${i.colour}`;

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "load":
      return { ...state, items: a.items, ready: true };
    case "add": {
      const k = itemKey(a.item);
      const found = state.items.find((i) => itemKey(i) === k);
      const items = found
        ? state.items.map((i) => (itemKey(i) === k ? { ...i, qty: i.qty + a.item.qty } : i))
        : [...state.items, a.item];
      return { ...state, items, lastKey: k };
    }
    case "qty":
      return { ...state, items: state.items.map((i) => (itemKey(i) === a.key ? { ...i, qty: Math.max(1, a.qty) } : i)) };
    case "remove":
      return { ...state, items: state.items.filter((i) => itemKey(i) !== a.key) };
    case "clear":
      return { ...state, items: [] };
    case "open":
      return { ...state, open: a.open, view: a.view ?? state.view };
    case "view":
      return { ...state, view: a.view };
  }
}

type BagContextValue = {
  items: BagItem[];
  /** False until the saved bag has been read from this browser. */
  ready: boolean;
  open: boolean;
  view: BagView;
  /** The line most recently added to. */
  lastKey: string | null;
  count: number;
  /** Add (same product, size and colour → quantity goes up). `reveal` opens the drawer on it. */
  add: (item: BagItem, options?: { reveal?: boolean }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  openBag: () => void;
  /** In the drawer: from "just added" to the whole bag. */
  showWholeBag: () => void;
  closeBag: () => void;
};

const BagContext = createContext<BagContextValue | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false, ready: false, view: "bag", lastKey: null });

  // Load the saved bag once we're in the browser…
  useEffect(() => {
    let items: BagItem[] = [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(saved)) items = saved.filter((i) => i && i.slug && i.size && i.qty > 0);
    } catch {
      // Unreadable storage: start with an empty bag.
    }
    dispatch({ type: "load", items });
  }, []);

  // …and save it whenever it changes.
  useEffect(() => {
    if (!state.ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {
      // Storage blocked: the bag still works for this visit.
    }
  }, [state.items, state.ready]);

  const add = useCallback((item: BagItem, options?: { reveal?: boolean }) => {
    dispatch({ type: "add", item });
    if (options?.reveal) dispatch({ type: "open", open: true, view: "added" });
  }, []);
  const setQty = useCallback((key: string, qty: number) => dispatch({ type: "qty", key, qty }), []);
  const remove = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const openBag = useCallback(() => dispatch({ type: "open", open: true, view: "bag" }), []);
  const showWholeBag = useCallback(() => dispatch({ type: "view", view: "bag" }), []);
  const closeBag = useCallback(() => dispatch({ type: "open", open: false }), []);

  const value = useMemo(
    () => ({
      items: state.items,
      ready: state.ready,
      open: state.open,
      view: state.view,
      lastKey: state.lastKey,
      count: state.items.reduce((n, i) => n + i.qty, 0),
      add,
      setQty,
      remove,
      clear,
      openBag,
      showWholeBag,
      closeBag,
    }),
    [state.items, state.ready, state.open, state.view, state.lastKey, add, setQty, remove, clear, openBag, showWholeBag, closeBag],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside <BagProvider>");
  return ctx;
}
