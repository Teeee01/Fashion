/* ──────────────────────────────────────────────────────────────
   Journal entries, newest first. Replace titles, categories, dates,
   links and images with your own; Unsplash links are placeholders.
   ────────────────────────────────────────────────────────────── */

export type Article = {
  number: string;
  title: string;
  category: string;
  date: string;
  href: string;
  image: string;
  alt: string;
};

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=center&ar=7:9`;

export const ARTICLES: Article[] = [
  {
    number: "01",
    title: "On the weight of cloth",
    category: "Essay",
    date: "12 Sep 2026",
    href: "/#journal",
    image: unsplash("1558769132-cb1aea458c5e"),
    alt: "Folds of heavy wool cloth",
  },
  {
    number: "02",
    title: "A morning at the mill",
    category: "Atelier",
    date: "28 Aug 2026",
    href: "/#journal",
    image: unsplash("1524634126442-357e0eac3c14"),
    alt: "Looms in a weaving mill",
  },
  {
    number: "03",
    title: "Why we stopped dyeing black",
    category: "Material",
    date: "09 Aug 2026",
    href: "/#journal",
    image: unsplash("1528459801416-a9e53bbf4e17"),
    alt: "Undyed fabric samples",
  },
  {
    number: "04",
    title: "Twelve hours inside one coat",
    category: "Process",
    date: "21 Jul 2026",
    href: "/#journal",
    image: unsplash("1490481651871-ab68de25d43d"),
    alt: "Garments hanging in the atelier",
  },
  {
    number: "05",
    title: "The case for mending",
    category: "Essay",
    date: "30 Jun 2026",
    href: "/#journal",
    image: unsplash("1520004434532-668416a08753"),
    alt: "Hands darning a sleeve",
  },
];
