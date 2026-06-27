"use client";

import { useMemo, useState } from "react";
import { Container, Grid } from "../Container";
import { Calendar, toKey } from "../Calendar";
import { api, mediaUrl, type Announcement } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { formatPhone, isValidEmail, isValidPhone } from "@/lib/phone";

export function Announcements({ items }: { items: Announcement[] }) {
  const [day, setDay] = useState<string>(() =>
    items[0] ? toKey(new Date(items[0].startsAt)) : toKey(new Date()),
  );
  const [booking, setBooking] = useState<Announcement | null>(null);

  const daysWithEvents = useMemo(
    () => new Set(items.map((a) => toKey(new Date(a.startsAt)))),
    [items],
  );
  const dayItems = items.filter((a) => toKey(new Date(a.startsAt)) === day);

  if (items.length === 0) return null;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section className="py-12 md:py-16">
      <Container>
        <h2 className="text-3xl md:text-4xl font-bold">Анонсы</h2>
        <Grid className="mt-8 items-start">
          <div className="col-span-12 md:col-span-5">
            <Calendar
              selected={day}
              onSelect={setDay}
              isMarked={(d) => daysWithEvents.has(d)}
            />
          </div>

          <div className="col-span-12 md:col-span-7 space-y-5">
            {dayItems.length === 0 ? (
              <p className="text-text/60">
                В выбранный день анонсов нет — выберите отмеченный день.
              </p>
            ) : (
              dayItems.map((a) => (
                <div
                  key={a.id}
                  className="overflow-hidden rounded-2xl border-gold bg-surface/50"
                >
                  {mediaUrl(a.imageUrl) && (
                    <img
                      src={mediaUrl(a.imageUrl)!}
                      alt=""
                      className="h-48 w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="font-sub text-xl text-heading">{a.title}</h3>
                    <p className="mt-1 text-sm text-accent">{fmt(a.startsAt)}</p>
                    {a.description && (
                      <p className="mt-3 text-sm leading-relaxed text-text/90">
                        {a.description}
                      </p>
                    )}
                    <p className="mt-3 text-sm">
                      {a.isFree ? (
                        <span className="text-accent">Бесплатно</span>
                      ) : (
                        <span>{a.price.toLocaleString("ru-RU")} ₽</span>
                      )}
                    </p>
                    <button
                      onClick={() => setBooking(a)}
                      className="btn-gold mt-4"
                    >
                      Записаться
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Grid>
      </Container>

      {booking && (
        <AnnouncementBookingModal
          item={booking}
          onClose={() => setBooking(null)}
        />
      )}
    </section>
  );
}

function AnnouncementBookingModal({
  item,
  onClose,
}: {
  item: Announcement;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", promo: "" });
  const [usePromo, setUsePromo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api("/booking/announcement", {
        method: "POST",
        body: JSON.stringify({
          announcementId: item.id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          promoCode: usePromo && form.promo ? form.promo : undefined,
        }),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка записи");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border-gold bg-surface p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-xl">{item.title}</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-text/60 hover:text-heading"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-heading">Вы записаны!</p>
            <button onClick={onClose} className="btn-gold">
              Готово
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
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
            {!item.isFree && (
              <>
                <label className="flex items-center gap-2 text-sm text-text/80">
                  <input
                    type="checkbox"
                    checked={usePromo}
                    onChange={(e) => setUsePromo(e.target.checked)}
                  />
                  Использовать промокод
                </label>
                {usePromo && (
                  <input
                    className="field"
                    placeholder="Промокод"
                    value={form.promo}
                    onChange={(e) => setForm({ ...form, promo: e.target.value })}
                  />
                )}
              </>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              onClick={submit}
              disabled={
                !form.name.trim() ||
                !isValidPhone(form.phone) ||
                !isValidEmail(form.email) ||
                submitting
              }
              className={clsx("btn-gold w-full disabled:opacity-40")}
            >
              {submitting ? "Отправка…" : "Записаться"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
