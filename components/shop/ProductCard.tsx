import Link from "next/link";
import EditorialImage from "@/components/EditorialImage";
import { formatPrice, type Product } from "@/lib/products";

/**
 * A product in the grid. Hovering wipes the second image up over the
 * first (bottom → top). Clicking expands the image into the product
 * page's main image (shared-element transition).
 */
export default function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const [main, alt] = product.images;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="product-card group block"
      data-transition="shared"
      data-cursor="view"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-loader-grey" data-shared-source>
        <EditorialImage src={main.src} alt={main.alt} sizes="(max-width: 767px) 50vw, 33vw" priority={priority} />
        {alt && (
          <div className="product-card-alt absolute inset-0" aria-hidden="true">
            <EditorialImage src={alt.src} alt="" sizes="(max-width: 767px) 50vw, 33vw" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-4">
        <p className="ui-label">{product.name}</p>
        <p className="ui-label shrink-0 text-stone">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
