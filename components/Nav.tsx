import Link from "next/link";
import { forwardRef } from "react";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Collections", href: "/#collections" },
  { label: "Lookbook", href: "/#lookbook" },
  { label: "Atelier", href: "/#atelier" },
  { label: "Journal", href: "/#journal" },
  { label: "Contact", href: "/#contact" },
];

/**
 * Starting layout: six links spread evenly across the full width.
 * Sits above the preloader layer so it can stagger in over the rising columns.
 */
const Nav = forwardRef<HTMLElement>(function Nav(_, ref) {
  return (
    <nav ref={ref} aria-label="Main" className="fixed inset-x-0 top-[20px] z-[1100] px-pad">
      <ul className="flex justify-between">
        {NAV_LINKS.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="nav-link ui-label inline-block">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
});

export default Nav;
