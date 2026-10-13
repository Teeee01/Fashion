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
    standfirst: "How a garment's weight decides the way it moves, and why we design from the cloth outward.",
    body: [
      "Every piece in the house begins on the cutting table with a length of cloth and nothing else. Before a sketch, before a silhouette, we hold it up and let it fall.",
      "Weight is the first decision. A wool crepe at 420 grams hangs in a single clean line; at 280 it moves with the wearer and catches the air. Neither is better. They are different sentences.",
      "We keep a wall of swatches in the atelier, arranged not by colour but by how they drape. The column coat came from the heaviest end of that wall; the slip dress from the lightest.",
      "Designing from the cloth outward means accepting what a fabric wants to do. The work is mostly in listening.",
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
      "The mill starts before light. By the time we arrive the looms have been running for an hour, and the floor hums at a pitch you feel in your chest more than hear.",
      "The family has woven here for four generations. They still finish every bolt by hand, checking the selvedge along its full length under a single bright lamp.",
      "We came to approve the season's crepe. We left with three new samples nobody had asked for: experiments the weavers had made on a quiet afternoon.",
      "One of them became the double-faced cashmere. It is the best kind of commission: the one that arrives unrequested.",
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
    standfirst: "On undyed fibre, natural tones and the black we kept.",
    body: [
      "Black is the hardest colour to make well. Deep black needs heavy dyes, long baths and a great deal of water.",
      "Two seasons ago we began to ask which pieces truly needed it. The answer was fewer than we thought.",
      "Ivory, stone and fog are the natural colours of the wools and linens we use, lightly washed. They age softly and need no dye at all.",
      "We kept black where it earns its place: the column coat, the loafer, the cap. Everything else is the colour of the fibre itself.",
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
    standfirst: "From first cut to final press: the making of the column coat.",
    body: [
      "The column coat takes twelve hours of hand work, spread over four days and three pairs of hands.",
      "It begins with the canvas: a horsehair interlining pad-stitched by hand so the chest holds its shape without stiffness.",
      "The collar is set by eye, not by machine, and eased into place a few millimetres at a time. The sleeves are hung last, after the body has rested overnight on the form.",
      "The final press takes forty minutes. By then the coat has been touched by hand more than two thousand times.",
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
    standfirst: "Why every piece comes with a lifetime of repairs.",
    body: [
      "A garment is not finished when it leaves the atelier. It is finished when it is worn out, and we would like that to take a very long time.",
      "Every piece we make can come back to us for repair, for as long as you own it. Moth holes, worn cuffs, a lining that has given way: we mend them by hand.",
      "Mending leaves a mark, and we do not hide it. A darn in matching thread is a record of a life lived in the cloth.",
      "Write to the atelier and we will tell you how to send a piece home.",
    ],
  },
];

export const getArticle = (slug: string) => ARTICLES.find((a) => a.slug === slug);
