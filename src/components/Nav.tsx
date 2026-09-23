"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useBooking } from "./BookingProvider";
import { useAccount } from "./account/AccountProvider";
import { Container } from "./Container";
import { clsx } from "@/lib/clsx";
import Logo from "../../public/logo.svg";
import Image from "next/image";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useBooking();
  const { user, openAuth } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const openAccount = () => {
    setMenuOpen(false);
    if (user) router.push("/account");
    else openAuth("login");
  };

  const items: {
    label: string;
    href?: string;
    onClick?: () => void;
    active: boolean;
  }[] = [
    {
      label: "Форматы",
      href: "/formats",
      active: pathname.startsWith("/formats"),
    },
    {
      label: "Запись",
      onClick: () => {
        setMenuOpen(false);
        open();
      },
      active: pathname.startsWith("/booking"),
    },
    {
      label: "Дополнительные услуги",
      href: "/services",
      active: pathname.startsWith("/services"),
    },
    {
      label: "Отзывы",
      href: "/reviews",
      active: pathname.startsWith("/reviews"),
    },
    {
      label: "Кабинет",
      onClick: openAccount,
      active: pathname.startsWith("/account"),
    },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-bg/55 backdrop-blur-md transition-colors">
        <Container className="flex h-20 items-center justify-between">
          <Link href="/" className="flex h-full items-center">
            <Image
              src={Logo}
              alt="Триединство"
              className="h-[90%] w-auto"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 font-sub text-sm lg:flex lg:gap-10 lg:text-base">
            {items.map((item) => {
              const className = clsx(
                "transition hover:text-accent",
                item.active ? "text-accent" : "text-heading/85",
              );
              return item.href ? (
                <Link key={item.label} href={item.href} className={className}>
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={className}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            className="relative h-8 w-8 lg:hidden"
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
          "fixed inset-x-0 bottom-0 top-20 z-30 overflow-hidden lg:hidden",
          menuOpen ? "" : "pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <div
          className={clsx(
            "h-full w-full bg-bg/95 transition-transform duration-300 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <Container className="flex h-full flex-col gap-2 pt-8">
            {items.map((item) => {
              const className = clsx(
                "border-b border-white/10 py-3.5 text-left font-sub text-lg transition",
                item.active ? "text-accent" : "text-heading/90",
              );
              return item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  tabIndex={menuOpen ? undefined : -1}
                  className={className}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  tabIndex={menuOpen ? undefined : -1}
                  className={className}
                >
                  {item.label}
                </button>
              );
            })}
          </Container>
        </div>
      </div>
    </>
  );
}
