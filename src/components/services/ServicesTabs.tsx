"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { clsx } from "@/lib/clsx";

type Tab = "services" | "halls";

export function ServicesTabs({
  services,
  halls,
}: {
  services: React.ReactNode;
  halls: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("services");

  const tabs: [Tab, string][] = [
    ["services", "Услуги"],
    ["halls", "Доступ к залам"],
  ];

  return (
    <>
      <Container>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {tabs.map(([key, label]) => (
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
            </button>
          ))}
        </div>
      </Container>

      {tab === "services" ? services : halls}
    </>
  );
}
