"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { mediaUrl, type Format } from "@/lib/api";
import { clsx } from "@/lib/clsx";

export function FormatsCarousel({
  formats,
  showPrices = false,
  className,
}: {
  formats: Format[];
  showPrices?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (!formats.length) return null;

  const nearestIndex = () => {
    const track = trackRef.current;
    if (!track) return 0;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const goTo = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[i];
    if (!track || !card) return;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    const rect = card.getBoundingClientRect();
    setActive(i);
    track.scrollBy({
      left: rect.left + rect.width / 2 - center,
      behavior: "smooth",
    });
  };

  return (
    <div className={className}>
      <div
        ref={trackRef}
        onScroll={() => setActive(nearestIndex())}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[14vw] py-1"
      >
        {formats.map((f, i) => (
          <div key={f.id} className="w-[72vw] shrink-0 snap-center">
            <Card format={f} showPrices={showPrices} dimmed={i !== active} />
          </div>
        ))}
      </div>

      {formats.length > 1 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {formats.map((f, i) => (
            <button
              key={f.id}
              onClick={() => goTo(i)}
              aria-label={f.name}
              className={clsx(
                "h-2.5 rounded-full transition-all",
                i === active ? "w-7 bg-accent" : "w-2.5 bg-text/30",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  format,
  showPrices,
  dimmed,
}: {
  format: Format;
  showPrices?: boolean;
  dimmed?: boolean;
}) {
  const img = mediaUrl(format.heroImageUrl);
  return (
    <div
      className={clsx(
        "transition duration-300",
        dimmed ? "scale-95 opacity-70" : "scale-100 opacity-100",
      )}
    >
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
      {showPrices && (
        <div className="mt-3 px-1 text-sm leading-relaxed">
          <p>
            Цена за занятие — {format.pricePerSession.toLocaleString("ru-RU")} руб.
          </p>
          <p>Курс — {format.priceCourse.toLocaleString("ru-RU")} руб.</p>
        </div>
      )}
    </div>
  );
}
