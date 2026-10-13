"use client";

import { useEffect, useRef } from "react";
import { revealText } from "@/lib/motion";
import { useIntro } from "@/lib/intro";

/**
 * Home — intentionally empty for now.
 * The two corner captions are a temporary check that fonts, tokens and
 * GSAP are wired up; they'll be replaced when the first section is built.
 */
export default function Home() {
  const root = useRef<HTMLElement>(null);
  const { phase } = useIntro();
  const ready = phase !== "loading";

  useEffect(() => {
    if (!ready) return;
    const captions = root.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!captions) return;
    const splits = Array.from(captions, (el, i) => revealText(el, { delay: 0.2 + i * 0.08 }));
    return () => splits.forEach((s) => s?.revert());
  }, [ready]);

  return (
    <main ref={root} className="relative h-svh">
      <p data-reveal className="ui-label absolute bottom-pad left-pad">
        Maison Sève
      </p>
      <p data-reveal className="ui-label absolute bottom-pad right-pad text-stone">
        In preparation
      </p>
    </main>
  );
}
