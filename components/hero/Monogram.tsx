import { forwardRef, useId } from "react";
import { MONOGRAM_PATH, MONOGRAM_STROKES, MONOGRAM_VIEWBOX } from "./monogram-path";

const [, , VB_W, VB_H] = MONOGRAM_VIEWBOX.split(" ").map(Number);

type MonogramProps = {
  className?: string;
  /**
   * "draw": the hero version, built for its entrance —
   *   · four stroke groups (left stem → left diagonal → right diagonal →
   *     right stem) that trace themselves with stroke-dashoffset 1 → 0
   *     (pathLength="1"; the 1px stroke stays 1px at any size);
   *   · an ink fill revealed by a rectangle that sweeps upward (clipPath);
   *   · a thin light band, clipped to the letter, for the closing shine.
   * "solid": the nav logo, filled with the current text colour.
   */
  variant?: "draw" | "solid";
  /** Shared id so GSAP Flip can glide one monogram into the other. */
  flipId?: string;
  title?: string;
  /** Purely visual (e.g. the hero copy before it hands over to the nav logo). */
  decorative?: boolean;
};

const Monogram = forwardRef<SVGSVGElement, MonogramProps>(function Monogram(
  { className = "", variant = "draw", flipId, title = "Maison Sève home", decorative = false },
  ref,
) {
  const uid = useId().replace(/:/g, "");
  const washId = `mono-wash-${uid}`;
  const glyphId = `mono-glyph-${uid}`;

  return (
    <svg
      ref={ref}
      viewBox={MONOGRAM_VIEWBOX}
      className={`monogram ${className}`}
      data-flip-id={flipId}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
      focusable="false"
      overflow="visible"
    >
      {variant === "solid" ? (
        <path d={MONOGRAM_PATH} fill="currentColor" />
      ) : (
        <>
          <defs>
            {/* The ink wash: this rectangle rises from below to reveal the fill. */}
            <clipPath id={washId}>
              <rect className="monogram-wash" x={-20} y={0} width={VB_W + 40} height={VB_H + 20} />
            </clipPath>
            <clipPath id={glyphId}>
              <path d={MONOGRAM_PATH} />
            </clipPath>
          </defs>

          <g className="monogram-strokes">
            {MONOGRAM_STROKES.map((band, b) => (
              <g key={b} className="monogram-band">
                {band.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    pathLength={1}
                    className="monogram-stroke"
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            ))}
          </g>

          <path className="monogram-fill" d={MONOGRAM_PATH} fill="var(--ink)" clipPath={`url(#${washId})`} />

          {/* Closing shine: a thin light diagonal band crossing the filled letter. */}
          <g clipPath={`url(#${glyphId})`}>
            <rect
              className="monogram-shine"
              x={-VB_W * 0.4}
              y={-VB_H * 0.2}
              width={VB_W * 0.07}
              height={VB_H * 1.4}
              fill="var(--ivory)"
              opacity={0}
              transform={`skewX(-22)`}
            />
          </g>
        </>
      )}
    </svg>
  );
});

export const MONOGRAM_SIZE = { width: VB_W, height: VB_H };

export default Monogram;
