"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grid } from "@/components/Container";
import { FormatsCarousel } from "@/components/formats/FormatsCarousel";
import { CoursePromo } from "@/components/CoursePromo";
import { clsx } from "@/lib/clsx";
import { mediaUrl, type Format } from "@/lib/api";

type Tab = "main" | "extra";

export function FormatTabs({
  main,
  extra,
  threshold,
}: {
  main: Format[];
  extra: Format[];
  threshold: number;
}) {
  const [tab, setTab] = useState<Tab>("main");
  const withTabs = extra.length > 0;
  const items = withTabs && tab === "extra" ? extra : main;

  const tabs: [Tab, string, number][] = [
    ["main", "Основные форматы", main.length],
    ["extra", "Дополнительные форматы", extra.length],
  ];

  return (
    <div>
      {withTabs && (
        <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
          {tabs.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={clsx(
                "rounded-xl border px-4 py-2 transition",
                tab === key
                  ? "border-accent bg-accent/15 text-heading"
                  : "border-white/15 text-text/70 hover:bg-surface-2/50",
              )}
            >
              {label}
              <span className="ml-2 text-text/50">{count}</span>
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-10 text-center text-text/60">
          В этой группе пока нет форматов.
        </p>
      ) : (
        <>
          <FormatsCarousel
            key={tab}
            formats={items}
            className="mt-10 md:hidden"
          />

          <Grid className="mt-12 hidden items-stretch md:grid">
            {items.map((f, i) => (
              <FormatCard key={f.id} format={f} highlight={i === 0} />
            ))}
          </Grid>
        </>
      )}

      {tab === "main" && (
        <>
          <CoursePromo className="mt-12" threshold={threshold} />
          <div className="mt-10 flex justify-center md:justify-end">
            <Link href="/survey" className="btn-gold">
              Пройти опрос и подобрать формат
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function FormatCard({
  format,
  highlight,
}: {
  format: Format;
  highlight?: boolean;
}) {
  const img = mediaUrl(format.heroImageUrl);
  return (
    <div className="col-span-12 md:col-span-4 flex flex-col">
      <Link
        href={`/formats/${format.slug}`}
        className="group relative h-72 overflow-hidden rounded-2xl border-gold bg-surface"
      >
        {img ? (
          <Image
            src={img}
            alt={format.name}
            fill
            sizes="(max-width: 768px) 72vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          highlight && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a3826] to-[#2a2122]" />
          )
        )}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 grid place-items-center p-4">
          <span className="font-sub text-2xl text-heading text-center">
            {format.name}
          </span>
        </div>
      </Link>
      <div className="mt-4 px-1 text-center text-sm leading-relaxed">
        <p>Цена за занятие — {format.price.toLocaleString("ru-RU")} руб.</p>
        <p className="text-text/60">{format.durationMin} мин</p>
      </div>
    </div>
  );
}
