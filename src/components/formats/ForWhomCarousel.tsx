"use client";

import { SnapCarousel } from "../SnapCarousel";
import type { ForWhomItem } from "@/lib/api";

export function ForWhomCard({ item }: { item: ForWhomItem }) {
  return (
    <div className="flex aspect-[4/3] w-full flex-col overflow-hidden rounded-2xl border-gold bg-surface/60 p-6">
      <h3 className="shrink-0 font-sub text-lg text-heading">{item.title}</h3>
      <p className="no-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed text-text/85">
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
