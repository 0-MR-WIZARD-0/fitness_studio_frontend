"use client";

import { useState } from "react";
import { useBooking } from "../BookingProvider";
import type { Format, SiteSettings } from "@/lib/api";

export function BookFormatButton({
  formatId,
  format,
  settings,
  className = "btn-gold",
  children = "Записаться",
}: {
  formatId?: number;
  format?: Pick<Format, "name" | "inSchedule" | "contactUrl" | "scheduleNote">;
  settings?: SiteSettings | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useBooking();
  const [asking, setAsking] = useState(false);
  const offSchedule = format && !format.inSchedule;

  return (
    <>
      <button
        onClick={() => (offSchedule ? setAsking(true) : open(formatId))}
        className={className}
      >
        {children}
      </button>

      {asking && format && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overlay-dim backdrop-blur-sm p-4"
          onClick={() => setAsking(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border-gold bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-sub text-xl text-heading">{format.name}</h3>

            {format.scheduleNote.trim() && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text/85">
                {format.scheduleNote}
              </p>
            )}

            <p className="mt-4 text-sm leading-relaxed text-text/80">
              Для записи на формат «{format.name}» свяжитесь с нами
              {settings?.phone ? (
                <>
                  {" "}
                  по телефону{" "}
                  <a
                    href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
                    className="text-accent hover:underline"
                  >
                    {settings.phone}
                  </a>
                </>
              ) : null}
              {format.contactUrl.trim() && (
                <>
                  {settings?.phone ? " или " : " "}
                  <a
                    href={format.contactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    по ссылке
                  </a>
                </>
              )}
              .
            </p>

            <button
              onClick={() => setAsking(false)}
              className="btn-gold mt-5 w-full"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}
