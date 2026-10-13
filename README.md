# MAISON SÈVE

Website for Maison Sève: editorial, monochrome, slow cinematic motion.

## Running it on your computer

You only do this once:

1. Install **Node.js** (the "LTS" version) from https://nodejs.org. Click through the installer with the default options.
2. Download this project. On GitHub, click the green **Code** button, then **Download ZIP**, and unzip it somewhere easy to find, like your Desktop.
3. Open a terminal in the project folder:
   - **Mac:** open the *Terminal* app, type `cd ` (with a space after it), drag the project folder into the window, and press Enter.
   - **Windows:** open the project folder, click the address bar, type `cmd`, and press Enter.
4. Type `npm install` and press Enter. It downloads everything the site needs and takes a minute or two.

After that, any time you want to see the site:

5. In the same terminal, type `npm run dev` and press Enter.
6. Open **http://localhost:3000** in your browser. The page updates on its own as files change.
7. When you're done, click the terminal and press **Ctrl + C** to stop it.

## Where things live

| What | Where |
| --- | --- |
| Colours, grid, type styles | `app/globals.css` |
| Fonts (Bodoni Moda, Inter Tight) | `app/layout.tsx` |
| Motion rules (eases, durations, staggers) | `lib/motion.ts` |
| GSAP plugins (ScrollTrigger, SplitText, Flip, CustomEase) | `lib/gsap.ts` |
| Smooth scrolling (Lenis) | `components/SmoothScroll.tsx` |
| Preloader (counter + white column reveal) | `components/Preloader.tsx` |
| Reusable column reveal | `components/StairReveal.tsx` |
| Hero (monogram, captions, entrance and settle timing) | `components/hero/Hero.tsx` |
| Navigation (links, logo, frosted band, hide on scroll) | `components/Nav.tsx` |
| Mobile menu | `components/MobileMenu.tsx` |
| Custom cursor | `components/Cursor.tsx` |
| Manifesto section (01 — The House) | `components/Manifesto.tsx` |
| New collection section (02) | `components/collection/Collection.tsx` |
| **Collection looks: names and photos** | `lib/collection.ts` |
| Lookbook section (campaign + editorial grid) | `components/Lookbook.tsx` |
| **Lookbook photos** | `lib/lookbook.ts` |
| Signature Coat section (photo, callout text and positions) | `components/SignatureCoat.tsx` |
| Atelier section (photo, text, pattern, stats) | `components/Atelier.tsx` |
| **Atelier stats and text: put your real numbers here** | `lib/atelier.ts` |
| Section divider (hairline that draws itself) | `components/Hairline.tsx` |
| Campaign film section and full-screen player | `components/CampaignFilm.tsx` |
| **Campaign film (replace with yours)** | `public/campaign.mp4`, `public/campaign.webm`, `public/campaign-poster.jpg` |
| Journal section | `components/Journal.tsx` |
| **Journal entries (titles, dates, images)** | `lib/journal.ts` |
| Footer (newsletter, links, wordmark) | `components/Footer.tsx` |
| **Products and seasons (names, prices, photos, sizes, details)** | `lib/products.ts` |
| Collection page (`/collections/aw26`) | `components/shop/CollectionPage.tsx` |
| Product page (`/product/...`) | `components/shop/ProductPage.tsx` |
| Page transitions | `components/PageTransition.tsx` |
| Bag drawer | `components/BagDrawer.tsx` (bag contents: `lib/bag.ts`) |
| 3D ribbon | `components/hero/RibbonScene.tsx` |
| Ribbon video fallback (for devices without 3D) | `public/ribbon-loop.mp4` and `.webm` |
| Home page | `app/page.tsx` |
| Your photos | `public/images/` |

## Replacing placeholder photos

Until the real photography is ready, sections use placeholder editorial images from Unsplash, shown in
black and white. To swap one in, drop your photo (JPG or WebP, ideally at least 2000px on the long side)
into `public/images/`, then tell Claude which file goes where. For the collection, each look's photo and
name live in `lib/collection.ts`: changing a look's `src` to e.g. `"/images/look-01.jpg"` is all it takes.
Your own photos are shown in their original colour. If a photo can't be loaded, a grey panel with the
look number appears instead of a broken image.

## Notes

- The shop is front end only: "Add to bag" and the bag drawer work (and remember the bag in your browser),
  but checkout and the newsletter aren't connected to a payment or mailing service yet.

- Only the six brand colours exist in the styling system. Tailwind's default colours, rounded corners and
  shadows are switched off, so off-brand styles can't slip in by accident.
- If someone's device asks for reduced motion, every animation becomes a short 0.3s fade, smooth
  scrolling turns off, the preloader skips its count, the 3D ribbon holds still, and the pinned
  scroll sections (manifesto, signature coat, film, collection row) become ordinary sections.
- Phones (under 768px): 4 reveal columns instead of 6, a smaller ribbon centred behind the monogram,
  a swipe row instead of the pinned collection, no custom cursor, and MENU instead of the links.
- Keyboard users get a "Skip to content" link and a 1px ink focus outline on everything.
- To check animations in the browser console, add `?debug` to the address: GSAP is then available as
  `window.__seve`.
