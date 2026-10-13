import type { Metadata } from "next";
import CheckoutPage from "@/components/shop/CheckoutPage";

export const metadata: Metadata = { title: "Checkout · Maison Sève", robots: { index: false } };

export default function Page() {
  return <CheckoutPage />;
}
