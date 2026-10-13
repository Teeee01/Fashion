import type { Metadata } from "next";
import CollectionPage from "@/components/shop/CollectionPage";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = { title: "Collections · Maison Sève" };

/** Every product, with the category filters. ?category=outerwear opens it filtered. */
export default function Page() {
  return (
    <CollectionPage
      label="Collections · Everything"
      title="The collections"
      intro="Everything we make, all in one place. Coats, tailoring, dresses, shirts, trousers, shoes, hats and bags."
      products={PRODUCTS}
    />
  );
}
