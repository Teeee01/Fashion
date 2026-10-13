import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorialPage from "@/components/EditorialPage";
import ProductCard from "@/components/shop/ProductCard";
import { LOOKBOOK_LOOKS, getLook } from "@/lib/lookbook";
import { getProduct, type Product } from "@/lib/products";

/* /look/09 … one lookbook image and every piece worn in it. */

export function generateStaticParams() {
  return LOOKBOOK_LOOKS.map((l) => ({ number: l.number }));
}

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const look = getLook((await params).number);
  return { title: look ? `Look ${look.number}: ${look.title} — MAISON SÈVE` : "MAISON SÈVE" };
}

export default async function Page({ params }: { params: Promise<{ number: string }> }) {
  const look = getLook((await params).number);
  if (!look) notFound();
  const products = look.products.map(getProduct).filter((p): p is Product => Boolean(p));
  const i = LOOKBOOK_LOOKS.indexOf(look);
  const next = LOOKBOOK_LOOKS[(i + 1) % LOOKBOOK_LOOKS.length];

  return (
    <EditorialPage
      label={`Lookbook — AW26 · Look ${look.number}`}
      title={look.title}
      standfirst={`${products.length} pieces in this look.`}
      image={look}
      aspect={look.number === "09" ? "aspect-[4/5] md:aspect-[16/9]" : "aspect-[4/5] md:aspect-[16/10]"}
    >
      <section aria-labelledby="look-pieces" className="mt-[14vh]">
        <div className="grid-12 mb-8">
          <h2 id="look-pieces" className="ui-label col-span-12" data-reveal="lines">
            In this look
          </h2>
        </div>
        <ul className="grid grid-cols-2 gap-x-gutter gap-y-12 px-pad md:grid-cols-4">
          {products.map((p) => (
            <li key={p.slug} className="product-item" data-reveal="card">
              <ProductCard product={p} sizes="(max-width: 767px) 50vw, 25vw" />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid-12 mt-[14vh]">
        <p className="mask col-span-12 flex justify-between border-t border-hairline pt-6">
          <span data-reveal="block" className="flex w-full justify-between">
            <Link href="/#lookbook" className="nav-link ui-label">
              ← Lookbook
            </Link>
            <Link href={`/look/${next.number}`} className="nav-link ui-label" data-transition-label={`Look ${next.number}`}>
              Next: Look {next.number} →
            </Link>
          </span>
        </p>
      </div>
    </EditorialPage>
  );
}
