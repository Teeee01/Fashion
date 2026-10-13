"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/* ──────────────────────────────────────────────────────────────
   Load gate — the preloader waits for everything registered here
   (plus web fonts) before it lets the counter reach 100%.
   Components register in a layout effect, which React runs before the
   preloader's own effect, so nothing mounted on first render is missed.
   ────────────────────────────────────────────────────────────── */

const pending = new Map<Promise<void>, string>();

/** Give up waiting after this long so a broken asset can never trap the visitor. */
const MAX_WAIT_MS = 10000;

/**
 * Hold the preloader until `markLoaded()` is called.
 *   const markLoaded = useLoadGate("hero-image");
 *   <Image onLoad={markLoaded} ... />
 */
export function useLoadGate(name: string) {
  const resolveRef = useRef<(() => void) | null>(null);
  const loadedEarly = useRef(false);

  useLayoutEffect(() => {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    pending.set(promise, name);
    resolveRef.current = resolve;
    if (loadedEarly.current) resolve();
    promise.then(() => pending.delete(promise));
    return () => {
      resolve();
      pending.delete(promise);
    };
  }, [name]);

  return useCallback(() => {
    loadedEarly.current = true;
    resolveRef.current?.();
  }, []);
}

/** Resolves once fonts and every registered asset are ready (or after MAX_WAIT_MS). */
export function waitForAssets(): Promise<void> {
  const all = (async () => {
    await document.fonts.ready;
    // Assets can register while we wait, so keep going until nothing is left.
    while (pending.size > 0) {
      await Promise.all(pending.keys());
    }
  })();

  const timeout = new Promise<void>((resolve) =>
    setTimeout(() => {
      if (pending.size > 0) {
        console.warn("[preloader] gave up waiting for:", [...pending.values()].join(", "));
      }
      resolve();
    }, MAX_WAIT_MS),
  );

  return Promise.race([all, timeout]);
}
