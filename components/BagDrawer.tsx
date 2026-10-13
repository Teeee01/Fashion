"use client";

import Link from "next/link";
import { itemKey, useBag, type BagItem } from "@/lib/bag";
import { useCurrency, formatAmount, amountIn } from "@/lib/currency";
import { getProduct, type Product } from "@/lib/products";
import Drawer from "./Drawer";
import EditorialImage from "./EditorialImage";
import QtyStepper from "./QtyStepper";

type Line = BagItem & { product: Product };

/**
 * The bag drawer, in two views:
 *   "added" (opens by itself after ADD TO BAG): the item just added, the
 *           bag subtotal, VIEW BAG and CHECKOUT.
 *   "bag"   (the nav's Checkout link, or VIEW BAG): every item with
 *           quantity and remove, the subtotal and CHECKOUT.
 */
export default function BagDrawer() {
  const { items, open, view, lastKey, count, closeBag, showWholeBag, setQty, remove } = useBag();
  const { currency, money } = useCurrency();
  const lines = items.map((i) => ({ ...i, product: getProduct(i.slug) })).filter((l): l is Line => !!l.product);
  const total = lines.reduce((sum, l) => sum + amountIn(l.product.price, currency) * l.qty, 0);
  const just = view === "added" ? lines.find((l) => itemKey(l) === lastKey) : undefined;

  const checkout = (
    <Link href="/checkout" onClick={closeBag} className="btn-ink ui-label block w-full py-4 text-center" data-transition-label="Checkout">
      <span>Checkout</span>
    </Link>
  );

  return (
    <Drawer
      open={open}
      onClose={closeBag}
      label={just ? "Added to your bag" : "Your bag"}
      title={just ? "Added to your bag" : `Bag (${count})`}
      footer={
        lines.length > 0 && (
          <div className="mask mt-6">
            <div className="drawer-rise border-t border-hairline pt-5">
              <div className="flex items-baseline justify-between">
                <p className="ui-label">Subtotal{just ? ` · ${count} ${count === 1 ? "item" : "items"}` : ""}</p>
                <p className="ui-label">{formatAmount(total, currency)}</p>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {just && (
                  <button type="button" onClick={showWholeBag} className="ui-label block w-full border border-ink py-4 text-center transition-colors duration-500 hover:bg-ink hover:text-ivory">
                    View bag ({count})
                  </button>
                )}
                {checkout}
              </div>
              <p className="ui-label mt-3 text-center text-stone">We&apos;ll work out delivery and duties at checkout</p>
            </div>
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <p className="mask">
          <span className="drawer-rise block font-display text-[28px] leading-[1.1]">Your bag is empty.</span>
        </p>
      ) : just ? (
        <div className="mask border-t border-hairline">
          <div className="drawer-rise flex gap-4 py-5">
            <Link href={`/product/${just.slug}`} onClick={closeBag} className="relative aspect-[3/4] w-[96px] shrink-0 overflow-hidden bg-loader-grey">
              <EditorialImage src={just.product.images[0].src} alt={just.product.images[0].alt} sizes="96px" />
            </Link>
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div>
                <p className="font-display text-[22px] leading-[1.1]">{just.product.name}</p>
                <p className="ui-label mt-2 text-stone">
                  {just.colour} · Size {just.size}
                </p>
                <p className="ui-label mt-1 text-stone">Quantity {just.qty}</p>
              </div>
              <p className="ui-label">{money(just.product.price, just.qty)}</p>
            </div>
          </div>
        </div>
      ) : (
        <ul>
          {lines.map((l) => {
            const p = l.product;
            const key = itemKey(l);
            const stockLeft = p.stock[l.size] ?? 0;
            return (
              <li key={key} className="mask border-t border-hairline">
                <div className="drawer-rise flex gap-4 py-5">
                  <Link href={`/product/${p.slug}`} onClick={closeBag} className="relative aspect-[3/4] w-[84px] shrink-0 overflow-hidden bg-loader-grey">
                    <EditorialImage src={p.images[0].src} alt={p.images[0].alt} sizes="84px" />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <div>
                      <Link href={`/product/${p.slug}`} className="font-display text-[20px] leading-[1.1]" onClick={closeBag}>
                        {p.name}
                      </Link>
                      <p className="ui-label mt-2 text-stone">
                        {l.colour} · {l.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <QtyStepper value={l.qty} max={Math.max(stockLeft, 1)} onChange={(n) => setQty(key, n)} />
                      <p className="ui-label">{money(p.price, l.qty)}</p>
                    </div>
                    <button type="button" className="nav-link ui-label relative self-start text-stone" onClick={() => remove(key)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}
