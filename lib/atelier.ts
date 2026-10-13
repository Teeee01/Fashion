/* ──────────────────────────────────────────────────────────────
   Atelier content.
   STATS: fill in `value` with your real numbers (e.g. value: 120).
   While a value is null the page shows "[X]" and nothing counts.
   ────────────────────────────────────────────────────────────── */

export type Stat = { value: number | null; label: string };

export const STATS: Stat[] = [
  { value: null, label: "Hours per garment" },
  { value: null, label: "Artisans" },
  { value: null, label: "Fabric mills" },
];

export const ATELIER_PHOTO = {
  src: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&crop=center&ar=4:5",
  alt: "Hands guiding cloth through a sewing machine",
};

export const ATELIER_TEXT =
  "Every garment begins on paper. Our patterns are drafted by hand, cut in muslin, fitted, recut, " +
  "and only then traced onto cloth. The same pair of hands follows a coat from the first chalk line " +
  "to the last buttonhole.";
