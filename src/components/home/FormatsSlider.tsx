"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Grid } from "../Container";
import { mediaUrl, type Format } from "@/lib/api";
import { clsx } from "@/lib/clsx";

const PER_PAGE = 3;
const MAX_DOTS = 5;

export function FormatsSlider({
  formats,
  title = "Наши форматы",
}: {
  formats: Format[];
  title?: string;
}) {
  const [page, setPage] = useState(0);

  if (!formats.length) return null;

  const pages = Math.min(Math.ceil(formats.length / PER_PAGE), MAX_DOTS);
  const start = page * PER_PAGE;
  const visible = formats.slice(start, start + PER_PAGE);

  return (
    <section className="py-12 md:py-16">
      <Container>
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>

        <Grid className="mt-8 items-stretch">
          {visible.map((f, i) => (
            <FormatCard key={f.id} format={f} highlight={start === 0 && i === 0} />
          ))}
        </Grid>

        {pages > 1 && (
          <div className="mt-8 flex justify-center gap-2.5">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Страница ${i + 1}`}
                className={clsx(
                  "h-2.5 rounded-full transition-all",
                  i === page ? "w-7 bg-accent" : "w-2.5 bg-text/30 hover:bg-text/50",
                )}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
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
    <Link
      href={`/formats/${format.slug}`}
      className="group relative col-span-12 h-60 overflow-hidden rounded-2xl border-gold bg-surface md:col-span-4"
    >
      {img ? (
        <img
          src={img}
          alt={format.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        highlight && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#4a3826] to-[#2a2122]" />
        )
      )}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <span className="text-center font-sub text-xl text-heading">
          {format.name}
        </span>
      </div>
    </Link>
  );
}
