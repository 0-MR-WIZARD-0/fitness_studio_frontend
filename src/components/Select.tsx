"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

export interface Option {
  value: string | number;
  label: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Выберите…",
  className,
}: {
  value: string | number | null;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-border)_50%,transparent)] bg-bg px-4 py-[0.7rem] text-left text-heading outline-none transition focus:border-accent"
      >
        <span className={clsx(!current && "text-text/50")}>
          {current?.label ?? placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={clsx("shrink-0 transition-transform", open && "rotate-180")}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto no-scrollbar rounded-xl border-gold bg-surface py-1 shadow-xl">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={clsx(
                  "block w-full px-4 py-2 text-left text-sm transition",
                  o.value === value
                    ? "bg-accent/20 text-heading"
                    : "text-text hover:bg-surface-2",
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
