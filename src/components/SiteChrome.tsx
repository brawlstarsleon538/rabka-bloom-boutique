import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, Instagram, Facebook, Phone } from "lucide-react";
import { useState } from "react";

import { Logo, PetalDivider } from "@/components/Logo";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/", label: "Strona główna" },
  { to: "/sklep", label: "Sklep" },
  { to: "/o-nas", label: "O nas" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <button
          className="p-2 text-muted-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>

        <Link to="/" className="shrink-0">
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link to="/koszyk" className="relative p-2 text-muted-foreground hover:text-primary">
          <ShoppingBag className="size-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>

      {open && (
        <nav className="border-t border-border/60 px-4 pb-4 pt-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 text-center">
        <Logo size="md" />
        <p className="script mt-4 text-xl text-sage">Kwiaty, które mówią więcej</p>
        <PetalDivider className="my-6" />
        <p className="text-sm text-muted-foreground">Rabka-Zdrój i okolice · dostawa tego samego dnia</p>
        <div className="mt-6 flex items-center justify-center gap-5 text-muted-foreground">
          <a href="tel:+48532136020" aria-label="Telefon" className="hover:text-primary">
            <Phone className="size-5" />
          </a>
          <a
            href="https://www.instagram.com/sivik_flowers"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="hover:text-primary"
          >
            <Instagram className="size-5" />
          </a>
          <a
            href="https://www.facebook.com/share/1CofRdJcS5/"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="hover:text-primary"
          >
            <Facebook className="size-5" />
          </a>
        </div>
        <p className="mt-8 text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} SiViK Flowers ·{" "}
          <Link to="/admin" className="hover:text-primary">
            Panel
          </Link>
        </p>
      </div>
    </footer>
  );
}
