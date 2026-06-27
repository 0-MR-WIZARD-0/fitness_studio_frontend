"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function Calendar({
  selected,
  onSelect,
  isMarked,
  minToday = true,
}: {
  selected?: string | null;
  onSelect: (dateKey: string) => void;
  isMarked?: (dateKey: string) => boolean;
  minToday?: boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();

  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const canPrev =
    new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="rounded-2xl border-gold bg-surface/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(year, month - 1, 1))}
          disabled={canPrev ? false : minToday}
          className="grid h-8 w-8 place-items-center rounded-lg border-gold disabled:opacity-30"
          aria-label="Предыдущий месяц"
        >
          ‹
        </button>
        <span className="font-sub text-heading capitalize">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="grid h-8 w-8 place-items-center rounded-lg border-gold"
          aria-label="Следующий месяц"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-text/50">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = toKey(date);
          const isPast = minToday && date < today;
          const marked = isMarked?.(key) ?? false;
          const isSelected = selected === key;
          const isToday = key === toKey(today);

          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(key)}
              className={clsx(
                "relative grid aspect-square place-items-center rounded-lg text-sm transition",
                isPast && "text-text/25 cursor-default",
                !isPast && !isSelected && "hover:bg-surface-2 text-text",
                isSelected && "bg-accent text-bg font-semibold",
                !isSelected && isToday && "ring-1 ring-accent/60",
              )}
            >
              {date.getDate()}
              {marked && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
