"use client";

import { Fragment, useState } from "react";
import { Container } from "../Container";
import { useBooking } from "../BookingProvider";
import { mediaUrl, type HomeStep } from "@/lib/api";
import { clsx } from "@/lib/clsx";

export function StepsShowcase({ steps }: { steps: HomeStep[] }) {
  const [active, setActive] = useState(0);
  const { open } = useBooking();

  if (!steps.length) return null;
  const step = steps[active];
  const bg = mediaUrl(step.imageUrl);

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {bg ? (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#5a4a3a] via-[#3a3026] to-[#211b16]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/30" />

      <Container className="relative flex min-h-screen flex-col justify-between py-24">
        <div>
          <h2 className="max-w-md text-5xl md:text-7xl font-bold text-white drop-shadow">
            Начни уже сегодня
          </h2>
          <button
            onClick={() => open(undefined, "diagnostic")}
            className="btn-gold mt-6"
          >
            Записаться
          </button>
        </div>

        <div className="max-w-2xl">
          <p className="text-sm md:text-base leading-relaxed text-white font-medium drop-shadow">
            {step.title}
            {step.description ? ` — ${step.description}` : ""}
          </p>
          <p className="mt-4 font-sub text-white drop-shadow">{step.label}</p>

          <div className="mt-4 flex items-center">
            {steps.map((s, i) => (
              <Fragment key={s.id}>
                <button
                  onClick={() => setActive(i)}
                  aria-label={s.label}
                  className={clsx(
                    "h-4 w-4 shrink-0 rounded-full border-2 border-white transition",
                    i <= active ? "bg-white" : "bg-transparent",
                    i === active && "scale-125",
                  )}
                />
                {i < steps.length - 1 && (
                  <span
                    className={clsx(
                      "h-0 flex-1 border-t-2",
                      i < active
                        ? "border-solid border-white"
                        : "border-dashed border-white/70",
                    )}
                  />
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
