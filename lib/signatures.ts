/* ──────────────────────────────────────────────────────────────
   THE SIGNATURE SERIES: four pinned features on the home page, one per
   piece, in this order. Each one opens a small image out to full
   screen between its two words, then shows its detail callouts and a
   "Shop the …" link to the product (`product` is a slug from
   lib/products.ts).

   Callout positions are in % of the screen: `point` is the dot on the
   garment, `end` is where the line stops and the label sits, and
   `side` says which way the label hangs from there:
     left / right             → beside the line's end
     above-left / above-right → on top of the line's end
     below-left               → under the line's end
   Phones have their own positions so every label stays on screen.
   ────────────────────────────────────────────────────────────── */

export type Side = "left" | "right" | "above-left" | "above-right" | "below-left";
export type Placement = { point: readonly [number, number]; end: readonly [number, number]; side: Side };
export type Callout = { label: string; desktop: Placement; mobile: Placement };

/** The shape of the small image before it opens out. */
export type Frame =
  | "portrait" // a small upright frame (the coat, the cap)
  | "slit" // a tall, narrow slit (the pants)
  | "band"; // a low, wide band (the shoe)

/** The cap only: one photo per angle, each with its own callout. */
export type Angle = { name: string; src: string; alt: string; callout: Callout };

export type Signature = {
  id: string;
  index: string;
  /** The two huge words either side of the image, e.g. ["The", "Coat"]. */
  words: [string, string];
  /** Small label, top left. */
  title: string;
  /** Slug of the product the feature links to. */
  product: string;
  /** The link shown after the callouts. */
  shop: string;
  frame: Frame;
  /** Word size on desktop / phones (long words need a smaller size to fit). */
  wordSize?: { desktop: string; mobile: string };
  media: { src: string; alt: string };
  callouts: Callout[];
  /** The cap: after opening, scrolling turns it through these angles. */
  angles?: Angle[];
};

const unsplash = (id: string, extra = "") =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=center&ar=16:9${extra}`;
const unsplash45 = (id: string, extra = "") =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=center&ar=4:5${extra}`;

/* ─── THE CAP: YOUR PHOTOS GO HERE ─────────────────────────────────
   PLACEHOLDERS: these four Unsplash links stand in until the real cap
   photography is ready. Put your photos (4:5, upright) in
   /public/images/cap/ named cap-front.jpg, cap-left.jpg, cap-back.jpg
   and cap-right.jpg, then replace each `src` below with its path, e.g.
     src: "/images/cap/cap-front.jpg",
   You can add or remove angles: the scroll animation and the
   FRONT · SIDE · BACK · SIDE indicator adapt to however many there are. */
const CAP_ANGLES: Angle[] = [
  {
    name: "Front",
    src: unsplash45("1588850561407-ed78c282e89b"), // PLACEHOLDER → "/images/cap/cap-front.jpg"
    alt: "The signature cap from the front",
    callout: {
      label: "Embroidered M monogram",
      desktop: { point: [50, 42], end: [72, 30], side: "right" },
      mobile: { point: [50, 42], end: [94, 30], side: "above-right" },
    },
  },
  {
    name: "Side",
    src: unsplash45("1521369909029-2afed882baee"), // PLACEHOLDER → "/images/cap/cap-left.jpg"
    alt: "The signature cap from the left side",
    callout: {
      label: "Six-panel cotton twill",
      desktop: { point: [47, 36], end: [26, 24], side: "left" },
      mobile: { point: [47, 38], end: [6, 26], side: "above-left" },
    },
  },
  {
    name: "Back",
    src: unsplash45("1588850561407-ed78c282e89b", "&flip=h"), // PLACEHOLDER → "/images/cap/cap-back.jpg"
    alt: "The signature cap from the back",
    callout: {
      label: "Leather strap, brass buckle",
      desktop: { point: [51, 54], end: [74, 66], side: "right" },
      mobile: { point: [51, 54], end: [94, 66], side: "above-right" },
    },
  },
  {
    name: "Side",
    src: unsplash45("1521369909029-2afed882baee", "&flip=h"), // PLACEHOLDER → "/images/cap/cap-right.jpg"
    alt: "The signature cap from the right side",
    callout: {
      label: "Pre-curved brim",
      desktop: { point: [42, 60], end: [22, 72], side: "left" },
      mobile: { point: [42, 60], end: [6, 72], side: "below-left" },
    },
  },
];

export const SIGNATURES: Signature[] = [
  {
    id: "coat",
    index: "04",
    words: ["The", "Coat"],
    title: "The Signature Coat",
    product: "wool-crepe-column-coat",
    shop: "Shop the coat",
    frame: "portrait",
    media: { src: unsplash("1591047139829-d91aecb6caea"), alt: "The signature coat" },
    callouts: [
      {
        label: "Hand-rolled lapel",
        desktop: { point: [46, 30], end: [24, 20], side: "left" },
        mobile: { point: [46, 32], end: [6, 24], side: "above-left" },
      },
      {
        label: "Double-faced wool",
        desktop: { point: [58, 52], end: [80, 42], side: "right" },
        mobile: { point: [58, 50], end: [94, 42], side: "above-right" },
      },
      {
        label: "Horn buttons",
        desktop: { point: [50, 64], end: [26, 76], side: "left" },
        mobile: { point: [50, 62], end: [6, 72], side: "below-left" },
      },
    ],
  },
  {
    id: "cap",
    index: "05",
    words: ["The", "Cap"],
    title: "The Signature Cap",
    product: "embroidered-monogram-cap",
    shop: "Shop the cap",
    frame: "portrait",
    media: { src: CAP_ANGLES[0].src, alt: CAP_ANGLES[0].alt },
    callouts: [],
    angles: CAP_ANGLES,
  },
  {
    id: "pants",
    index: "06",
    words: ["The", "Pants"],
    title: "The Signature Pants",
    product: "tailored-wide-leg-pants",
    shop: "Shop the pants",
    frame: "slit",
    wordSize: { desktop: "11vw", mobile: "10vw" },
    media: { src: unsplash("1503342217505-b0a15ec3261c"), alt: "The signature pants" },
    callouts: [
      {
        label: "Pressed front crease",
        desktop: { point: [48, 46], end: [26, 36], side: "left" },
        mobile: { point: [48, 46], end: [6, 38], side: "above-left" },
      },
      {
        label: "Hidden side adjusters",
        desktop: { point: [56, 34], end: [78, 24], side: "right" },
        mobile: { point: [56, 32], end: [94, 24], side: "above-right" },
      },
      {
        label: "Raw-edge hem",
        desktop: { point: [50, 84], end: [74, 74], side: "right" },
        mobile: { point: [50, 82], end: [94, 74], side: "above-right" },
      },
    ],
  },
  {
    id: "shoe",
    index: "07",
    words: ["The", "Shoe"],
    title: "The Signature Shoe",
    product: "sculpted-leather-loafer",
    shop: "Shop the shoe",
    frame: "band",
    media: { src: unsplash("1533867617858-e7b97e060509"), alt: "The signature shoe" },
    callouts: [
      {
        label: "Calf leather, vegetable-tanned",
        desktop: { point: [44, 46], end: [24, 30], side: "left" },
        mobile: { point: [44, 46], end: [6, 32], side: "above-left" },
      },
      {
        label: "Hand-stitched welt",
        desktop: { point: [50, 62], end: [28, 76], side: "left" },
        mobile: { point: [50, 62], end: [6, 74], side: "below-left" },
      },
      {
        label: "Stacked leather heel",
        desktop: { point: [62, 60], end: [80, 48], side: "right" },
        mobile: { point: [62, 60], end: [94, 50], side: "above-right" },
      },
    ],
  },
];
