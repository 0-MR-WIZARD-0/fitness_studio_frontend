"use client";

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
  const transparent = pathname.startsWith("/formats/");

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 transition-colors",
        transparent
          ? "bg-gradient-to-b from-black/40 to-transparent"
          : "backdrop-blur-md bg-bg/55 border-b border-white/5",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-sub italic text-heading/90 tracking-wide">
          Логотип
        </Link>
        <nav className="flex items-center gap-6 md:gap-10 font-sub text-sm md:text-base">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "transition hover:text-accent",
                pathname.startsWith(l.href) ? "text-accent" : "text-heading/85",
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
      </Container>
    </header>
  );
}
