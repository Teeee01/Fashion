/* ──────────────────────────────────────────────────────────────
   Products and seasons. Replace names, prices, images and details
   with your own; Unsplash links are placeholders (two or more images
   per product: the first is the main image, the second shows on hover).
   ────────────────────────────────────────────────────────────── */

export type Category = "outerwear" | "dresses" | "tailoring" | "accessories";

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dresses", label: "Dresses" },
  { id: "tailoring", label: "Tailoring" },
  { id: "accessories", label: "Accessories" },
];

export type Product = {
  slug: string;
  name: string;
  price: number; // in euros
  category: Category;
  season: string;
  images: { src: string; alt: string }[];
  sizes: string[];
  description: string;
  composition: string;
  fit: string;
};

export type Season = { slug: string; title: string; short: string; intro: string };

export const SEASONS: Season[] = [
  {
    slug: "aw26",
    title: "Autumn–Winter 2026",
    short: "AW26",
    intro: "Wool, silk and linen, cut slowly. Twelve pieces for women and men.",
  },
];

const img = (id: string, alt: string) => ({
  src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces,top&ar=3:4`,
  alt,
});

const APPAREL = ["XS", "S", "M", "L", "XL"];
const ONE = ["One size"];

export const PRODUCTS: Product[] = [
  {
    slug: "wool-crepe-column-coat",
    name: "Wool crepe column coat",
    price: 1890,
    category: "outerwear",
    season: "aw26",
    images: [img("1509631179647-0177331693ae", "Column coat, front"), img("1539109136881-3be0616acf4b", "Column coat, in motion"), img("1485968579580-b6d095142e6e", "Column coat, detail")],
    sizes: APPAREL,
    description: "A long, unlined coat that falls straight from the shoulder. Hand-rolled lapels, concealed placket.",
    composition: "100% wool crepe. Horn buttons. Dry clean only.",
    fit: "Relaxed through the body; take your usual size.",
  },
  {
    slug: "double-faced-cashmere-jacket",
    name: "Double-faced cashmere jacket",
    price: 1650,
    category: "outerwear",
    season: "aw26",
    images: [img("1496747611176-843222e1e57c", "Cashmere jacket, front"), img("1529139574466-a303027c1d8b", "Cashmere jacket, side")],
    sizes: APPAREL,
    description: "Two layers of cashmere woven as one, so the jacket needs no lining and drapes like a blanket.",
    composition: "100% double-faced cashmere. Dry clean only.",
    fit: "Cropped at the hip; relaxed sleeve.",
  },
  {
    slug: "pleated-silk-skirt",
    name: "Pleated silk skirt",
    price: 780,
    category: "dresses",
    season: "aw26",
    images: [img("1515886657613-9f3515b0c78f", "Pleated skirt, front"), img("1487222477894-8943e31ef7b2", "Pleated skirt, movement")],
    sizes: APPAREL,
    description: "Knife pleats set by hand, released at the hip so the skirt moves before you do.",
    composition: "100% silk crêpe de chine. Hand wash cold.",
    fit: "Sits at the natural waist; midi length.",
  },
  {
    slug: "bias-cut-slip-dress",
    name: "Bias-cut slip dress",
    price: 960,
    category: "dresses",
    season: "aw26",
    images: [img("1485968579580-b6d095142e6e", "Slip dress, front"), img("1515886657613-9f3515b0c78f", "Slip dress, back")],
    sizes: APPAREL,
    description: "Cut on the bias from a single length of silk satin, with fine rouleau straps.",
    composition: "100% silk satin. Dry clean only.",
    fit: "Close at the bust, falling loose to the ankle.",
  },
  {
    slug: "sculpted-shoulder-blazer",
    name: "Sculpted shoulder blazer",
    price: 1240,
    category: "tailoring",
    season: "aw26",
    images: [img("1529139574466-a303027c1d8b", "Blazer, front"), img("1496747611176-843222e1e57c", "Blazer, side")],
    sizes: APPAREL,
    description: "A single-breasted blazer with a padded, extended shoulder and a softly cinched waist.",
    composition: "Wool gabardine; cupro lining. Dry clean only.",
    fit: "Tailored fit; size up for layering.",
  },
  {
    slug: "raw-edge-wool-trouser",
    name: "Raw-edge wool trouser",
    price: 640,
    category: "tailoring",
    season: "aw26",
    images: [img("1503342217505-b0a15ec3261c", "Wool trouser, front"), img("1506794778202-cad84cf45f1d", "Wool trouser, detail")],
    sizes: APPAREL,
    description: "Wide, high-waisted trousers with a pressed crease and a deliberately raw hem.",
    composition: "100% virgin wool. Dry clean only.",
    fit: "High rise, wide leg, full length.",
  },
  {
    slug: "linen-wrap-shirt",
    name: "Linen wrap shirt",
    price: 420,
    category: "tailoring",
    season: "aw26",
    images: [img("1539109136881-3be0616acf4b", "Wrap shirt, front"), img("1509631179647-0177331693ae", "Wrap shirt, worn open")],
    sizes: APPAREL,
    description: "A shirt that wraps and ties at the side, washed for softness.",
    composition: "100% linen. Machine wash cold.",
    fit: "Relaxed; adjustable at the tie.",
  },
  {
    slug: "felted-wool-cape",
    name: "Felted wool cape",
    price: 1420,
    category: "outerwear",
    season: "aw26",
    images: [img("1487222477894-8943e31ef7b2", "Cape, front"), img("1485968579580-b6d095142e6e", "Cape, back")],
    sizes: ["S/M", "L/XL"],
    description: "Boiled and felted wool cut as a single circle, closed with one horn toggle.",
    composition: "100% felted wool. Dry clean only.",
    fit: "Oversized; two sizes cover the range.",
  },
  {
    slug: "silk-twill-scarf",
    name: "Silk twill scarf",
    price: 290,
    category: "accessories",
    season: "aw26",
    images: [img("1524504388940-b1c1722653e1", "Silk scarf, worn"), img("1534528741775-53994a69daeb", "Silk scarf, knot")],
    sizes: ONE,
    description: "A long scarf in heavy silk twill with hand-rolled edges.",
    composition: "100% silk twill, 180 × 40 cm. Dry clean only.",
    fit: "One size.",
  },
  {
    slug: "leather-column-bag",
    name: "Leather column bag",
    price: 1150,
    category: "accessories",
    season: "aw26",
    images: [img("1445205170230-053b83016050", "Column bag, carried"), img("1469334031218-e382a71b716b", "Column bag, in the landscape")],
    sizes: ONE,
    description: "A tall, soft bag in vegetable-tanned leather that softens and darkens with use.",
    composition: "Vegetable-tanned calf leather; cotton lining.",
    fit: "32 × 18 × 9 cm; adjustable strap.",
  },
];

export const getSeason = (slug: string) => SEASONS.find((s) => s.slug === slug);
export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const productsForSeason = (season: string) => PRODUCTS.filter((p) => p.season === season);

export const formatPrice = (euros: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(euros);
