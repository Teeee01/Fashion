"use client";

import Link from "next/link";
import EditorialImage from "@/components/EditorialImage";
import { useCurrency } from "@/lib/currency";
import type { Product } from "@/lib/products";

/**
 * A product card, used everywhere (collections, related products, looks).
 * Hovering wipes the second image up over the first (bottom → top).
 * Clicking expands the image into the product page's main image
 * (shared-element transition).
 */
export default function ProductCard({ product, priority, sizes }: { product: Product; priority?: boolean; sizes?: string }) {
  const [main, alt] = product.images;
  const { money } = useCurrency();
  const s = sizes ?? "(max-width: 767px) 50vw, 33vw";
  return (
    <Link href={`/product/${product.slug}`} className="product-card group block" data-transition="shared" data-cursor="view">
      <div className="relative aspect-[3/4] overflow-hidden bg-loader-grey" data-shared-source>
        <EditorialImage src={main.src} alt={main.alt} sizes={s} priority={priority} />
        {alt && (
          <div className="product-card-alt absolute inset-0" aria-hidden="true">
            <EditorialImage src={alt.src} alt={alt.alt} sizes={s} />
          </div>
        )}
      </div>
      <div className="mask mt-3">
        <div className="product-meta flex items-baseline justify-between gap-4">
          <p className="ui-label">{product.name}</p>
          <p className="ui-label shrink-0 text-stone">{money(product.price)}</p>
        </div>
      </div>
    </Link>
  );
}
