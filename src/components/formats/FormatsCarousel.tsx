"use client";

import Link from "next/link";
import { SnapCarousel } from "../SnapCarousel";
import { mediaUrl, type Format } from "@/lib/api";

export function FormatsCarousel({
  formats,
  price,
  className,
}: {
  formats: Format[];
  price?: number;
  className?: string;
}) {
  return (
    <SnapCarousel
      items={formats}
      keyOf={(f) => f.id}
      labelOf={(f) => f.name}
      className={className}
      renderItem={(f) => <Card format={f} price={price} />}
    />
  );
}

function Card({
  format,
  price,
}: {
  format: Format;
  price?: number;
}) {
  const img = mediaUrl(format.heroImageUrl);
  return (
    <div>
      <Link
        href={`/formats/${format.slug}`}
        className="relative block aspect-video overflow-hidden rounded-2xl border-gold bg-surface"
      >
        {img ? (
          <img
            src={img}
            alt={format.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#4a3826] to-[#2a2122]" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 grid place-items-center p-4">
          <span className="text-center font-sub text-xl text-heading">
            {format.name}
          </span>
        </div>
      </Link>
      {price !== undefined && (
        <div className="mt-3 px-1 text-center text-sm leading-relaxed">
          <p>
            Цена за занятие — {price.toLocaleString("ru-RU")} руб.
          </p>
          <p className="text-text/60">{format.durationMin} мин</p>
        </div>
      )}
    </div>
  );
}
