"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/** Register every GSAP plugin once, on the client only. Safe to call repeatedly. */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, CustomEase);
  // The house "big move" curve: a strong in-out.
  CustomEase.create("seve", "0.76, 0, 0.24, 1");
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
  registered = true;
}

registerGsap();

// With "?debug" in the address, expose GSAP for checking animations in the console.
if (typeof window !== "undefined" && window.location.search.includes("debug")) {
  (window as unknown as { __seve: object }).__seve = { gsap, ScrollTrigger };
}

export { gsap, ScrollTrigger, SplitText, Flip, CustomEase };
