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
| 3D ribbon | `components/hero/RibbonScene.tsx` |
| Ribbon video fallback (for devices without 3D) | `public/ribbon-loop.mp4` and `.webm` |
| Home page | `app/page.tsx` |
| Your photos | `public/images/` |

## Replacing placeholder photos

Until the real photography is ready, sections use placeholder editorial images. To swap one in, drop your
photo (JPG or WebP, ideally at least 2000px on the long side) into `public/images/`, then tell Claude
which file goes where.

## Notes

- Only the six brand colours exist in the styling system. Tailwind's default colours, rounded corners and
  shadows are switched off, so off-brand styles can't slip in by accident.
- If someone's device asks for reduced motion, every animation becomes a short 0.3s fade and smooth
  scrolling turns off.
