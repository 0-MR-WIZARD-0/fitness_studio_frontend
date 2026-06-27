"use client";

import { useBooking } from "../BookingProvider";

export function BookFormatButton({
  formatId,
  className = "btn-gold",
  children = "Записаться",
}: {
  formatId?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useBooking();
  return (
    <button onClick={() => open(formatId)} className={className}>
      {children}
    </button>
  );
}
