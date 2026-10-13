/* ──────────────────────────────────────────────────────────────
   The new collection: one entry per look, in running order.
   To use your own photography, put the file in /public/images and set
   `src` to e.g. "/images/look-01.jpg". Unsplash links are placeholders.
   ────────────────────────────────────────────────────────────── */

export type Look = {
  number: string;
  name: string;
  /** The product this look shows: the card links to /product/<slug>. */
  slug: string;
  src: string;
  alt: string;
};

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces,top&ar=3:4`;

export const LOOKS: Look[] = [
  { number: "01", slug: "wool-crepe-column-coat", name: "Wool crepe column coat", src: unsplash("1509631179647-0177331693ae"), alt: "Model in a long tailored coat" },
  { number: "02", slug: "pleated-silk-skirt", name: "Pleated silk skirt", src: unsplash("1515886657613-9f3515b0c78f"), alt: "Model standing against a wall in a fluid skirt" },
  { number: "03", slug: "double-faced-cashmere-jacket", name: "Double-faced cashmere jacket", src: unsplash("1496747611176-843222e1e57c"), alt: "Model in a soft structured jacket" },
  { number: "04", slug: "linen-wrap-shirt", name: "Linen wrap shirt", src: unsplash("1539109136881-3be0616acf4b"), alt: "Model in a loose wrap shirt" },
  { number: "05", slug: "sculpted-shoulder-blazer", name: "Sculpted shoulder blazer", src: unsplash("1529139574466-a303027c1d8b"), alt: "Model in a sharp-shouldered blazer" },
  { number: "06", slug: "bias-cut-slip-dress", name: "Bias-cut slip dress", src: unsplash("1485968579580-b6d095142e6e"), alt: "Model in a draped slip dress" },
  { number: "07", slug: "tailored-wide-leg-pants", name: "Tailored wide-leg pants", src: unsplash("1503342217505-b0a15ec3261c"), alt: "Model in wide wool trousers" },
  { number: "08", slug: "oversized-poplin-shirt", name: "Oversized poplin shirt", src: unsplash("1487222477894-8943e31ef7b2"), alt: "Model in an oversized white shirt" },
];
