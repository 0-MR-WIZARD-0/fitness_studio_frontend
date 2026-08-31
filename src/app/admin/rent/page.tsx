"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminRentSlots,
  createRentSlot,
  deleteRentSlot,
  updateRentSlot,
  type AdminRentalSlot,
} from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";
import { WeekGrid } from "@/components/booking/WeekGrid";
import { toKey } from "@/components/Calendar";
import { clsx } from "@/lib/clsx";

export default function AdminRent() {
  const [slots, setSlots] = useState<AdminRentalSlot[]>([]);
  const [selected, setSelected] = useState<string>(() => toKey(new Date()));
  const [openId, setOpenId] = useState<number | null>(null);
  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("12:00");
  const [price, setPrice] = useState(3000);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminRentSlots().then(setSlots);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const byDay = useMemo(() => {
    const map = new Map<string, AdminRentalSlot[]>();
    for (const s of slots) {
      const key = toKey(new Date(s.startsAt));
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    for (const list of map.values())
      list.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return map;
  }, [slots]);

  const openSlot = slots.find((s) => s.id === openId) ?? null;

  function iso(time: string) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(selected);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  async function create() {
    setError(null);
    try {
      await createRentSlot({
        startsAt: iso(from),
        endsAt: iso(to),
        price,
        comment,
        isActive: true,
      });
      flash("Слот аренды создан");
      setComment("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать слот");
    }
  }

  const fmtDay = (key: string) =>
    new Date(key).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-6xl">
      <PageTitle>Аренда студии</PageTitle>

      <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
        <p className="mb-1 font-sub text-heading">
          Сдать студию на {fmtDay(selected)}
        </p>
        <p className="mb-4 text-xs text-text/50">
          День берётся из календаря ниже. На арендованные часы нельзя поставить
          занятие, а на часы с занятиями — аренду.
        </p>

        <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block h-5 text-text/80">Время с</span>
            <input
              type="time"
              className="field"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block h-5 text-text/80">Время до</span>
            <input
              type="time"
              className="field"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block h-5 text-text/80">Цена аренды, ₽</span>
            <input
              type="number"
              className="field"
              min={0}
              value={price}
              onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block h-5 text-text/80">
              Комментарий (необязательно)
            </span>
            <input
              className="field"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Зал целиком"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button onClick={create} className="btn-gold">
            Опубликовать слот
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <WeekGrid
        selectedDay={selected}
        onSelectDay={setSelected}
        renderDay={(key) => {
          const daySlots = byDay.get(key) ?? [];
          if (!daySlots.length)
            return <p className="px-1 text-xs text-text/30">нет слотов</p>;
          return daySlots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setOpenId(s.id === openId ? null : s.id);
                setSelected(key);
              }}
              className={clsx(
                "block w-full rounded-xl border px-3 py-2 text-left transition",
                s.id === openId
                  ? "border-accent bg-accent/15"
                  : "border-[color-mix(in_srgb,var(--color-border)_40%,transparent)] bg-surface/30 hover:bg-surface",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "h-2 w-2 shrink-0 rounded-full",
                    s.isBooked ? "bg-red-400" : "bg-emerald-400",
                  )}
                />
                <span className="font-sub text-heading">
                  {fmtTime(s.startsAt)}–{fmtTime(s.endsAt)}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-accent">
                {s.price > 0
                  ? `${s.price.toLocaleString("ru-RU")} ₽`
                  : "бесплатно"}
              </span>
              <span className="block text-xs text-text/60">
                {s.isBooked ? "забронировано" : "свободно"}
                {s.isActive ? "" : " · снято с публикации"}
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
                {" – "}
                {fmtTime(openSlot.endsAt)}
              </p>
              <p className="text-sm text-text/70">
                {openSlot.durationMin} мин ·{" "}
                {openSlot.price > 0
                  ? `${openSlot.price.toLocaleString("ru-RU")} ₽`
                  : "бесплатно"}
                {openSlot.comment ? ` · ${openSlot.comment}` : ""}
              </p>
            </div>
            <button
              onClick={() => setOpenId(null)}
              className="text-2xl leading-none text-text/60 hover:text-heading"
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          {openSlot.bookings.length > 0 ? (
            <div className="text-sm">
              <p className="mb-1 text-text/80">Забронировано:</p>
              {openSlot.bookings.map((b) => (
                <p key={b.id} className="text-heading">
                  {b.name} · {b.phone}
                  {b.email ? ` · ${b.email}` : ""}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text/60">Заявок пока нет.</p>
          )}

          <div className="mt-5 flex flex-wrap gap-4">
            <button
              onClick={async () => {
                await updateRentSlot(openSlot.id, {
                  startsAt: openSlot.startsAt,
                  endsAt: openSlot.endsAt,
                  price: openSlot.price,
                  comment: openSlot.comment,
                  isActive: !openSlot.isActive,
                });
                reload();
                flash(
                  openSlot.isActive
                    ? "Слот снят с публикации"
                    : "Слот опубликован",
                );
              }}
              className="text-sm text-text/80 underline underline-offset-4"
            >
              {openSlot.isActive ? "Снять с публикации" : "Опубликовать"}
            </button>
            <button
              onClick={async () => {
                if (!confirm("Удалить слот аренды?")) return;
                await deleteRentSlot(openSlot.id);
                setOpenId(null);
                reload();
                flash("Слот удалён");
              }}
              className="text-sm text-red-400"
            >
              Удалить слот
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}
