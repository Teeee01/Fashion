import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPage from "@/components/shop/ProductPage";
import { PRODUCTS, getProduct, getSeason } from "@/lib/products";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product ? `${product.name} — MAISON SÈVE` : "MAISON SÈVE" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  return <ProductPage product={product} season={getSeason(product.season)!} />;
}
