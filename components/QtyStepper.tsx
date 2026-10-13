"use client";

/** − 1 + : square, hairline. */
export default function QtyStepper({
  value,
  onChange,
  max = 99,
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label?: string;
}) {
  return (
    <div className="inline-flex items-center border border-hairline" role="group" aria-label={label}>
      <button
        type="button"
        className="ui-label h-9 w-9 disabled:text-stone"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="ui-label w-8 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="ui-label h-9 w-9 disabled:text-stone"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
