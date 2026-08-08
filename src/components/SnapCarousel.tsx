"use client";

import { useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

export function SnapCarousel<T>({
  items,
  keyOf,
  labelOf,
  renderItem,
  className,
}: {
  items: T[];
  keyOf: (item: T) => string | number;
  labelOf?: (item: T, index: number) => string;
  renderItem: (item: T, state: { active: boolean }) => React.ReactNode;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (!items.length) return null;

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
        {items.map((item, i) => (
          <div key={keyOf(item)} className="w-[72vw] shrink-0 snap-center">
            <div
              className={clsx(
                "h-full transition duration-300",
                i === active ? "scale-100 opacity-100" : "scale-95 opacity-70",
              )}
            >
              {renderItem(item, { active: i === active })}
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {items.map((item, i) => (
            <button
              key={keyOf(item)}
              onClick={() => goTo(i)}
              aria-label={labelOf?.(item, i) ?? `Слайд ${i + 1}`}
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
