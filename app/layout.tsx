import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Inter_Tight } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Cursor from "@/components/Cursor";
import Footer from "@/components/Footer";
import { INTRO_SEEN_KEY } from "@/lib/intro-key";
import "lenis/dist/lenis.css";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter-tight",
  display: "swap",
});

const BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js','is-preloading');try{if(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='1')d.setAttribute('data-intro-seen','')}catch(e){}})()`;

export const metadata: Metadata = {
  title: "MAISON SÈVE",
  description: "Maison Sève — womenswear and menswear.",
};

export const viewport: Viewport = {
  themeColor: "#F2F1EE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${interTight.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: marks JS as on (so [data-reveal] elements wait for GSAP),
            locks native scroll for the preloader, and flags returning visits so the counter never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <SmoothScroll>
          <Preloader />
          <Nav />
          {children}
          <Footer />
          <Cursor />
        </SmoothScroll>
      </body>
    </html>
  );
}
