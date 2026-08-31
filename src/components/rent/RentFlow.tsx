"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "../Container";
import { WeekGrid } from "../booking/WeekGrid";
import { toKey } from "../Calendar";
import { clsx } from "@/lib/clsx";
import { bookRent, getRentSlots, type RentalSlot } from "@/lib/api";
import { formatPhone, isValidEmail, isValidPhone } from "@/lib/phone";

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export function RentFlow() {
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);

  const [slots, setSlots] = useState<RentalSlot[]>([]);
  const [picked, setPicked] = useState<RentalSlot | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ total: number } | null>(null);

  useEffect(() => {
    getRentSlots().then(setSlots).catch(() => {});
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, RentalSlot[]>();
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

  function pick(slot: RentalSlot) {
    setPicked((prev) => (prev?.id === slot.id ? null : slot));
    setTimeout(
      () =>
        summaryRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        }),
      80,
    );
  }

  const canSubmit =
    !!picked &&
    !!form.name.trim() &&
    isValidPhone(form.phone) &&
    isValidEmail(form.email);

  async function submit() {
    if (!picked) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await bookRent({
        rentalSlotId: picked.id,
        name: form.name,
        phone: form.phone,
        email: form.email,
      });
      setDone({ total: res.total });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось забронировать");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Container>
        <div className="mx-auto mt-10 max-w-lg rounded-2xl border-gold bg-surface/60 p-8 text-center">
          <p className="text-2xl text-heading">Студия забронирована!</p>
          <p className="mt-4 text-sm">
            {done.total > 0 ? (
              <>
                К оплате:{" "}
                <span className="text-accent">
                  {done.total.toLocaleString("ru-RU")} ₽
                </span>{" "}
                (заглушка оплаты)
              </>
            ) : (
              "Бесплатно. Ждём вас!"
            )}
          </p>
          <button onClick={() => router.push("/")} className="btn-gold mt-6">
            На главную
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <p className="rounded-xl bg-surface-2/60 px-4 py-3 text-sm leading-relaxed text-text/85">
        В расписании указаны свободные часы для аренды студии. Выберите слот — время и стоимость
        указаны на карточке.
      </p>

      <div className="mt-6">
        {slots.length === 0 ? (
          <p className="rounded-2xl border-gold bg-surface/40 p-5 text-sm text-text/70">
            Свободных слотов для аренды пока нет.
          </p>
        ) : (
          <WeekGrid
            renderDay={(key) => {
              const daySlots = byDay.get(key) ?? [];
              if (!daySlots.length)
                return <p className="px-1 text-xs text-text/30">нет слотов</p>;
              return daySlots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s)}
                  disabled={s.isBooked}
                  className={clsx(
                    "block w-full rounded-xl border px-3 py-2 text-left transition",
                    s.isBooked
                      ? "cursor-not-allowed border-white/10 bg-surface/20 opacity-60"
                      : picked?.id === s.id
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
                      {timeOf(s.startsAt)}–{timeOf(s.endsAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-text/60">
                    {s.durationMin} мин
                  </span>
                  <span className="block text-sm text-accent">
                    {s.price > 0
                      ? `${s.price.toLocaleString("ru-RU")} ₽`
                      : "бесплатно"}
                  </span>
                  {s.comment && (
                    <span className="mt-0.5 block text-xs text-text/60">
                      {s.comment}
                    </span>
                  )}
                  {s.isBooked && (
                    <span className="block text-xs text-text/50">занято</span>
                  )}
                </button>
              ));
            }}
            renderFooter={(days) =>
              days.some((d) => byDay.has(toKey(d))) ? null : (
                <p className="mt-5 text-sm text-text/60">
                  На этой неделе слотов нет — листайте вперёд.
                </p>
              )
            }
          />
        )}
      </div>

      <div ref={summaryRef} className="scroll-mb-6">
        {picked && (
          <>
            <h2 className="mt-10 font-sub text-lg text-heading md:text-xl">
              Бронирование студии:
            </h2>
            <div className="mt-4 max-w-2xl rounded-2xl border-gold bg-surface/40 p-4 text-sm">
              {dayOf(picked.startsAt)} · {timeOf(picked.startsAt)}–
              {timeOf(picked.endsAt)} · {picked.durationMin} мин ·{" "}
              {picked.price > 0
                ? `стоимость: ${picked.price.toLocaleString("ru-RU")} ₽`
                : "бесплатно"}
              <button
                onClick={() => setPicked(null)}
                className="ml-3 text-red-400"
                aria-label="Убрать"
              >
                ×
              </button>
            </div>
          </>
        )}
      </div>

      {picked && (
        <div className="mt-6 max-w-md space-y-3">
          <input
            className="field"
            placeholder="ФИО полностью"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="field"
            inputMode="tel"
            placeholder="+7 (999) 999-99-99"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: formatPhone(e.target.value) })
            }
          />
          {form.phone && !isValidPhone(form.phone) && (
            <p className="text-xs text-red-400">Введите телефон полностью</p>
          )}
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {form.email && !isValidEmail(form.email) && (
            <p className="text-xs text-red-400">Email должен содержать «@»</p>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="btn-gold w-full disabled:opacity-40"
          >
            {submitting ? "Отправка…" : "Забронировать"}
          </button>
        </div>
      )}
    </Container>
  );
}
