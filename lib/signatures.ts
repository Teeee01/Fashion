/* ──────────────────────────────────────────────────────────────
   THE SIGNATURE SERIES: four pinned features on the home page, one per
   piece, in this order. Each one opens a small image out to full
   screen between its two words, then shows a "Shop the …" link to the
   product (`product` is a slug from lib/products.ts).
   ────────────────────────────────────────────────────────────── */

/** The shape of the small image before it opens out. */
export type Frame =
  | "portrait" // a small upright frame (the coat, the cap)
  | "slit" // a tall, narrow slit (the pants)
  | "band"; // a low, wide band (the shoe)

/** The cap only: one photo per angle. */
export type Angle = { name: string; src: string; alt: string };

export type Signature = {
  id: string;
  index: string;
  /** The two huge words either side of the image, e.g. ["The", "Coat"]. */
  words: [string, string];
  /** Small label, top left. */
  title: string;
  /** Slug of the product the feature links to. */
  product: string;
  /** The link shown once the image is full screen. */
  shop: string;
  frame: Frame;
  /** Word size on desktop / phones (long words need a smaller size to fit). */
  wordSize?: { desktop: string; mobile: string };
  media: { src: string; alt: string };
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
  },
  {
    name: "Side",
    src: unsplash45("1521369909029-2afed882baee"), // PLACEHOLDER → "/images/cap/cap-left.jpg"
    alt: "The signature cap from the left side",
  },
  {
    name: "Back",
    src: unsplash45("1588850561407-ed78c282e89b", "&flip=h"), // PLACEHOLDER → "/images/cap/cap-back.jpg"
    alt: "The signature cap from the back",
  },
  {
    name: "Side",
    src: unsplash45("1521369909029-2afed882baee", "&flip=h"), // PLACEHOLDER → "/images/cap/cap-right.jpg"
    alt: "The signature cap from the right side",
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
  },
];
