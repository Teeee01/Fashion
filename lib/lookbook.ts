/* ──────────────────────────────────────────────────────────────
   Lookbook imagery. Swap any `src` for your own photo in /public/images
   (e.g. "/images/campaign.jpg"). Unsplash links are placeholders.
   ────────────────────────────────────────────────────────────── */

const unsplash = (id: string, ar: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces,center&ar=${ar}`;

export const CAMPAIGN = {
  src: unsplash("1469334031218-e382a71b716b", "16:9"),
  alt: "Campaign image: a model in a long coat in an open landscape",
};

/* The editorial grid: mixed sizes, some offset vertically. `speed` sets
   how far each image drifts with scroll (higher = more), for depth. */
export type GridImage = {
  src: string;
  alt: string;
  /** Tailwind classes placing it on the 12-column grid (mobile first). */
  place: string;
  /** Frame shape. */
  aspect: string;
  speed: number;
};

export const LOOKBOOK_GRID: GridImage[] = [
  {
    src: unsplash("1534528741775-53994a69daeb", "4:5"),
    alt: "Close portrait in soft side light",
    place: "col-span-12 md:col-start-1 md:col-span-6",
    aspect: "aspect-[4/5]",
    speed: 0.6,
  },
  {
    src: unsplash("1506794778202-cad84cf45f1d", "3:4"),
    alt: "Portrait of a man in a dark jacket",
    place: "col-span-8 col-start-5 mt-[12vh] md:col-start-8 md:col-span-5 md:mt-[24vh]",
    aspect: "aspect-[3/4]",
    speed: 1.4,
  },
  {
    src: unsplash("1524504388940-b1c1722653e1", "2:3"),
    alt: "Model looking away from the camera",
    place: "col-span-7 mt-[8vh] md:col-start-2 md:col-span-4 md:mt-[10vh]",
    aspect: "aspect-[2/3]",
    speed: 0.9,
  },
  {
    src: unsplash("1445205170230-053b83016050", "3:2"),
    alt: "Model in a wide-brimmed hat, seen from the side",
    place: "col-span-12 mt-[8vh] md:col-start-7 md:col-span-6 md:mt-[34vh]",
    aspect: "aspect-[3/2]",
    speed: 1.2,
  },
  {
    src: unsplash("1507003211169-0a1dd7228f2d", "4:5"),
    alt: "Portrait of a man in natural light",
    place: "col-span-8 col-start-3 mt-[8vh] md:col-start-4 md:col-span-4 md:mt-[14vh]",
    aspect: "aspect-[4/5]",
    speed: 0.8,
  },
];
