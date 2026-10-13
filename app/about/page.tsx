import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";
import { ABOUT } from "@/lib/about";

export const metadata: Metadata = { title: "About · Maison Sève", description: ABOUT.intro };

export default function Page() {
  return <AboutPage />;
}
