"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "../Container";
import { WeekGrid } from "../booking/WeekGrid";
import { toKey } from "../Calendar";
import { clsx } from "@/lib/clsx";
import {
  bookRent,
  getDocuments,
  getRentSlots,
  type RentalSlot,
  type StudioDocument,
} from "@/lib/api";
import { useAccount } from "../account/AccountProvider";
import {
  ClientCard,
  DocumentConsents,
  LoginRequired,
} from "../account/BookingGate";

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
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [accepted, setAccepted] = useState<number[]>([]);
  const { user } = useAccount();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ total: number } | null>(null);

  useEffect(() => {
    getRentSlots().then(setSlots).catch(() => {});
    getDocuments().then(setDocuments).catch(() => {});
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

  const docsAccepted = documents.every((d) => accepted.includes(d.id));
  const canSubmit = !!picked && !!user && docsAccepted;

  async function submit() {
    if (!picked) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await bookRent({
        rentalSlotId: picked.id,
        documentIds: accepted,
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
          <p className="text-2xl text-heading">Время забронировано!</p>
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
        Здесь отображены услуги, которые занимают студию по времени: аренда зала по часам и
        услуги с записью. Между занятиями оставлен перерыв, поэтому в расписании
        отображено только свободное время.
      </p>

      <div className="mt-6">
        {slots.length === 0 ? (
          <p className="rounded-2xl border-gold bg-surface/40 p-5 text-sm text-text/70">
            Свободного времени пока нет.
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
                    {s.hallTitle ? `${s.hallTitle} · ` : ""}
                    {s.serviceTitle} · {s.durationMin} мин
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
              Бронирование:
            </h2>
            <div className="mt-4 max-w-2xl rounded-2xl border-gold bg-surface/40 p-4 text-sm">
              {picked.hallTitle ? `${picked.hallTitle} · ` : ""}
              {picked.serviceTitle} · {dayOf(picked.startsAt)} ·{" "}
              {timeOf(picked.startsAt)}–{timeOf(picked.endsAt)} ·{" "}
              {picked.durationMin} мин ·{" "}
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

      {picked && !user && <LoginRequired what="Бронирование времени" />}

      {picked && user && (
        <div className="mt-6 max-w-md space-y-3">
          <ClientCard user={user} />

          <DocumentConsents
            documents={documents}
            accepted={accepted}
            onToggle={(id, value) =>
              setAccepted((prev) =>
                value ? [...prev, id] : prev.filter((x) => x !== id),
              )
            }
          />

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
