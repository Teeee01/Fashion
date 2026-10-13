import type { Metadata } from "next";
import CollectionPage from "@/components/shop/CollectionPage";
import { PRODUCTS } from "@/lib/products";

export const metadata: Metadata = { title: "Collections — MAISON SÈVE" };

/** Every product, with the category filters. ?category=outerwear opens it filtered. */
export default function Page() {
  return (
    <CollectionPage
      label="Collections — All pieces"
      title="The collections"
      intro="Every piece in the house: outerwear, tailoring, dresses, shirts, trousers, footwear, headwear and accessories."
      products={PRODUCTS}
    />
  );
}
