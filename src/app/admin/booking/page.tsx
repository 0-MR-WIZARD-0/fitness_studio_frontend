"use client";

import { useEffect, useMemo, useState } from "react";
import type { Format, Trainer } from "@/lib/api";
import {
  adminBookings,
  adminFormatList,
  adminSlots,
  adminTrainers,
  createSlot,
  createWeekdaySlots,
  deleteSlot,
  updateSlot,
  type AdminBooking,
  type AdminSlot,
} from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";
import { WeekGrid } from "@/components/booking/WeekGrid";
import { toKey } from "@/components/Calendar";
import { Select } from "@/components/Select";
import { clsx } from "@/lib/clsx";

export default function AdminBooking() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [formatId, setFormatId] = useState<number | null>(null);
  const [diag, setDiag] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selected, setSelected] = useState<string>(() => toKey(new Date()));
  const [openSlotId, setOpenSlotId] = useState<number | null>(null);
  const [time, setTime] = useState("10:00");
  const [capacity, setCapacity] = useState(7);
  const [weekdayMode, setWeekdayMode] = useState(false);
  const [weeks, setWeeks] = useState(2);
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    adminFormatList().then((fs) => {
      setFormats(fs);
      if (fs[0]) setFormatId(fs[0].id);
    });
    adminTrainers().then((ts) => setTrainers(ts.filter((t) => t.isActive)));
  }, []);

  const reload = () => {
    adminSlots().then(setSlots);
    adminBookings().then(setBookings);
  };
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const byDay = useMemo(() => {
    const map = new Map<string, AdminSlot[]>();
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

  const openSlot = slots.find((s) => s.id === openSlotId) ?? null;
  const dayBookings = bookings.filter(
    (b) => b.slot && toKey(new Date(b.slot.startsAt)) === selected,
  );

  const duration = diag
    ? 30
    : (formats.find((f) => f.id === formatId)?.durationMin ?? 60);

  function shiftTime(from: string, minutes: number) {
    const [h, m] = from.split(":").map(Number);
    const next = new Date(2000, 0, 1, h, m + minutes);
    return `${String(next.getHours()).padStart(2, "0")}:${String(
      next.getMinutes(),
    ).padStart(2, "0")}`;
  }

  async function createSlots() {
    if (!diag && !formatId) return;
    if (weekdayMode) {
      const res = await createWeekdaySlots({
        formatId: diag ? undefined : formatId!,
        trainerId,
        time,
        weeks,
        fromDate: selected,
        capacity,
        isDiagnostic: diag,
      });
      flash(
        res.skipped
          ? `Создано: ${res.created}, пропущено (тренер занят): ${res.skipped}`
          : `Создано занятий: ${res.created}`,
      );
    } else {
      const [h, m] = time.split(":").map(Number);
      const dt = new Date(selected);
      dt.setHours(h, m, 0, 0);
      await createSlot({
        formatId: diag ? undefined : formatId!,
        trainerId,
        startsAt: dt.toISOString(),
        capacity,
        isDiagnostic: diag,
      });
      flash("Занятие добавлено");
    }
    setTime((t) => shiftTime(t, duration));
    reload();
  }

  async function reschedule() {
    if (!editing) return;
    await updateSlot(editing.id, new Date(editing.value).toISOString());
    setEditing(null);
    reload();
    flash("Слот перенесён");
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const fmtDay = (key: string) =>
    new Date(key).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });

  return (
    <div className="max-w-6xl">
      <PageTitle>Расписание и записи</PageTitle>

      <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
        <p className="mb-4 font-sub text-heading">
          Создать занятие на {fmtDay(selected)}
        </p>
        <p className="mb-4 text-xs text-text/50">
          День берётся из календаря ниже — кликните по дате нужного дня.
          Продолжительность подставляется из формата (меняется в разделе
          «Форматы»), у диагностики — 30 минут. Одного тренера нельзя поставить
          на два пересекающихся занятия.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-sm">
            <span className="mb-1 block text-text/80">Занятие</span>
            <Select
              value={diag ? "diag" : (formatId ?? "")}
              onChange={(v) => {
                if (v === "diag") {
                  setDiag(true);
                } else {
                  setDiag(false);
                  setFormatId(Number(v));
                }
              }}
              options={[
                ...formats.map((f) => ({ value: f.id, label: f.name })),
                { value: "diag", label: "Диагностика (бесплатно)" },
              ]}
            />
          </div>

          <div className="text-sm">
            <span className="mb-1 block text-text/80">
              Тренер (на все создаваемые)
            </span>
            <Select
              value={trainerId ?? ""}
              onChange={(v) => setTrainerId(v === "" ? null : Number(v))}
              placeholder="Без тренера"
              options={[
                { value: "", label: "Без тренера" },
                ...trainers.map((t) => ({
                  value: t.id,
                  label: t.role ? `${t.name} — ${t.role}` : t.name,
                })),
              ]}
            />
          </div>

          <label className="text-sm">
            <span className="mb-1 block text-text/80">
              Время (занятие {duration} мин, следующее с{" "}
              {shiftTime(time, duration)})
            </span>
            <input
              type="time"
              className="field"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-text/80">Мест (максимум 7)</span>
            <input
              type="number"
              className="field"
              value={capacity}
              min={1}
              max={7}
              onChange={(e) => setCapacity(Math.min(7, Number(e.target.value)))}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={weekdayMode}
              onChange={(e) => setWeekdayMode(e.target.checked)}
            />
            Повторять Пн–Пт
          </label>
          {weekdayMode && (
            <label className="flex items-center gap-2 text-sm">
              Недель:
              <input
                type="number"
                className="field w-20"
                value={weeks}
                min={1}
                onChange={(e) => setWeeks(Number(e.target.value))}
              />
            </label>
          )}
          <button onClick={createSlots} className="btn-gold">
            {weekdayMode ? `Создать Пн–Пт × ${weeks} нед.` : "Создать занятие"}
          </button>
        </div>

        {trainers.length === 0 && (
          <p className="mt-3 text-xs text-text/50">
            Список тренеров пуст — добавьте их в разделе «Тренеры».
          </p>
        )}
      </div>

      <WeekGrid
        selectedDay={selected}
        onSelectDay={(key) => setSelected(key)}
        renderDay={(key) => {
          const daySlots = byDay.get(key) ?? [];
          if (daySlots.length === 0)
            return <p className="px-1 text-xs text-text/30">нет занятий</p>;
          return daySlots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setOpenSlotId(s.id === openSlotId ? null : s.id);
                setSelected(key);
                setEditing(null);
              }}
              className={clsx(
                "block w-full rounded-xl border px-3 py-2 text-left transition",
                s.id === openSlotId
                  ? "border-accent bg-accent/15"
                  : "border-[color-mix(in_srgb,var(--color-border)_40%,transparent)] bg-surface/30 hover:bg-surface",
              )}
            >
              <span className="block font-sub text-heading">
                {fmtTime(s.startsAt)}
                <span className="ml-1 text-xs font-normal text-text/60">
                  {s.durationMin} мин
                </span>
              </span>
              <span
                className={clsx(
                  "block text-xs",
                  s.isDiagnostic ? "text-emerald-300" : "text-accent",
                )}
              >
                {s.isDiagnostic ? "Диагностика" : (s.format?.name ?? "—")}
              </span>
              <span className="block text-xs text-text/70">
                {s.trainer?.name ?? "тренер не назначен"}
              </span>
              <span className="mt-1 block text-xs text-text/50">
                {s._count.bookings}/{s.capacity} записей
              </span>
            </button>
          ));
        }}
      />

      {openSlot && (
        <div className="mt-8 rounded-2xl border-gold bg-surface/50 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-sub text-lg text-heading">
                {new Date(openSlot.startsAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-text/70">
                {openSlot.isDiagnostic
                  ? "Диагностика"
                  : (openSlot.format?.name ?? "—")}{" "}
                · {openSlot._count.bookings}/{openSlot.capacity} записей
              </p>
            </div>
            <button
              onClick={() => setOpenSlotId(null)}
              className="text-2xl leading-none text-text/60 hover:text-heading"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-sm">
              <span className="mb-1 block text-text/80">
                Тренер этого занятия
              </span>
              <Select
                value={openSlot.trainerId ?? ""}
                onChange={async (v) => {
                  await updateSlot(
                    openSlot.id,
                    openSlot.startsAt,
                    v === "" ? null : Number(v),
                  );
                  reload();
                  flash("Тренер обновлён");
                }}
                options={[
                  { value: "", label: "Не назначен" },
                  ...trainers.map((t) => ({ value: t.id, label: t.name })),
                ]}
              />
            </div>

            <div className="text-sm">
              <span className="mb-1 block text-text/80">Перенести</span>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="field"
                  value={
                    editing?.id === openSlot.id
                      ? editing.value
                      : new Date(openSlot.startsAt).toISOString().slice(0, 16)
                  }
                  onChange={(e) =>
                    setEditing({ id: openSlot.id, value: e.target.value })
                  }
                />
                <button
                  onClick={reschedule}
                  disabled={editing?.id !== openSlot.id}
                  className="btn-gold disabled:opacity-40"
                >
                  ОК
                </button>
              </div>
            </div>
          </div>

          {openSlot.bookings.length > 0 && (
            <div className="mt-4 text-sm">
              <p className="mb-1 text-text/80">Записаны:</p>
              <p className="text-heading">
                {openSlot.bookings.map((b) => b.name).join(", ")}
              </p>
            </div>
          )}

          <button
            onClick={async () => {
              if (!confirm("Удалить занятие вместе с записями?")) return;
              await deleteSlot(openSlot.id);
              setOpenSlotId(null);
              reload();
              flash("Занятие удалено");
            }}
            className="mt-5 text-sm text-red-400"
          >
            Удалить занятие
          </button>
        </div>
      )}

      <div className="mt-8">
        <p className="mb-2 font-sub text-heading capitalize">
          Записи: {fmtDay(selected)}
        </p>
        <div className="space-y-2">
          {dayBookings.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border-gold bg-surface/40 px-4 py-2 text-sm"
            >
              <span className="text-accent">
                {b.slot ? fmtTime(b.slot.startsAt) : "—"}
              </span>{" "}
              — <span className="text-heading">{b.name}</span> · {b.phone}
              {b.format ? ` · ${b.format.name}` : ""}
              {b.isDiagnostic ? " · диагностика" : ""}
              {b.isCourse ? " · курс" : ""}
              {b.isFree ? " · бесплатно" : ""}
              {b.promoCode ? ` · промокод ${b.promoCode.code}` : ""}
            </div>
          ))}
          {dayBookings.length === 0 && (
            <p className="text-sm text-text/60">Записей нет.</p>
          )}
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}
