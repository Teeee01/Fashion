/* ──────────────────────────────────────────────────────────────
   THE PRODUCT CATALOGUE — the single source of truth for every garment
   on the site. Looks, the lookbook, the signature series and every
   product card link here by `slug`.

   To edit a product: change its fields below. Prices are in both USD
   and NGN (USD shows by default; visitors can switch in the footer).
   `stock` is per size: 0 means sold out (the size shows crossed out).
   Images: ONLY photos of this product (the gallery never shows another
   garment). The first is the main image and the card image; the second
   shows on card hover. Unsplash links are placeholders: put your photos
   in /public/images and use e.g. "/images/coat-1.jpg".
   ────────────────────────────────────────────────────────────── */

export type Category =
  | "outerwear"
  | "dresses"
  | "tailoring"
  | "trousers"
  | "shirts"
  | "accessories"
  | "footwear"
  | "headwear";

export const CATEGORY_LABEL: Record<Category, string> = {
  outerwear: "Outerwear",
  dresses: "Dresses",
  tailoring: "Tailoring",
  trousers: "Trousers",
  shirts: "Shirts",
  accessories: "Accessories",
  footwear: "Footwear",
  headwear: "Headwear",
};

/** Filters on the collections page, in order. */
export const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dresses", label: "Dresses" },
  { id: "tailoring", label: "Tailoring" },
  { id: "trousers", label: "Trousers" },
  { id: "shirts", label: "Shirts" },
  { id: "footwear", label: "Footwear" },
  { id: "headwear", label: "Headwear" },
  { id: "accessories", label: "Accessories" },
];

export type Colour = { name: string; hex: string };

/* Colourways use the house palette, so swatches never introduce a colour
   the site doesn't already use. */
export const COLOURS = {
  ink: { name: "Ink", hex: "#0E0E0E" },
  ivory: { name: "Ivory", hex: "#F2F1EE" },
  stone: { name: "Stone", hex: "#8A8986" },
  chalk: { name: "Chalk", hex: "#FFFFFF" },
  fog: { name: "Fog", hex: "#E6E6E4" },
} satisfies Record<string, Colour>;

export type Price = { usd: number; ngn: number };

export type Product = {
  slug: string;
  name: string;
  category: Category;
  season: string;
  price: Price;
  short: string;
  description: string;
  composition: string;
  care: string;
  fit: string;
  colours: Colour[];
  sizes: string[];
  stock: Record<string, number>;
  images: { src: string; alt: string }[];
  related: string[];
};

export type Season = { slug: string; title: string; short: string; intro: string };

export const SEASONS: Season[] = [
  {
    slug: "aw26",
    title: "Autumn Winter 2026",
    short: "AW26",
    intro: "Wool, silk, linen and leather, made without rushing. For women and for men.",
  },
];

/* ── Placeholder imagery ──────────────────────────────────────── */
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces,top&ar=3:4`;
const IMG = {
  coat: u("1509631179647-0177331693ae"),
  skirt: u("1515886657613-9f3515b0c78f"),
  jacket: u("1496747611176-843222e1e57c"),
  wrap: u("1539109136881-3be0616acf4b"),
  blazer: u("1529139574466-a303027c1d8b"),
  slip: u("1485968579580-b6d095142e6e"),
  trouser: u("1503342217505-b0a15ec3261c"),
  poplin: u("1487222477894-8943e31ef7b2"),
  portraitW: u("1534528741775-53994a69daeb"),
  portraitM: u("1506794778202-cad84cf45f1d"),
  lookAway: u("1524504388940-b1c1722653e1"),
  hat: u("1445205170230-053b83016050"),
  natural: u("1507003211169-0a1dd7228f2d"),
  field: u("1469334031218-e382a71b716b"),
  rack: u("1490481651871-ab68de25d43d"),
  cloth: u("1558769132-cb1aea458c5e"),
  hanger: u("1591047139829-d91aecb6caea"),
  shoe: u("1533867617858-e7b97e060509"),
  shoe2: u("1542291026-7eec264c27ff"),
  cap: u("1588850561407-ed78c282e89b"),
  cap2: u("1521369909029-2afed882baee"),
};
/* Closer crops of the same photo, so a product's gallery never borrows
   another garment's picture (fp = the point to zoom on, z = how far). */
const CROPS = [
  { crop: "crop=focalpoint&fp-x=0.5&fp-y=0.32&fp-z=1.8", view: "detail" },
  { crop: "crop=focalpoint&fp-x=0.5&fp-y=0.7&fp-z=1.6", view: "lower detail" },
  { crop: "crop=focalpoint&fp-x=0.5&fp-y=0.5&fp-z=2.6", view: "fabric close up" },
  { crop: "crop=entropy", view: "alternate view" },
];

/**
 * A product's gallery: ONLY its own photos (`own`), followed by closer
 * crops of them, up to five images. Never another product's photos.
 * With your real photography, list a product's own images in `images`
 * directly, e.g. [{ src: "/images/coat-1.jpg", alt: "…" }, …].
 */
function gallery(name: string, ...own: string[]) {
  const shots = own.map((src, i) => ({ src, alt: `${name}, ${i === 0 ? "front" : "second view"}` }));
  for (const c of CROPS) {
    if (shots.length >= 5) break;
    shots.push({ src: own[0].replace("crop=faces,top", c.crop), alt: `${name}, ${c.view}` });
  }
  return shots;
}

const CLOTHING = ["XS", "S", "M", "L", "XL"];
const SHOES = ["EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45", "EU 46"];
const CAPS = ["S", "M", "L"];
const ONE = ["One size"];

/** Stock per size; the listed sizes are sold out. */
const stock = (sizes: string[], soldOut: string[] = [], low: string[] = []) =>
  Object.fromEntries(sizes.map((s) => [s, soldOut.includes(s) ? 0 : low.includes(s) ? 1 : 6]));

const DELIVERY =
  "Delivery is free on every order, and you'll get a tracking link. Lagos takes 1 to 2 days, the rest of Nigeria 2 to 4, and international orders 4 to 8. If something isn't right, send it back within 30 days, unworn and with the tags still on.";

const ngn = (usd: number) => Math.round((usd * 1550) / 1000) * 1000;

export const PRODUCTS: Product[] = [
  // ── Outerwear ──
  {
    slug: "wool-crepe-column-coat",
    name: "Wool crepe column coat",
    category: "outerwear",
    season: "aw26",
    price: { usd: 1890, ngn: ngn(1890) },
    short: "A long coat with no lining. It falls straight from the shoulder.",
    description:
      "This is the coat we're known for. It's cut from one long piece of wool crepe, so it drops in a clean line from your shoulders to just past the knee. We roll the lapels by hand so they curve instead of folding flat, and the horn buttons sit hidden under the placket. There's no lining, which means it moves more like a heavy shirt than a coat.",
    composition: "100% wool crepe. Horn buttons. No lining.",
    care: "Dry clean only. A quick steam freshens it up. Hang it on a wide hanger.",
    fit: "Relaxed through the body, so take your usual size. Our model is 178cm and wearing a size S.",
    colours: [COLOURS.ink, COLOURS.stone],
    sizes: CLOTHING,
    stock: stock(CLOTHING, ["XL"], ["XS"]),
    images: gallery("Wool crepe column coat", IMG.coat, IMG.hanger),
    related: ["raw-edge-wool-trouser", "embroidered-monogram-cap", "sculpted-leather-loafer", "linen-wrap-shirt"],
  },
  {
    slug: "double-faced-cashmere-jacket",
    name: "Double faced cashmere jacket",
    category: "outerwear",
    season: "aw26",
    price: { usd: 1650, ngn: ngn(1650) },
    short: "Two layers of cashmere woven into one, so it needs no lining.",
    description:
      "The two layers of cashmere are woven together on the loom. We split them by hand at the edges and stitch them closed, so the jacket doesn't need a lining and hangs softly, almost like a blanket.",
    composition: "100% double faced cashmere.",
    care: "Dry clean only. Fold it to store, don't hang it.",
    fit: "Cropped at the hip with a relaxed sleeve. Our model is 175cm and wearing a size S.",
    colours: [COLOURS.stone, COLOURS.ivory],
    sizes: CLOTHING,
    stock: stock(CLOTHING, ["S"]),
    images: gallery("Double faced cashmere jacket", IMG.jacket),
    related: ["pleated-silk-skirt", "silk-twill-scarf", "tailored-wide-leg-pants"],
  },
  {
    slug: "felted-wool-cape",
    name: "Felted wool cape",
    category: "outerwear",
    season: "aw26",
    price: { usd: 1420, ngn: ngn(1420) },
    short: "Boiled wool, cut as one big circle.",
    description: "We boil and felt the wool, then cut it as one full circle. It closes at the throat with a single horn toggle, and that's it.",
    composition: "100% felted wool. Horn toggle.",
    care: "Dry clean only.",
    fit: "Roomy on purpose. Two sizes cover everyone.",
    colours: [COLOURS.ink],
    sizes: ["S/M", "L/XL"],
    stock: stock(["S/M", "L/XL"]),
    images: gallery("Felted wool cape", IMG.field),
    related: ["bias-cut-slip-dress", "leather-column-bag", "wool-felt-bucket-hat"],
  },
  // ── Dresses ──
  {
    slug: "pleated-silk-skirt",
    name: "Pleated silk skirt",
    category: "dresses",
    season: "aw26",
    price: { usd: 780, ngn: ngn(780) },
    short: "Knife pleats set by hand, opening up from the hip.",
    description: "Every knife pleat is set by hand and left to open from the hip, so the skirt moves a beat after you do.",
    composition: "100% silk crêpe de chine.",
    care: "Hand wash in cold water and dry it flat.",
    fit: "Sits at your natural waist and falls to mid calf. Our model is 176cm and wearing a size XS.",
    colours: [COLOURS.ivory, COLOURS.ink],
    sizes: CLOTHING,
    stock: stock(CLOTHING, ["M"], ["L"]),
    images: gallery("Pleated silk skirt", IMG.skirt),
    related: ["double-faced-cashmere-jacket", "oversized-poplin-shirt", "silk-twill-scarf"],
  },
  {
    slug: "bias-cut-slip-dress",
    name: "Bias cut slip dress",
    category: "dresses",
    season: "aw26",
    price: { usd: 960, ngn: ngn(960) },
    short: "Cut on the bias from one length of silk satin.",
    description: "We cut it on the bias from one length of silk satin, so it follows your body without clinging. Thin rouleau straps, and a hem rolled by hand.",
    composition: "100% silk satin.",
    care: "Dry clean only.",
    fit: "Close at the bust, then loose all the way down to the ankle. Our model is 177cm and wearing a size S.",
    colours: [COLOURS.ink, COLOURS.fog],
    sizes: CLOTHING,
    stock: stock(CLOTHING, ["XS"]),
    images: gallery("Bias cut slip dress", IMG.slip),
    related: ["felted-wool-cape", "leather-column-bag", "sculpted-leather-loafer"],
  },
  // ── Tailoring ──
  {
    slug: "sculpted-shoulder-blazer",
    name: "Sculpted shoulder blazer",
    category: "tailoring",
    season: "aw26",
    price: { usd: 1240, ngn: ngn(1240) },
    short: "A strong, padded shoulder over a softly shaped waist.",
    description: "A single breasted blazer with a padded, extended shoulder and a waist that's gently taken in. It's half canvassed by hand, so it holds its shape and still feels soft.",
    composition: "Wool gabardine with a cupro lining. Horn buttons.",
    care: "Dry clean only.",
    fit: "A tailored fit. Go up a size if you like to layer underneath. Our model is 180cm and wearing a size M.",
    colours: [COLOURS.ink, COLOURS.stone],
    sizes: CLOTHING,
    stock: stock(CLOTHING, [], ["XL"]),
    images: gallery("Sculpted shoulder blazer", IMG.blazer),
    related: ["tailored-wide-leg-pants", "oversized-poplin-shirt", "sculpted-leather-loafer"],
  },
  // ── Trousers ──
  {
    slug: "raw-edge-wool-trouser",
    name: "Raw edge wool trouser",
    category: "trousers",
    season: "aw26",
    price: { usd: 640, ngn: ngn(640) },
    short: "High waisted and wide, with a hem we leave raw on purpose.",
    description: "Wide trousers with a high waist and a pressed crease. We leave the hem raw on purpose, and it softens the more you wear them.",
    composition: "100% virgin wool.",
    care: "Dry clean only.",
    fit: "High rise, wide leg, full length. Our model is 182cm and wearing a size M.",
    colours: [COLOURS.stone, COLOURS.ink],
    sizes: CLOTHING,
    stock: stock(CLOTHING, ["XS"]),
    images: gallery("Raw edge wool trouser", IMG.natural),
    related: ["wool-crepe-column-coat", "linen-wrap-shirt", "sculpted-leather-loafer"],
  },
  {
    slug: "tailored-wide-leg-pants",
    name: "Tailored wide leg pants",
    category: "trousers",
    season: "aw26",
    price: { usd: 720, ngn: ngn(720) },
    short: "Our signature pants. Pressed crease, raw hem, hidden adjusters.",
    description:
      "These are our signature pants. They're cut wide from heavy wool, with a front crease pressed in by hand and a raw hem that stops just above the floor. Instead of belt loops there are hidden adjusters at the sides, so you can get the waist exactly right.",
    composition: "100% heavy virgin wool, cotton pocketing.",
    care: "Dry clean only. To bring the crease back, press it under a damp cloth.",
    fit: "High rise, wide leg. Our model is 182cm and wearing a size M.",
    colours: [COLOURS.ink, COLOURS.stone, COLOURS.ivory],
    sizes: CLOTHING,
    stock: stock(CLOTHING, ["L"], ["S"]),
    images: gallery("Tailored wide leg pants", IMG.trouser),
    related: ["sculpted-shoulder-blazer", "oversized-poplin-shirt", "sculpted-leather-loafer", "embroidered-monogram-cap"],
  },
  // ── Shirts ──
  {
    slug: "linen-wrap-shirt",
    name: "Linen wrap shirt",
    category: "shirts",
    season: "aw26",
    price: { usd: 420, ngn: ngn(420) },
    short: "A shirt that wraps across and ties at the side.",
    description: "It wraps across the body and ties at the side. We wash it after it's made, so it's soft from the very first wear.",
    composition: "100% linen.",
    care: "Machine wash cold and hang it up to dry.",
    fit: "Relaxed, and you can adjust it at the tie. Our model is 178cm and wearing a size S.",
    colours: [COLOURS.chalk, COLOURS.ink],
    sizes: CLOTHING,
    stock: stock(CLOTHING),
    images: gallery("Linen wrap shirt", IMG.wrap),
    related: ["raw-edge-wool-trouser", "wool-crepe-column-coat", "silk-twill-scarf"],
  },
  {
    slug: "oversized-poplin-shirt",
    name: "Oversized poplin shirt",
    category: "shirts",
    season: "aw26",
    price: { usd: 380, ngn: ngn(380) },
    short: "Crisp cotton poplin with plenty of room.",
    description: "Crisp cotton poplin cut long and roomy, with a dropped shoulder and mother of pearl buttons sewn on by hand.",
    composition: "100% cotton poplin. Mother of pearl buttons.",
    care: "Machine wash at 30°. Iron it while it's still a little damp.",
    fit: "Oversized. Size down if you want it closer. Our model is 180cm and wearing a size S.",
    colours: [COLOURS.chalk, COLOURS.stone],
    sizes: CLOTHING,
    stock: stock(CLOTHING, ["XL"]),
    images: gallery("Oversized poplin shirt", IMG.poplin),
    related: ["tailored-wide-leg-pants", "pleated-silk-skirt", "sculpted-shoulder-blazer"],
  },
  // ── Footwear ──
  {
    slug: "sculpted-leather-loafer",
    name: "Sculpted leather loafer",
    category: "footwear",
    season: "aw26",
    price: { usd: 890, ngn: ngn(890) },
    short: "Our signature shoe. Hand stitched welt, stacked leather heel.",
    description:
      "Our signature shoe. A shaped loafer in vegetable tanned calf leather, built on a hand stitched welt so it can be resoled again and again, and set on a stacked leather heel.",
    composition: "Vegetable tanned calf leather upper and lining, leather sole, stacked leather heel.",
    care: "Wipe them clean and condition the leather every few months. Any good cobbler can resole them.",
    fit: "True to size. If you're a half size, go up.",
    colours: [COLOURS.ink, COLOURS.stone],
    sizes: SHOES,
    stock: stock(SHOES, ["EU 36", "EU 46"], ["EU 43"]),
    images: gallery("Sculpted leather loafer", IMG.shoe),
    related: ["tailored-wide-leg-pants", "wool-crepe-column-coat", "leather-ankle-boot"],
  },
  {
    slug: "leather-ankle-boot",
    name: "Leather ankle boot",
    category: "footwear",
    season: "aw26",
    price: { usd: 980, ngn: ngn(980) },
    short: "A slim ankle boot on the same stacked heel.",
    description: "A slim ankle boot with elastic sides, made in the same vegetable tanned leather as our loafer and set on the same stacked heel.",
    composition: "Vegetable tanned calf leather, leather sole.",
    care: "Wipe them clean and condition them regularly.",
    fit: "True to size.",
    colours: [COLOURS.ink],
    sizes: SHOES,
    stock: stock(SHOES, ["EU 38", "EU 45"]),
    images: gallery("Leather ankle boot", IMG.shoe2),
    related: ["raw-edge-wool-trouser", "felted-wool-cape", "sculpted-leather-loafer"],
  },
  // ── Headwear ──
  {
    slug: "embroidered-monogram-cap",
    name: "Embroidered monogram cap",
    category: "headwear",
    season: "aw26",
    price: { usd: 190, ngn: ngn(190) },
    short: "Our signature cap. Cotton twill, an embroidered M, a brass buckle.",
    description:
      "Our signature cap. Six panels of heavy cotton twill, the M stitched on the front, a brim that comes already curved, and a leather strap with a brass buckle at the back.",
    composition: "100% cotton twill, leather strap, brass buckle.",
    care: "Spot clean only.",
    fit: "Adjustable. S fits 54 to 56cm, M fits 56 to 58cm, L fits 58 to 60cm.",
    colours: [COLOURS.ink, COLOURS.ivory, COLOURS.stone],
    sizes: CAPS,
    stock: stock(CAPS, ["L"]),
    images: gallery("Embroidered monogram cap", IMG.cap, IMG.cap2),
    related: ["wool-crepe-column-coat", "oversized-poplin-shirt", "tailored-wide-leg-pants"],
  },
  {
    slug: "wool-felt-bucket-hat",
    name: "Wool felt bucket hat",
    category: "headwear",
    season: "aw26",
    price: { usd: 260, ngn: ngn(260) },
    short: "Soft felted wool with a wide, floppy brim.",
    description: "Soft felted wool with a wide brim that has no wire in it, so you can wear it down or flip it up.",
    composition: "100% wool felt.",
    care: "Brush it gently, and reshape it while it's damp.",
    fit: "S fits 55 to 56cm, M fits 57 to 58cm, L fits 59 to 60cm.",
    colours: [COLOURS.stone],
    sizes: CAPS,
    stock: stock(CAPS),
    images: gallery("Wool felt bucket hat", IMG.hat),
    related: ["felted-wool-cape", "silk-twill-scarf", "leather-column-bag"],
  },
  // ── Accessories ──
  {
    slug: "silk-twill-scarf",
    name: "Silk twill scarf",
    category: "accessories",
    season: "aw26",
    price: { usd: 290, ngn: ngn(290) },
    short: "Heavy silk twill with edges rolled by hand.",
    description: "A long scarf in heavy silk twill. The edges are rolled by hand and the M is printed tone on tone.",
    composition: "100% silk twill, 180 × 40 cm.",
    care: "Dry clean only.",
    fit: "One size.",
    colours: [COLOURS.ivory, COLOURS.ink],
    sizes: ONE,
    stock: stock(ONE),
    images: gallery("Silk twill scarf", IMG.lookAway),
    related: ["double-faced-cashmere-jacket", "pleated-silk-skirt", "wool-felt-bucket-hat"],
  },
  {
    slug: "leather-column-bag",
    name: "Leather column bag",
    category: "accessories",
    season: "aw26",
    price: { usd: 1150, ngn: ngn(1150) },
    short: "A tall, soft bag that gets darker the more you use it.",
    description: "A tall, soft bag in vegetable tanned leather. It softens and darkens as you carry it around. One pocket inside and a magnetic closure.",
    composition: "Vegetable tanned calf leather, cotton lining.",
    care: "Condition the leather now and then, and try to keep it out of the rain.",
    fit: "32 × 18 × 9 cm, with an adjustable strap.",
    colours: [COLOURS.ink, COLOURS.stone],
    sizes: ONE,
    stock: stock(ONE),
    images: gallery("Leather column bag", IMG.portraitW),
    related: ["bias-cut-slip-dress", "felted-wool-cape", "silk-twill-scarf"],
  },
];

/* ── Helpers ─────────────────────────────────────────────────── */
export const getSeason = (slug: string) => SEASONS.find((s) => s.slug === slug);
export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const productsForSeason = (season: string) => PRODUCTS.filter((p) => p.season === season);
export const deliveryCopy = DELIVERY;

export const isSoldOut = (p: Product, size: string) => (p.stock[size] ?? 0) <= 0;

/** "You may also like": same category first, then anything else, never related or itself. */
export function alsoLike(p: Product, count = 4) {
  const skip = new Set([p.slug, ...p.related]);
  const same = PRODUCTS.filter((x) => x.category === p.category && !skip.has(x.slug));
  const rest = PRODUCTS.filter((x) => x.category !== p.category && !skip.has(x.slug));
  return [...same, ...rest].slice(0, count);
}

/** Which size chart a product uses. */
export const sizeChartFor = (p: Product) =>
  p.category === "footwear" ? "shoes" : p.category === "headwear" ? "caps" : p.sizes.length === 1 ? "none" : "clothing";
