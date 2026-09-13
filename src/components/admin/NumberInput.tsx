"use client";

import { useEffect, useState } from "react";
import { clsx } from "@/lib/clsx";

export function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  step,
  className,
  placeholder,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText((prev) => (prev === "" || Number(prev) === value ? prev : String(value)));
  }, [value]);

  const clamp = (n: number) => {
    let out = Number.isFinite(n) ? n : min;
    if (min !== undefined) out = Math.max(min, out);
    if (max !== undefined) out = Math.min(max, out);
    return out;
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      className={clsx("field", className)}
      value={text}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        onChange(raw === "" ? min : clamp(Number(raw)));
      }}
      onBlur={() => {
        const next = text === "" ? min : clamp(Number(text));
        setText(String(next));
        onChange(next);
      }}
    />
  );
}
