"use client";

import Link from "next/link";
import { itemKey, useBag } from "@/lib/bag";
import { useCurrency, formatAmount, amountIn } from "@/lib/currency";
import { getProduct } from "@/lib/products";
import Drawer from "./Drawer";
import EditorialImage from "./EditorialImage";
import QtyStepper from "./QtyStepper";

/** The bag: each item with image, name, size, colour, quantity and remove; then the subtotal and CHECKOUT. */
export default function BagDrawer() {
  const { items, open, count, closeBag, setQty, remove } = useBag();
  const { currency, money } = useCurrency();
  const lines = items.map((i) => ({ ...i, product: getProduct(i.slug) })).filter((l) => l.product);
  const total = lines.reduce((sum, l) => sum + amountIn(l.product!.price, currency) * l.qty, 0);

  return (
    <Drawer
      open={open}
      onClose={closeBag}
      label="Your bag"
      title={`Bag (${count})`}
      footer={
        lines.length > 0 && (
          <div className="mask mt-6">
            <div className="drawer-rise border-t border-hairline pt-5">
              <div className="flex items-baseline justify-between">
                <p className="ui-label">Subtotal</p>
                <p className="ui-label">{formatAmount(total, currency)}</p>
              </div>
              <Link
                href="/checkout"
                onClick={closeBag}
                className="btn-ink ui-label mt-5 block w-full py-4 text-center"
                data-transition-label="Checkout"
              >
                <span>Checkout</span>
              </Link>
              <p className="ui-label mt-3 text-center text-stone">Delivery and duties calculated at checkout</p>
            </div>
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <p className="mask">
          <span className="drawer-rise block font-display text-[28px] leading-[1.1]">Your bag is empty.</span>
        </p>
      ) : (
        <ul>
          {lines.map((l) => {
            const p = l.product!;
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
