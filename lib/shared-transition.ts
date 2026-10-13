"use client";

import { gsap } from "./gsap";
import { DURATION, EASE } from "./motion";

/* ──────────────────────────────────────────────────────────────
   The shared-element ("image flies into the next page") transition.
   This is the ONLY place it lives; PageTransition calls it for every
   link marked data-transition="shared".

   Each flight builds its own layers (an ivory veil over the page and a
   copy of the clicked image on top), appended to <body> and tagged with
   data-transition-layer. When the flight lands, the real image on the
   new page is shown and the layers are deleted from the DOM. Nothing is
   reused between flights, so nothing can be left behind on screen.

   purgeTransitionLayers() deletes any layers still in the DOM. It runs
   on every route change (including the browser's back/forward buttons)
   as a safety net.
   ────────────────────────────────────────────────────────────── */

const LAYER = "data-transition-layer";
const MOVE = 1.1;

/** Remove every transition layer except those of the flight `keep` (if given). */
export function purgeTransitionLayers(keep?: number) {
  document.querySelectorAll<HTMLElement>(`[${LAYER}]`).forEach((el) => {
    if (keep !== undefined && el.getAttribute(LAYER) === String(keep)) return;
    gsap.killTweensOf(el);
    el.remove();
  });
}

/**
 * Can this card fly cleanly? Its image must be loaded and fully on screen;
 * otherwise the caller falls back to the column transition.
 */
export function canFly(source: HTMLElement | null): source is HTMLElement {
  if (!source) return false;
  const img = source.querySelector("img");
  if (!img || !img.complete || img.naturalWidth === 0) return false;
  const r = source.getBoundingClientRect();
  const slack = 1;
  return r.width > 0 && r.height > 0 && r.top >= -slack && r.left >= -slack && r.bottom <= innerHeight + slack && r.right <= innerWidth + slack;
}

const play = (anim: gsap.core.Animation) => new Promise<void>((resolve) => anim.eventCallback("onComplete", () => resolve()));

/** Wait (briefly) until an image has its pixels, so the hand-over never shows an empty frame. */
function ready(img: HTMLImageElement | null, timeout = 700) {
  if (!img || (img.complete && img.naturalWidth > 0)) return Promise.resolve();
  return Promise.race([img.decode().catch(() => undefined), new Promise((r) => setTimeout(r, timeout))]).then(() => undefined);
}

export type Flight = {
  /** Fade the veil over the old page (the copy of the image sits on top). */
  cover: () => Promise<void>;
  /** Fly the copy onto `target` (the new page's image), reveal the page, hand over, delete the layers. */
  land: (target: HTMLElement | null, beforeHandOver: () => void) => Promise<void>;
  /** Stop at once and delete the layers (e.g. another navigation started). */
  cancel: () => void;
};

/** Lift the card's image off the page. `id` tags the layers so a later flight can't remove them by mistake. */
export function takeOff(source: HTMLElement, id: number, reduced: boolean): Flight {
  const from = source.getBoundingClientRect();
  const sourceImg = source.querySelector("img");
  const anims: gsap.core.Animation[] = [];
  const track = <T extends gsap.core.Animation>(a: T) => (anims.push(a), a);

  const veil = document.createElement("div");
  veil.setAttribute(LAYER, String(id));
  veil.setAttribute("aria-hidden", "true");
  veil.className = "transition-veil";

  const clone = document.createElement("div");
  clone.setAttribute(LAYER, String(id));
  clone.setAttribute("aria-hidden", "true");
  clone.className = "transition-clone";
  Object.assign(clone.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });

  const img = document.createElement("img");
  img.alt = "";
  img.src = sourceImg?.currentSrc || sourceImg?.src || "";
  // Match the card exactly (any filter it has).
  if (sourceImg) img.style.filter = getComputedStyle(sourceImg).filter;
  clone.appendChild(img);
  document.body.append(veil, clone);

  const remove = () => {
    anims.forEach((a) => a.kill());
    veil.remove();
    clone.remove();
  };

  return {
    cover: () => play(track(gsap.fromTo(veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: reduced ? DURATION.reduced : 0.4, ease: EASE.text }))),

    land: async (target, beforeHandOver) => {
      const to = target?.getBoundingClientRect();
      const tl = track(gsap.timeline());
      if (to && to.width > 0) {
        tl.to(clone, { left: to.left, top: to.top, width: to.width, height: to.height, duration: reduced ? 0 : MOVE, ease: EASE.big });
      } else {
        // No image to land on: just let the copy fade with the veil.
        tl.to(clone, { autoAlpha: 0, duration: reduced ? DURATION.reduced : 0.5, ease: EASE.text });
      }
      tl.to(veil, { autoAlpha: 0, duration: reduced ? DURATION.reduced : 0.7, ease: EASE.text }, reduced ? 0 : 0.35);
      await play(tl);
      // Hand over: show the real image underneath, wait until it has its
      // pixels, then fade the copy away and delete everything.
      beforeHandOver();
      await ready(target?.querySelector("img") ?? null);
      await play(track(gsap.to(clone, { autoAlpha: 0, duration: 0.2, ease: "none" })));
      remove();
    },

    cancel: remove,
  };
}
