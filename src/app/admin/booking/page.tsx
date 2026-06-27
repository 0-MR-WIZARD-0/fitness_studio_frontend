"use client";

import { useEffect, useMemo, useState } from "react";
import type { Format } from "@/lib/api";
import {
  adminBookings,
  adminFormatList,
  adminSlots,
  createSlot,
  createWeekdaySlots,
  deleteSlot,
  updateSlot,
  type AdminBooking,
  type AdminSlot,
} from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";
import { Calendar, toKey } from "@/components/Calendar";
import { Select } from "@/components/Select";

export default function AdminBooking() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [formatId, setFormatId] = useState<number | null>(null);
  const [diag, setDiag] = useState(false);
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selected, setSelected] = useState<string>(() => toKey(new Date()));
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

  const formatSlots = useMemo(
    () =>
      slots.filter((s) =>
        diag ? s.isDiagnostic : !s.isDiagnostic && s.formatId === formatId,
      ),
    [slots, formatId, diag],
  );
  const daysWithSlots = useMemo(
    () => new Set(formatSlots.map((s) => toKey(new Date(s.startsAt)))),
    [formatSlots],
  );
  const daySlots = formatSlots
    .filter((s) => toKey(new Date(s.startsAt)) === selected)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const dayBookings = bookings.filter(
    (b) => b.slot && toKey(new Date(b.slot.startsAt)) === selected,
  );

  async function createSlots() {
    if (!diag && !formatId) return;
    if (weekdayMode) {
      const res = await createWeekdaySlots({
        formatId: diag ? undefined : formatId!,
        time,
        weeks,
        fromDate: selected,
        capacity,
        isDiagnostic: diag,
      });
      flash(`Создано слотов: ${res.created}`);
    } else {
      const [h, m] = time.split(":").map(Number);
      const dt = new Date(selected);
      dt.setHours(h, m, 0, 0);
      await createSlot({
        formatId: diag ? undefined : formatId!,
        startsAt: dt.toISOString(),
        capacity,
        isDiagnostic: diag,
      });
      flash("Слот добавлен");
    }
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
    <div className="max-w-4xl">
      <PageTitle>Запись на занятия</PageTitle>

      <div className="mb-5 max-w-sm text-sm">
        <span className="mb-1 block text-text/80">Формат</span>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Calendar
          selected={selected}
          onSelect={setSelected}
          isMarked={(key) => daysWithSlots.has(key)}
        />

        <div className="space-y-5">
          <p className="font-sub text-heading capitalize">{fmtDay(selected)}</p>

          <div className="rounded-2xl border-gold bg-surface/50 p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                Время
                <input
                  type="time"
                  className="field mt-1"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Мест
                <input
                  type="number"
                  className="field mt-1 w-20"
                  value={capacity}
                  min={1}
                  max={7}
                  onChange={(e) =>
                    setCapacity(Math.min(7, Number(e.target.value)))
                  }
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={weekdayMode}
                onChange={(e) => setWeekdayMode(e.target.checked)}
              />
              Будние дни (Пн–Пт)
            </label>

            {weekdayMode ? (
              <label className="block text-sm">
                Количество недель
                <input
                  type="number"
                  className="field mt-1 w-24"
                  value={weeks}
                  min={1}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                />
              </label>
            ) : (
              <p className="text-xs text-text/50">
                Слот будет создан на выбранный в календаре день.
              </p>
            )}

            <button onClick={createSlots} className="btn-gold">
              {weekdayMode ? `Создать Пн–Пт × ${weeks} нед.` : "Создать слот"}
            </button>
            <p className="text-xs text-text/50">
              На занятие — не более 7 человек.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm text-text/80">Слоты дня</p>
            <div className="space-y-2">
              {daySlots.map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border-gold px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {fmtTime(s.startsAt)} ·{" "}
                      <span className="text-accent">
                        {s._count.bookings}/{s.capacity}
                      </span>
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          setEditing({
                            id: s.id,
                            value: new Date(s.startsAt)
                              .toISOString()
                              .slice(0, 16),
                          })
                        }
                        className="text-text/70 hover:text-heading"
                      >
                        перенести
                      </button>
                      <button
                        onClick={async () => {
                          await deleteSlot(s.id);
                          reload();
                        }}
                        className="text-red-400"
                      >
                        удалить
                      </button>
                    </div>
                  </div>
                  {editing?.id === s.id && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="datetime-local"
                        className="field"
                        value={editing.value}
                        onChange={(e) =>
                          setEditing({ id: s.id, value: e.target.value })
                        }
                      />
                      <button onClick={reschedule} className="btn-gold">
                        ОК
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {daySlots.length === 0 && (
                <p className="text-sm text-text/60">Слотов нет.</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-text/80">Записи в этот день</p>
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
        </div>
      </div>
      <Toast message={toast} />
    </div>
  );
}
