"use client";

import { useState } from "react";
import { Container } from "../Container";
import { mediaUrl, type HomeHero, type Sphere } from "@/lib/api";
import { clsx } from "@/lib/clsx";

export function Hero({ hero }: { hero: HomeHero }) {
  const bg = mediaUrl(hero.imageUrl);

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden">
      {bg ? (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a2d24] via-[#2a2122] to-bg" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-transparent to-bg" />

      <Container className="relative z-10 flex flex-1 flex-col pt-24 pb-24 md:pt-28 lg:pb-28">
        <div className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-6">
          <div className="lg:col-span-7 lg:row-start-1 lg:pt-8">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              {hero.title}
            </h1>
            <p className="mt-3 font-sub text-base sm:text-lg md:text-2xl text-heading/90">
              {hero.subtitle}
            </p>
          </div>

          <div className="flex items-center justify-center lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <Spheres spheres={hero.spheres} />
          </div>

          <p className="max-w-2xl text-sm md:text-base leading-relaxed text-text/90 lg:col-span-7 lg:row-start-2 lg:self-end">
            {hero.description}
          </p>
        </div>
      </Container>

      <button
        onClick={() =>
          window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
        }
        aria-label="Листать вниз"
        className="animate-chevron absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-heading/80 hover:text-heading"
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      </button>
    </section>
  );
}

const POSITIONS = [
  "left-1/2 top-0 -translate-x-1/2",
  "bottom-0 left-0",
  "bottom-0 right-0",
];

function Spheres({ spheres }: { spheres: Sphere[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (!spheres?.length) return null;

  const visible = spheres.slice(0, POSITIONS.length);
  const current = active !== null ? visible[active] : null;

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative h-[220px] w-[240px] sm:h-[260px] sm:w-[280px] md:h-[320px] md:w-[340px]">
        {visible.map((sphere, i) => (
          <Circle
            key={sphere.label + i}
            className={POSITIONS[i]}
            label={sphere.label}
            active={active === i}
            onClick={() => setActive(active === i ? null : i)}
          />
        ))}
      </div>

      {current && current.items.length > 0 && (
        <div
          key={active}
          className="fade-up mt-5 max-w-sm text-center text-sm leading-relaxed text-text/90"
        >
          {current.items.map((it) => (
            <div key={it}>{it}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Circle({
  className,
  label,
  active,
  onClick,
}: {
  className?: string;
  label?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "absolute grid h-32 w-32 place-items-center rounded-full border backdrop-blur-[1px] transition duration-300 ease-out sm:h-36 sm:w-36 md:h-44 md:w-44",
        active
          ? "scale-105 border-accent bg-accent/15"
          : "border-accent/40 bg-white/[0.03] hover:scale-105 hover:border-accent/80 hover:bg-white/[0.07]",
        className,
      )}
    >
      <span className="px-2 text-center font-sub text-sm text-heading/90">
        {label}
      </span>
    </button>
  );
}
