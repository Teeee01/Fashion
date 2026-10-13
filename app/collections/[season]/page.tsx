import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionPage from "@/components/shop/CollectionPage";
import { SEASONS, getSeason, productsForSeason } from "@/lib/products";

export function generateStaticParams() {
  return SEASONS.map((s) => ({ season: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ season: string }> }): Promise<Metadata> {
  const season = getSeason((await params).season);
  return { title: season ? `${season.title} · Maison Sève` : "MAISON SÈVE" };
}

export default async function Page({ params }: { params: Promise<{ season: string }> }) {
  const season = getSeason((await params).season);
  if (!season) notFound();
  return (
    <CollectionPage
      label={`Collection · ${season.short}`}
      title={season.title}
      intro={season.intro}
      products={productsForSeason(season.slug)}
    />
  );
}
