"use client";

import { useRef, useState } from "react";
import { Container, Grid } from "../Container";
import { Placeholder } from "../Placeholder";
import { clsx } from "@/lib/clsx";
import type { HomeFaq } from "@/lib/api";

export function FaqTabs({ items }: { items: HomeFaq[] }) {
  const [activeId, setActiveId] = useState<number | null>(items[0]?.id ?? null);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToTabs = (id: number) => {
    const wide = window.innerWidth >= 748;
    const target = wide ? listRef.current : refs.current[id];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!items.length) return null;

  const active = items.find((i) => i.id === activeId) ?? items[0];

  return (
    <section className="pt-16 pb-0 md:py-24">
      <Container>
        <Grid className="items-start">
          <div
            ref={listRef}
            className="order-2 col-span-12 scroll-mt-28 space-y-3 lg:order-1 lg:col-span-7"
          >
            {items.map((item) => {
              const isOpen = item.id === activeId;
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    refs.current[item.id] = el;
                  }}
                  className="scroll-mt-28 rounded-2xl border-gold bg-surface/60 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      const next = isOpen ? null : item.id;
                      setActiveId(next);
                      if (next !== null)
                        setTimeout(() => scrollToTabs(item.id), 60);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left"
                  >
                    <span
                      className={clsx(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-accent/70 text-accent transition",
                        isOpen && "bg-accent text-bg",
                      )}
                    >
                      +
                    </span>
                    <span className="font-sub text-heading">
                      {item.question}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="px-5 pb-5 pl-15 text-sm leading-relaxed text-text/90 whitespace-pre-line">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="order-1 col-span-12 mb-6 lg:order-2 lg:col-span-5 lg:mb-0">
            <Placeholder
              src={active?.imageUrl}
              alt={active?.question}
              label="фото"
              className="aspect-[4/5] w-full"
            />
          </div>
        </Grid>
      </Container>
    </section>
  );
}
