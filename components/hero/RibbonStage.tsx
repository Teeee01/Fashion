"use client";

import { Component, forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useLoadGate } from "@/lib/loading";
import { prefersReducedMotion } from "@/lib/motion";

// Three.js only loads in the browser, in its own chunk.
const RibbonScene = dynamic(() => import("./RibbonScene"), { ssr: false });

/** Catches a WebGL crash inside the canvas and switches to the video. */
class WebGLBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Holds the 3D ribbon: picks WebGL or the video fallback, pauses rendering
 * when the hero is off-screen, and tells the preloader when it's ready.
 * The wrapper is what the hero timeline fades and lifts in.
 */
const RibbonStage = forwardRef<HTMLDivElement, { className?: string }>(function RibbonStage(
  { className = "" },
  ref,
) {
  const markLoaded = useLoadGate("ribbon");
  const box = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<"pending" | "webgl" | "video">("pending");
  const [onScreen, setOnScreen] = useState(true);
  const [slats, setSlats] = useState(260);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setSlats(window.matchMedia("(max-width: 767px)").matches ? 140 : 260);
    setStill(prefersReducedMotion());
    setRenderer(supportsWebGL() ? "webgl" : "video");
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const setRefs = (el: HTMLDivElement | null) => {
    box.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  return (
    <div ref={setRefs} aria-hidden="true" className={`hero-ribbon ${className}`}>
      {renderer === "webgl" && (
        <WebGLBoundary onError={() => setRenderer("video")}>
          <RibbonScene
            slats={slats}
            frameloop={onScreen ? "always" : "never"}
            still={still}
            onReady={markLoaded}
          />
        </WebGLBoundary>
      )}
      {renderer === "video" && (
        <video
          className="ribbon-video"
          autoPlay={!still}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={markLoaded}
        >
          {/* MP4 for Safari and most browsers; WebM for browsers without H.264.
              If neither loads, the error on the last source still releases the preloader. */}
          <source src="/ribbon-loop.mp4" type="video/mp4" />
          <source src="/ribbon-loop.webm" type="video/webm" onError={markLoaded} />
        </video>
      )}
    </div>
  );
});

export default RibbonStage;
