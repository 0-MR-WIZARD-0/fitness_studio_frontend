"use client";

import { useMemo } from "react";
import { toKey } from "../Calendar";
import { WeekGrid } from "./WeekGrid";
import { clsx } from "@/lib/clsx";
import type { Slot } from "@/lib/api";

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function WeekSchedule({
  slots,
  isSelected,
  onPick,
  emptyText,
}: {
  slots: Slot[];
  isSelected: (slot: Slot) => boolean;
  onPick: (slot: Slot) => void;
  emptyText: string;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = toKey(new Date(s.startsAt));
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    }
    return map;
  }, [slots]);

  return (
    <WeekGrid
      renderDay={(key) => {
        const daySlots = byDay.get(key) ?? [];
        if (daySlots.length === 0)
          return <p className="px-1 text-xs text-text/30">нет занятий</p>;
        return daySlots.map((s) => (
          <SlotCard
            key={s.id}
            slot={s}
            picked={isSelected(s)}
            onPick={() => onPick(s)}
          />
        ));
      }}
      renderFooter={(days) =>
        days.some((d) => byDay.has(toKey(d))) ? null : (
          <p className="mt-5 text-sm text-text/60">
            {slots.length
              ? "На этой неделе занятий нет — листайте вперёд."
              : emptyText}
          </p>
        )
      }
    />
  );
}

function SlotCard({
  slot,
  picked,
  onPick,
}: {
  slot: Slot;
  picked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={clsx(
        "block w-full rounded-xl border px-3 py-2 text-left transition",
        picked
          ? "border-accent bg-accent/15"
          : "border-[color-mix(in_srgb,var(--color-border)_40%,transparent)] bg-surface/30 hover:bg-surface",
      )}
    >
      <span
        className={clsx(
          "block text-sm",
          slot.isDiagnostic ? "text-emerald-300" : "text-accent",
        )}
      >
        {slot.isDiagnostic ? "Диагностика — бесплатно" : slot.formatName}
      </span>
      <span className="block text-xs text-text/70">
        Тренер: {slot.trainerName ?? "уточняется"}
      </span>
      <span className="block font-sub text-lg text-heading">
        {timeOf(slot.startsAt)}
        <span className="ml-1 text-xs font-normal text-text/60">
          {slot.durationMin} мин
        </span>
      </span>
      <span className="mt-1 block text-xs text-text/50">
        осталось {slot.remaining} мест
      </span>
    </button>
  );
}
