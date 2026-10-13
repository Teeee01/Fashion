/* ──────────────────────────────────────────────────────────────
   Journal entries, newest first. Replace titles, categories, dates,
   links and images with your own; Unsplash links are placeholders.
   ────────────────────────────────────────────────────────────── */

export type Article = {
  number: string;
  /** The article's address: /journal/<slug>. */
  slug: string;
  title: string;
  category: string;
  date: string;
  href: string;
  image: string;
  alt: string;
  /** A one-line standfirst under the title. */
  standfirst: string;
  /** The article, one string per paragraph. Placeholder copy: replace with your own. */
  body: string[];
};

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=center&ar=7:9`;

export const ARTICLES: Article[] = [
  {
    number: "01",
    slug: "on-the-weight-of-cloth",
    title: "On the weight of cloth",
    category: "Essay",
    date: "12 Sep 2026",
    href: "/journal/on-the-weight-of-cloth",
    image: unsplash("1558769132-cb1aea458c5e"),
    alt: "Folds of heavy wool cloth",
    standfirst: "Why the weight of a fabric decides almost everything, and why we pick the cloth before we sketch a thing.",
    body: [
      "Nothing here starts with a sketch. It starts with a length of cloth on the cutting table. We pick it up, hold it high and watch how it falls.",
      "Weight is the first thing we decide. A wool crepe at 420 grams hangs straight down like a curtain. At 280 grams it moves when you move and catches the air. Neither one is better. They just say different things.",
      "There's a wall of swatches in the studio, sorted by how they hang instead of by colour. The column coat came from the heavy end of that wall. The slip dress came from the light end.",
      "Working this way means going along with what a fabric wants to do instead of fighting it. Honestly, most of the job is just paying attention.",
    ],
  },
  {
    number: "02",
    slug: "a-morning-at-the-mill",
    title: "A morning at the mill",
    category: "Atelier",
    date: "28 Aug 2026",
    href: "/journal/a-morning-at-the-mill",
    image: unsplash("1524634126442-357e0eac3c14"),
    alt: "Looms in a weaving mill",
    standfirst: "Six hours on the weaving floor with the family who spin our wool.",
    body: [
      "The mill gets going before it's light out. By the time we got there the looms had been running for an hour, and the whole floor hummed so low you felt it in your chest more than you heard it.",
      "Four generations of the same family have woven there. They still check every bolt by hand, running the edge under one bright lamp from end to end.",
      "We went to sign off on the season's crepe. We came home with three extra samples nobody asked for, little experiments the weavers had tried on a slow afternoon.",
      "One of them turned into our cashmere jacket. That's the best kind of surprise, the one you didn't even know to ask for.",
    ],
  },
  {
    number: "03",
    slug: "why-we-stopped-dyeing-black",
    title: "Why we stopped dyeing black",
    category: "Material",
    date: "09 Aug 2026",
    href: "/journal/why-we-stopped-dyeing-black",
    image: unsplash("1528459801416-a9e53bbf4e17"),
    alt: "Undyed fabric samples",
    standfirst: "Undyed fibre, natural colours, and the few black pieces we kept.",
    body: [
      "Black is one of the hardest colours to get right. A really deep black takes heavy dye, long baths and a lot of water.",
      "A couple of seasons ago we started asking which pieces actually needed it. It turned out to be far fewer than we thought.",
      "Ivory, stone and fog are just the colours our wool and linen already are, with a light wash. They age gently and don't need any dye at all.",
      "We kept black where it really counts. The column coat, the loafer and the cap. Everything else is the colour the fibre came in.",
    ],
  },
  {
    number: "04",
    slug: "twelve-hours-inside-one-coat",
    title: "Twelve hours inside one coat",
    category: "Process",
    date: "21 Jul 2026",
    href: "/journal/twelve-hours-inside-one-coat",
    image: unsplash("1490481651871-ab68de25d43d"),
    alt: "Garments hanging in the atelier",
    standfirst: "From the first cut to the last press, this is how the column coat gets made.",
    body: [
      "One column coat takes twelve hours of handwork, spread across four days and three pairs of hands.",
      "It starts on the inside, with the canvas. A layer of horsehair is stitched in by hand, so the chest keeps its shape without going stiff.",
      "The collar is set by eye, not by machine, and eased in a few millimetres at a time. The sleeves go in last, after the body has rested on the stand overnight.",
      "The final press takes about forty minutes. By the end, the coat has been handled more than two thousand times.",
    ],
  },
  {
    number: "05",
    slug: "the-case-for-mending",
    title: "The case for mending",
    category: "Essay",
    date: "30 Jun 2026",
    href: "/journal/the-case-for-mending",
    image: unsplash("1520004434532-668416a08753"),
    alt: "Hands darning a sleeve",
    standfirst: "Why everything we make comes with repairs for life.",
    body: [
      "We don't think a piece is finished when it leaves us. It's finished when it's worn out, and we'd like that to take a really long time.",
      "Anything we make can come back to us for repairs, for as long as you have it. Moth holes, worn cuffs, a lining that's given up. We fix them all by hand.",
      "A repair leaves a mark, and we don't try to hide it. A darn in matching thread is just proof that someone really lived in that cloth.",
      "Write to us and we'll tell you how to send something home.",
    ],
  },
];

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);
