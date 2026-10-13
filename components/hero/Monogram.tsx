import { forwardRef } from "react";
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from "./monogram-path";

// The glyph has a few separate outlines; each gets its own path so each
// one draws on from start to finish.
const OUTLINES = MONOGRAM_PATH.split(/(?=M)/).filter(Boolean);

type MonogramProps = {
  className?: string;
  /**
   * "draw": the hero version. Each outline uses pathLength="1", so drawing it
   *   on is simply stroke-dashoffset 1 → 0 whatever the letter's real length;
   *   the 1px stroke stays 1px at any size (non-scaling-stroke).
   * "solid": the nav logo, filled with the current text colour.
   */
  variant?: "draw" | "solid";
  /** Shared id so GSAP Flip can glide one monogram into the other. */
  flipId?: string;
  title?: string;
};

const Monogram = forwardRef<SVGSVGElement, MonogramProps>(function Monogram(
  { className = "", variant = "draw", flipId, title = "Maison Sève monogram" },
  ref,
) {
  return (
    <svg
      ref={ref}
      viewBox={MONOGRAM_VIEWBOX}
      className={`monogram ${className}`}
      data-flip-id={flipId}
      role="img"
      aria-label={title}
    >
      {OUTLINES.map((d, i) =>
        variant === "solid" ? (
          <path key={i} d={d} fill="currentColor" />
        ) : (
          <path
            key={i}
            d={d}
            pathLength={1}
            className="monogram-path"
            stroke="var(--ink)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ),
      )}
    </svg>
  );
});

export default Monogram;
