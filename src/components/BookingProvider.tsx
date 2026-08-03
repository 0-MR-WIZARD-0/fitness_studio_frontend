"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";

type Tab = "lesson" | "diagnostic";

interface BookingCtx {
  open: (formatId?: number, tab?: Tab) => void;
}
const Ctx = createContext<BookingCtx | null>(null);

export function useBooking(): BookingCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking вне BookingProvider");
  return ctx;
}

export function bookingHref(formatId?: number, tab: Tab = "lesson") {
  if (tab === "diagnostic") return "/booking?tab=diagnostic";
  return formatId ? `/booking?format=${formatId}` : "/booking";
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const open = (formatId?: number, tab: Tab = "lesson") => {
    router.push(bookingHref(formatId, tab));
  };

  return <Ctx.Provider value={{ open }}>{children}</Ctx.Provider>;
}
