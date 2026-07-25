"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBooking } from "./BookingProvider";
import { Container } from "./Container";
import { clsx } from "@/lib/clsx";

const links = [
  { href: "/formats", label: "Форматы" },
  { href: "/reviews", label: "Отзывы" },
];

export function Nav() {
  const pathname = usePathname();
  const { open } = useBooking();
  const [menuOpen, setMenuOpen] = useState(false);
  const transparent = pathname.startsWith("/formats/");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-40 transition-colors",
          transparent && !menuOpen
            ? "bg-gradient-to-b from-black/40 to-transparent"
            : "backdrop-blur-md bg-bg/55 border-b border-white/5",
        )}
      >
        <Container className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="font-sub italic text-heading/90 tracking-wide"
          >
            Логотип
          </Link>

          <nav className="hidden items-center gap-6 font-sub text-sm md:flex md:gap-10 md:text-base">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "transition hover:text-accent",
                  pathname.startsWith(l.href)
                    ? "text-accent"
                    : "text-heading/85",
                )}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => open()}
              className="text-heading/85 transition hover:text-accent"
            >
              Запись
            </button>
          </nav>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            className="relative h-8 w-8 md:hidden"
          >
            <span
              className={clsx(
                "absolute left-1 h-0.5 w-6 bg-heading transition-all duration-300",
                menuOpen ? "top-1/2 rotate-45" : "top-2.5",
              )}
            />
            <span
              className={clsx(
                "absolute left-1 top-1/2 h-0.5 w-6 bg-heading transition-all duration-300",
                menuOpen && "opacity-0",
              )}
            />
            <span
              className={clsx(
                "absolute left-1 h-0.5 w-6 bg-heading transition-all duration-300",
                menuOpen ? "top-1/2 -rotate-45" : "top-[1.375rem]",
              )}
            />
          </button>
        </Container>
      </header>

      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 top-16 z-30 bg-bg/95 transition-transform duration-300 ease-out md:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!menuOpen}
      >
        <Container className="flex h-full flex-col gap-2 pt-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              tabIndex={menuOpen ? undefined : -1}
              className={clsx(
                "border-b border-white/10 py-4 font-sub text-2xl transition",
                pathname.startsWith(l.href) ? "text-accent" : "text-heading/90",
              )}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              open();
            }}
            tabIndex={menuOpen ? undefined : -1}
            className="border-b border-white/10 py-4 text-left font-sub text-2xl text-heading/90"
          >
            Запись
          </button>
        </Container>
      </div>
    </>
  );
}
