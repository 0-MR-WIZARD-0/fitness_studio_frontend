"use client";

import { Container } from "../Container";
import { mediaUrl, type HomeHero } from "@/lib/api";

export function Hero({ hero }: { hero: HomeHero }) {
  const bg = mediaUrl(hero.imageUrl);

  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden">
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

      <Container className="relative z-10 h-full">
        <div className="grid h-full grid-cols-12 gap-6">
          <div className="col-span-12 flex flex-col justify-between lg:col-span-7">
            <div className="pt-28 md:pt-32">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                {hero.title}
              </h1>
              <p className="mt-3 font-sub text-lg md:text-2xl text-heading/90">
                {hero.subtitle}
              </p>
            </div>
            <p className="mb-24 max-w-2xl text-sm md:text-base leading-relaxed text-text/90">
              {hero.description}
            </p>
          </div>

          <div className="col-span-12 flex items-center justify-center lg:col-span-5">
            <Spheres spheres={hero.spheres} />
          </div>
        </div>
      </Container>

      <button
        onClick={() =>
          window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
        }
        aria-label="Листать вниз"
        className="animate-chevron absolute bottom-8 left-1/2 -translate-x-1/2 text-heading/80 hover:text-heading"
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 14l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      </button>
    </section>
  );
}

function Spheres({ spheres }: { spheres: HomeHero["spheres"] }) {
  if (!spheres?.length) return null;
  const items = spheres.flatMap((s) => s.items);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[280px] w-[300px] md:h-[320px] md:w-[340px]">
        <Circle className="left-1/2 top-0 -translate-x-1/2" label={spheres[0]?.label} />
        <Circle className="bottom-0 left-0" label={spheres[1]?.label} />
        <Circle className="bottom-0 right-0" label={spheres[2]?.label} />
      </div>
      {items.length > 0 && (
        <div className="mt-4 text-center text-xs leading-relaxed text-text/70">
          {items.map((it) => (
            <div key={it}>{it}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function Circle({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={`absolute grid h-40 w-40 place-items-center rounded-full border border-accent/40 bg-white/[0.03] backdrop-blur-[1px] md:h-44 md:w-44 ${className ?? ""}`}
    >
      <span className="px-2 text-center font-sub text-sm text-heading/90">
        {label}
      </span>
    </div>
  );
}
