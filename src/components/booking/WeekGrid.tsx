"use client";

import { useState } from "react";
import { toKey } from "../Calendar";
import { clsx } from "@/lib/clsx";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function WeekGrid({
  renderDay,
  renderFooter,
  selectedDay,
  onSelectDay,
  allowPast = false,
}: {
  renderDay: (dateKey: string, date: Date) => React.ReactNode;
  renderFooter?: (days: Date[]) => React.ReactNode;
  selectedDay?: string | null;
  onSelectDay?: (dateKey: string) => void;
  allowPast?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const base = startOfWeek(new Date());

  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const todayKey = toKey(new Date());
  const weekEnd = days[6];
  const title = `${weekStart.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: weekStart.getMonth() === weekEnd.getMonth() ? undefined : "long",
  })} – ${weekEnd.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  })}`;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOffset((v) => (allowPast ? v - 1 : Math.max(0, v - 1)))}
          disabled={!allowPast && offset === 0}
          aria-label="Предыдущая неделя"
          className="grid h-9 w-9 place-items-center rounded-lg border-gold disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-sub text-heading">
          {title}
          {offset === 0 && (
            <span className="ml-2 text-sm text-text/50">эта неделя</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setOffset((v) => v + 1)}
          aria-label="Следующая неделя"
          className="grid h-9 w-9 place-items-center rounded-lg border-gold"
        >
          ›
        </button>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-3">
          {days.map((date) => (
            <DayHeading
              key={`h-${toKey(date)}`}
              date={date}
              today={toKey(date) === todayKey}
              selected={selectedDay === toKey(date)}
              onSelect={onSelectDay}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-7 gap-3">
          {days.map((date) => (
            <div key={`c-${toKey(date)}`} className="space-y-2">
              {renderDay(toKey(date), date)}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {days.map((date) => (
          <div key={`m-${toKey(date)}`}>
            <DayHeading
              date={date}
              today={toKey(date) === todayKey}
              selected={selectedDay === toKey(date)}
              onSelect={onSelectDay}
            />
            <div className="mt-2 space-y-2">{renderDay(toKey(date), date)}</div>
          </div>
        ))}
      </div>

      {renderFooter?.(days)}
    </div>
  );
}

function DayHeading({
  date,
  today,
  selected,
  onSelect,
}: {
  date: Date;
  today: boolean;
  selected?: boolean;
  onSelect?: (dateKey: string) => void;
}) {
  const content = (
    <>
      <span
        className={clsx(
          "font-sub text-sm",
          today ? "text-accent" : "text-heading/80",
        )}
      >
        {WEEKDAYS[(date.getDay() + 6) % 7]}
      </span>
      <span className="text-xs text-text/50 md:ml-1">
        {date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
      </span>
    </>
  );

  const className = clsx(
    "flex w-full items-baseline gap-2 border-b pb-2 text-left transition md:block",
    selected
      ? "border-accent bg-accent/10"
      : today
        ? "border-accent"
        : "border-white/10",
    onSelect && "cursor-pointer hover:border-accent/70",
  );

  if (!onSelect) return <div className={className}>{content}</div>;

  return (
    <button type="button" onClick={() => onSelect(toKey(date))} className={className}>
      {content}
    </button>
  );
}
