"use client";

import { useState } from "react";
import { Container, Grid } from "../Container";
import { Placeholder } from "../Placeholder";
import { clsx } from "@/lib/clsx";
import type { HomeFaq } from "@/lib/api";

export function FaqTabs({ items }: { items: HomeFaq[] }) {
  const [activeId, setActiveId] = useState<number | null>(
    items[0]?.id ?? null,
  );
  const active = items.find((i) => i.id === activeId) ?? items[0];

  if (!items.length) return null;

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Grid className="items-start">
          <div className="col-span-12 lg:col-span-7 space-y-3">
            {items.map((item) => {
              const isOpen = item.id === activeId;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border-gold bg-surface/60 overflow-hidden"
                >
                  <button
                    onClick={() => setActiveId(isOpen ? null : item.id)}
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

          <div className="col-span-12 lg:col-span-5">
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
