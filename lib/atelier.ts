/* ──────────────────────────────────────────────────────────────
   Atelier content.
   STATS: the numbers count up from 0 when they scroll into view.
   Change a `value` to update it (null shows "[X]" and doesn't count).
   ────────────────────────────────────────────────────────────── */

export type Stat = { value: number | null; label: string };

export const STATS: Stat[] = [
  { value: 40, label: "Hours per garment" },
  { value: 12, label: "Artisans" },
  { value: 6, label: "Fabric mills" },
];

export const ATELIER_PHOTO = {
  src: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&crop=center&ar=4:5",
  alt: "Hands guiding cloth through a sewing machine",
};

export const ATELIER_TEXT =
  "Everything we make starts on paper. We draw the patterns by hand, cut them in muslin, fit them, " +
  "cut them again, and only then trace them onto the real cloth. The same pair of hands stays with a coat " +
  "from the first chalk line to the last buttonhole.";
