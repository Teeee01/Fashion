import { forwardRef } from "react";
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from "./monogram-path";

// The glyph has a few separate outlines; each gets its own path so each
// one draws on from start to finish.
const OUTLINES = MONOGRAM_PATH.split(/(?=M)/).filter(Boolean);

/**
 * The "S" monogram. Each outline uses pathLength="1", so drawing it on is
 * simply stroke-dashoffset 1 → 0 whatever the letter's real length.
 * The 1px stroke stays 1px at any size (non-scaling-stroke).
 */
const Monogram = forwardRef<SVGSVGElement, { className?: string }>(function Monogram(
  { className = "" },
  ref,
) {
  return (
    <svg
      ref={ref}
      viewBox={MONOGRAM_VIEWBOX}
      className={`monogram ${className}`}
      role="img"
      aria-label="Maison Sève monogram"
    >
      {OUTLINES.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          className="monogram-path"
          stroke="var(--ink)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
});

export default Monogram;
