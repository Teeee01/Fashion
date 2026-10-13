"use client";

import Drawer from "@/components/Drawer";

/* Measurements in centimetres. Replace with your own block measurements. */
const CHARTS = {
  clothing: {
    head: ["Size", "Chest", "Waist", "Hip"],
    rows: [
      ["XS", "82", "64", "88"],
      ["S", "86", "68", "92"],
      ["M", "92", "74", "98"],
      ["L", "98", "80", "104"],
      ["XL", "104", "86", "110"],
    ],
  },
  shoes: {
    head: ["EU", "UK", "US", "Foot length"],
    rows: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46].map((eu) => [
      String(eu),
      String(eu - 33),
      String(eu - 31),
      `${(22.5 + (eu - 36) * 0.67).toFixed(1)}`,
    ]),
  },
  caps: {
    head: ["Size", "Head circumference"],
    rows: [
      ["S", "54 to 56"],
      ["M", "56 to 58"],
      ["L", "58 to 60"],
    ],
  },
} as const;

export type ChartKind = keyof typeof CHARTS;

/** The size guide: a drawer with the measurements table for this kind of product. */
export default function SizeGuide({ open, onClose, kind }: { open: boolean; onClose: () => void; kind: ChartKind }) {
  const chart = CHARTS[kind];
  return (
    <Drawer open={open} onClose={onClose} label="Size guide" title="Size guide">
      <p className="mask">
        <span className="drawer-rise block font-display text-[28px] leading-[1.1]">
          {kind === "shoes" ? "Shoe sizes" : kind === "caps" ? "Cap sizes" : "Garment measurements"}
        </span>
      </p>
      <p className="mask mt-4">
        <span className="drawer-rise body-copy block text-stone">
          {kind === "shoes"
            ? "Measure your foot from the heel to your longest toe. If you're between sizes, go up."
            : kind === "caps"
              ? "Measure around your head, just above your ears. Every cap adjusts at the back anyway."
              : "These are body measurements in centimetres. If you're between sizes, go up for a more relaxed fit."}
        </span>
      </p>
      <div className="mask mt-8">
        <table className="drawer-rise w-full text-left">
          <thead>
            <tr className="border-b border-hairline">
              {chart.head.map((h) => (
                <th key={h} scope="col" className="ui-label py-3 font-medium text-stone">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row[0]} className="border-b border-hairline">
                {row.map((cell, i) => (
                  <td key={i} className="ui-label py-3 tabular-nums">
                    {cell}
                    {i > 0 && kind !== "shoes" ? " cm" : i === 3 ? " cm" : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Drawer>
  );
}
