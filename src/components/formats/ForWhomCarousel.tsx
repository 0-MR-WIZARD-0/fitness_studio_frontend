"use client";

import { SnapCarousel } from "../SnapCarousel";
import type { ForWhomItem } from "@/lib/api";

export function ForWhomCard({ item }: { item: ForWhomItem }) {
  return (
    <div className="h-full w-full rounded-2xl border-gold bg-surface/60 p-6">
      <h3 className="font-sub text-lg text-heading">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text/85">
        {item.description}
      </p>
    </div>
  );
}

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
      itemClassName="w-[72vw] md:w-[calc((100%-2rem)/3)]"
      trackClassName="-mx-5 px-[14vw] md:mx-0 md:px-0"
      renderItem={(item) => <ForWhomCard item={item} />}
    />
  );
}
