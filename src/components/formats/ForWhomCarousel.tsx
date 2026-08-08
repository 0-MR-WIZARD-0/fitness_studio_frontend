"use client";

import { SnapCarousel } from "../SnapCarousel";
import type { ForWhomItem } from "@/lib/api";

export function ForWhomCarousel({
  items,
  className,
}: {
  items: ForWhomItem[];
  className?: string;
}) {
  return (
    <SnapCarousel
      items={items}
      keyOf={(i) => i.id}
      labelOf={(i) => i.title}
      className={className}
      renderItem={(item) => (
        <div className="h-full rounded-2xl border-gold bg-surface/60 p-6">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-accent/70" />
          <h3 className="mt-4 font-sub text-lg text-heading">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text/85">
            {item.description}
          </p>
        </div>
      )}
    />
  );
}
