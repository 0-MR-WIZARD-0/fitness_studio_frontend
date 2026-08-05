"use client";

import { useMemo, useState } from "react";
import { toKey } from "../Calendar";
import { clsx } from "@/lib/clsx";
import type { Announcement, Format, Slot } from "@/lib/api";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

const LINE = "border-[color-mix(in_srgb,var(--color-border)_35%,transparent)]";

interface Row {
  key: string;
  label: string;
  hint?: string;
  slots: Slot[];
  announcements: Announcement[];
}

export function WeekMatrix({
  formats,
  slots,
  announcements,
  isSelected,
  onPick,
  isAnnouncementSelected,
  onPickAnnouncement,
  selectedDay,
  onSelectDay,
  emptyText = "На этой неделе занятий нет — листайте вперёд.",
  limitForward = false,
}: {
  formats: Format[];
  slots: Slot[];
  announcements: Announcement[];
  isSelected: (slot: Slot) => boolean;
  onPick: (slot: Slot) => void;
  isAnnouncementSelected: (announcement: Announcement) => boolean;
  onPickAnnouncement: (announcement: Announcement) => void;
  selectedDay?: string | null;
  onSelectDay?: (dateKey: string) => void;
  emptyText?: string;
  limitForward?: boolean;
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
  const dayKeys = days.map(toKey);
  const inWeek = (iso: string) => dayKeys.includes(toKey(new Date(iso)));

  const weekKey = dayKeys.join(",");
  const rows: Row[] = useMemo(() => {
    const keys = weekKey.split(",");
    const thisWeek = <T extends { startsAt: string }>(items: T[]) =>
      items.filter((x) => keys.includes(toKey(new Date(x.startsAt))));

    const list: Row[] = [];

    const money = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;

    for (const f of formats) {
      const own = thisWeek(
        slots.filter((s) => !s.isDiagnostic && s.formatId === f.id),
      );
      if (!own.length) continue;
      list.push({
        key: `f-${f.id}`,
        label: f.name,
        hint: money(f.pricePerSession),
        slots: own,
        announcements: [],
      });
    }

    const diagnostics = thisWeek(slots.filter((s) => s.isDiagnostic));
    if (diagnostics.length)
      list.push({
        key: "diag",
        label: "Диагностика",
        hint: "бесплатно",
        slots: diagnostics,
        announcements: [],
      });

    for (const a of thisWeek(announcements)) {
      list.push({
        key: `a-${a.id}`,
        label: a.title,
        hint: a.isFree ? "бесплатно" : money(a.price),
        slots: [],
        announcements: [a],
      });
    }

    return list;
  }, [formats, slots, announcements, weekKey]);

  const todayKey = toKey(new Date());
  const weekEnd = days[6];

  // дальше листать некуда, если после текущей недели занятий нет
  const lastEvent = [...slots, ...announcements].reduce(
    (max, item) => Math.max(max, +new Date(item.startsAt)),
    0,
  );
  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(weekEnd.getDate() + 1);
  const forwardBlocked =
    limitForward && (!lastEvent || lastEvent < nextWeekStart.getTime());
  const title = `${weekStart.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: weekStart.getMonth() === weekEnd.getMonth() ? undefined : "long",
  })} – ${weekEnd.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  })}`;

  const cellSlots = (row: Row, dayKey: string) =>
    row.slots
      .filter((s) => toKey(new Date(s.startsAt)) === dayKey)
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const cellAnnouncements = (row: Row, dayKey: string) =>
    row.announcements
      .filter((a) => toKey(new Date(a.startsAt)) === dayKey)
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  const weekEmpty =
    !slots.some((s) => inWeek(s.startsAt)) &&
    !announcements.some((a) => inWeek(a.startsAt));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOffset((v) => Math.max(0, v - 1))}
          disabled={offset === 0}
          aria-label="Предыдущая неделя"
          className="grid h-9 w-9 place-items-center rounded-lg border-gold disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-sub text-heading">
          {title}
          {offset === 0 && (
            <span className="ml-2 text-sm text-text/50">текущая неделя</span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setOffset((v) => v + 1)}
          disabled={forwardBlocked}
          title={forwardBlocked ? "Дальше занятий пока нет" : undefined}
          aria-label="Следующая неделя"
          className="grid h-9 w-9 place-items-center rounded-lg border-gold disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* Десктоп: форматы × дни */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[minmax(120px,150px)_repeat(7,minmax(0,1fr))]">
          <div className={clsx("border-b", LINE)} />
          {days.map((date) => {
            const key = toKey(date);
            const Tag = onSelectDay ? "button" : "div";
            return (
              <Tag
                key={`h-${key}`}
                {...(onSelectDay
                  ? { type: "button" as const, onClick: () => onSelectDay(key) }
                  : {})}
                className={clsx(
                  "border-b border-l px-2 pb-2 text-center",
                  LINE,
                  key === todayKey && "border-b-accent",
                  selectedDay === key && "bg-accent/10",
                  onSelectDay && "cursor-pointer hover:bg-surface",
                )}
              >
                <span
                  className={clsx(
                    "font-sub text-sm",
                    key === todayKey ? "text-accent" : "text-heading/80",
                  )}
                >
                  {WEEKDAYS[(date.getDay() + 6) % 7]}
                </span>
                <span className="ml-1 text-xs text-text/50">
                  {date.toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </Tag>
            );
          })}

          {rows.map((row) => (
            <div key={row.key} className="contents">
              <div className={clsx("border-b py-3 pr-3", LINE)}>
                <p className="font-sub text-sm text-heading">{row.label}</p>
                {row.hint && (
                  <p className="text-xs text-text/60">{row.hint}</p>
                )}
              </div>
              {dayKeys.map((dayKey) => (
                <div
                  key={`${row.key}-${dayKey}`}
                  className={clsx("space-y-1.5 border-b border-l p-2", LINE)}
                >
                  {cellSlots(row, dayKey).map((s) => (
                    <SlotChip
                      key={s.id}
                      slot={s}
                      picked={isSelected(s)}
                      onPick={() => onPick(s)}
                    />
                  ))}
                  {cellAnnouncements(row, dayKey).map((a) => (
                    <AnnouncementChip
                      key={a.id}
                      announcement={a}
                      picked={isAnnouncementSelected(a)}
                      onPick={() => onPickAnnouncement(a)}
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Мобильный: по дням */}
      <div className="space-y-4 md:hidden">
        {days.map((date) => {
          const key = toKey(date);
          const daySlots = rows.flatMap((r) => cellSlots(r, key));
          const dayAnn = rows.flatMap((r) => cellAnnouncements(r, key));
          daySlots.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
          return (
            <div key={`m-${key}`}>
              <div
                onClick={onSelectDay ? () => onSelectDay(key) : undefined}
                className={clsx(
                  "flex items-baseline gap-2 border-b pb-2",
                  key === todayKey ? "border-accent" : LINE,
                  selectedDay === key && "bg-accent/10",
                )}
              >
                <span
                  className={clsx(
                    "font-sub text-sm",
                    key === todayKey ? "text-accent" : "text-heading/80",
                  )}
                >
                  {WEEKDAYS[(date.getDay() + 6) % 7]}
                </span>
                <span className="text-xs text-text/50">
                  {date.toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {daySlots.length === 0 && dayAnn.length === 0 && (
                  <p className="px-1 text-xs text-text/30">нет занятий</p>
                )}
                {daySlots.map((s) => (
                  <SlotChip
                    key={s.id}
                    slot={s}
                    picked={isSelected(s)}
                    onPick={() => onPick(s)}
                    withFormat
                  />
                ))}
                {dayAnn.map((a) => (
                  <AnnouncementChip
                    key={a.id}
                    announcement={a}
                    picked={isAnnouncementSelected(a)}
                    onPick={() => onPickAnnouncement(a)}
                    withTitle
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {weekEmpty && (
        <p className="mt-5 text-sm text-text/60">
          {emptyText}
        </p>
      )}
    </div>
  );
}

function Dot({ free }: { free: boolean }) {
  return (
    <span
      className={clsx(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        free ? "bg-emerald-400" : "bg-red-400",
      )}
      aria-hidden
    />
  );
}

function SlotChip({
  slot,
  picked,
  onPick,
  withFormat = false,
}: {
  slot: Slot;
  picked: boolean;
  onPick: () => void;
  withFormat?: boolean;
}) {
  const full = slot.remaining <= 0;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={full}
      className={clsx(
        "block w-full rounded-lg border px-2.5 py-2 text-left transition",
        full
          ? "cursor-not-allowed border-white/10 bg-surface/20 opacity-60"
          : picked
            ? "border-accent bg-accent/15"
            : "border-[color-mix(in_srgb,var(--color-border)_35%,transparent)] bg-surface/30 hover:bg-surface",
      )}
    >
      <span className="flex items-center gap-1.5">
        <Dot free={!full} />
        <span className="font-sub text-heading">{timeOf(slot.startsAt)}</span>
        <span className="text-xs text-text/50">{slot.durationMin} мин</span>
      </span>
      {withFormat && (
        <>
          <span
            className={clsx(
              "mt-0.5 block text-xs",
              slot.isDiagnostic ? "text-emerald-300" : "text-accent",
            )}
          >
            {slot.isDiagnostic ? "Диагностика" : slot.formatName}
          </span>
          <span className="block text-xs text-text/60">
            {slot.isDiagnostic || slot.pricePerSession === 0
              ? "бесплатно"
              : `${slot.pricePerSession.toLocaleString("ru-RU")} ₽`}
          </span>
        </>
      )}
      <span className="mt-0.5 block text-xs text-text/70">
        {slot.trainerName ?? "тренер уточняется"}
      </span>
      <span className="block text-xs text-text/50">
        {full ? "мест нет" : `свободно: ${slot.remaining}/${slot.capacity}`}
      </span>
    </button>
  );
}

function AnnouncementChip({
  announcement,
  picked,
  onPick,
  withTitle = false,
}: {
  announcement: Announcement;
  picked: boolean;
  onPick: () => void;
  withTitle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={clsx(
        "block w-full rounded-lg border px-2.5 py-2 text-left transition",
        picked
          ? "border-accent bg-accent/20"
          : "border-accent/40 bg-accent/5 hover:bg-accent/15",
      )}
    >
      <span className="flex items-center gap-1.5">
        <Dot free />
        <span className="font-sub text-heading">
          {timeOf(announcement.startsAt)}
        </span>
        <span className="text-xs text-text/50">
          {announcement.durationMin} мин
        </span>
      </span>
      {withTitle && (
        <>
          <span className="mt-0.5 block text-xs text-accent">
            {announcement.title}
          </span>
          <span className="block text-xs text-text/60">
            {announcement.isFree
              ? "бесплатно"
              : `${announcement.price.toLocaleString("ru-RU")} ₽`}
          </span>
        </>
      )}
      <span className="mt-0.5 block text-xs text-text/70">
        {announcement.trainerName ?? "тренер уточняется"}
      </span>
    </button>
  );
}
