"use client";


import { useSyncExternalStore } from "react";
import type gsap from "gsap";
import { INTRO_SEEN_KEY } from "./intro-key";

/* ──────────────────────────────────────────────────────────────
   Intro state, shared between the preloader and the sections that
   animate in after it.
     loading   → preloader is on screen, scroll is locked
     revealing → preloader has finished; the page reveal plays
     done      → everything is interactive
   `mode` says which version is playing so the reveal can match it:
     full    → first visit this session
     quick   → returning visit (0.6s version)
     reduced → prefers-reduced-motion (0.3s fades)
   ────────────────────────────────────────────────────────────── */

export type IntroPhase = "loading" | "revealing" | "done";
export type IntroMode = "full" | "quick" | "reduced";

type IntroState = { phase: IntroPhase; mode: IntroMode };

let state: IntroState = { phase: "loading", mode: "full" };
const listeners = new Set<() => void>();

export function setIntro(next: Partial<IntroState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getState = () => state;

/* ── Page entrance timelines ─────────────────────────────────────
   A page (e.g. the hero) registers a builder for its entrance. The
   preloader calls it when the staircase starts and nests the result in
   its own timeline, so the whole intro runs as one GSAP timeline.
   Times inside the entrance are relative to its own start. */
export type IntroBuilder = (mode: IntroMode) => gsap.core.Timeline;

let introBuilder: IntroBuilder | null = null;

export function registerIntroTimeline(builder: IntroBuilder) {
  introBuilder = builder;
  return () => {
    if (introBuilder === builder) introBuilder = null;
  };
}

export function buildIntroTimeline(mode: IntroMode) {
  return introBuilder?.(mode) ?? null;
}
const getServerState = (): IntroState => ({ phase: "loading", mode: "full" });

export function useIntro() {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

export function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Private mode or blocked storage: the full preloader will just play again.
  }
}
