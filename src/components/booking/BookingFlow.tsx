"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "../Container";
import { WeekMatrix } from "./WeekMatrix";
import { courseGroups } from "@/lib/course";
import { plural } from "@/lib/plural";
import {
  api,
  getAnnouncements,
  getAvailableSlots,
  getDiagnosticSlots,
  getDocuments,
  getFormats,
  getSettings,
  type Announcement,
  type Format,
  type Slot,
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

export function BookingFlow({
  initialFormatId = null,
  initialDiagnostic = false,
}: {
  initialFormatId?: number | null;
  initialDiagnostic?: boolean;
}) {
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);

  const [formats, setFormats] = useState<Format[]>([]);
  const [filterFormatId, setFilterFormatId] = useState<number | null>(
    initialFormatId,
  );
  const [filterDiagnostic, setFilterDiagnostic] = useState(initialDiagnostic);
  const [threshold, setThreshold] = useState(3);
  const [lessons, setLessons] = useState<Slot[]>([]);
  const [diagSlots, setDiagSlots] = useState<Slot[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [cart, setCart] = useState<Slot[]>([]);
  const [diagSlot, setDiagSlot] = useState<Slot | null>(null);
  const [annSlot, setAnnSlot] = useState<Announcement | null>(null);
  const [usePromo, setUsePromo] = useState(false);
  const [promo, setPromo] = useState("");
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [accepted, setAccepted] = useState<number[]>([]);
  const { user } = useAccount();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | {
    courses?: number;
    gifts?: string[];
    free?: boolean;
    total?: number;
  }>(null);

  useEffect(() => {
    getFormats().then(setFormats);
    getSettings().then((s) => {
      setThreshold(s.courseThreshold);
    });
    getDocuments().then(setDocuments).catch(() => {});
    getAvailableSlots().then(setLessons).catch(() => {});
    getDiagnosticSlots().then(setDiagSlots).catch(() => {});
    getAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  const weekSlots = useMemo(() => {
    if (filterDiagnostic) return diagSlots;
    if (filterFormatId)
      return lessons.filter((s) => s.formatId === filterFormatId);
    return [...lessons, ...diagSlots];
  }, [lessons, diagSlots, filterFormatId, filterDiagnostic]);

  const visibleFormats = useMemo(
    () =>
      filterDiagnostic
        ? []
        : filterFormatId
          ? formats.filter((f) => f.id === filterFormatId)
          : formats,
    [formats, filterFormatId, filterDiagnostic],
  );

  const filterLabel = filterDiagnostic
    ? "Только диагностика"
    : filterFormatId
      ? `Только «${formats.find((f) => f.id === filterFormatId)?.name ?? "формат"}»`
      : null;

  const { groups, countedIds } = useMemo(
    () => courseGroups(cart, threshold),
    [cart, threshold],
  );
  const courses = groups.length;
  const total = cart.reduce((sum, s) => sum + s.pricePerSession, 0);
  const docsAccepted = documents.every((d) => accepted.includes(d.id));

  function scrollToSummary() {
    setTimeout(
      () =>
        summaryRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        }),
      80,
    );
  }

  function pickSlot(slot: Slot) {
    scrollToSummary();
    setAnnSlot(null);
    if (slot.isDiagnostic) {
      setCart([]);
      setDiagSlot((prev) => (prev?.id === slot.id ? null : slot));
      return;
    }
    setDiagSlot(null);
    setCart((prev) =>
      prev.some((x) => x.id === slot.id)
        ? prev.filter((x) => x.id !== slot.id)
        : [...prev, slot],
    );
  }

  function pickAnnouncement(a: Announcement) {
    scrollToSummary();
    setCart([]);
    setDiagSlot(null);
    setAnnSlot((prev) => (prev?.id === a.id ? null : a));
  }

  const isPicked = (slot: Slot) =>
    slot.isDiagnostic
      ? diagSlot?.id === slot.id
      : cart.some((x) => x.id === slot.id);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const promoCode = usePromo && promo ? promo : undefined;
      const documentIds = accepted;

      if (annSlot) {
        const res = await api<{ free: boolean; total: number }>(
          "/booking/announcement",
          {
            method: "POST",
            auth: true,
            body: JSON.stringify({
              announcementId: annSlot.id,
              promoCode,
              documentIds,
            }),
          },
        );
        setDone({ free: res.free, total: res.total });
        return;
      }

      if (diagSlot) {
        await api("/booking/single", {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            slotId: diagSlot.id,
            promoCode,
            documentIds,
          }),
        });
        setDone({ free: true });
        return;
      }

      if (cart.length === 1) {
        const res = await api<{ free: boolean; total: number }>(
          "/booking/single",
          {
            method: "POST",
            auth: true,
            body: JSON.stringify({
              slotId: cart[0].id,
              promoCode,
              documentIds,
            }),
          },
        );
        setDone({ free: res.free, total: res.total });
      } else {
        const res = await api<{
          isCourse: boolean;
          courses: number;
          total: number;
          giftCodes: string[];
        }>("/booking/cart", {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            slotIds: cart.map((s) => s.id),
            documentIds,
          }),
        });
        setDone({
          courses: res.courses,
          gifts: res.giftCodes,
          total: res.total,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка записи");
    } finally {
      setSubmitting(false);
    }
  }

  const hasSelection = !!diagSlot || !!annSlot || cart.length > 0;
  const canSubmit = hasSelection && !!user && docsAccepted;

  if (done) {
    return (
      <Container>
        <div className="mx-auto mt-10 max-w-lg rounded-2xl border-gold bg-surface/60 p-8 text-center">
          <p className="text-2xl text-heading">Заявка создана!</p>

          {done.free ? (
            <p className="mt-4 text-sm">Бесплатно. Ждём вас!</p>
          ) : (
            <p className="mt-4 text-sm">
              К оплате:{" "}
              <span className="text-accent">
                {(done.total ?? 0).toLocaleString("ru-RU")} ₽
              </span>{" "}
              (заглушка оплаты)
            </p>
          )}

          {!!done.courses && (
            <div className="mt-4 text-sm leading-relaxed">
              <p>
                Собрано {done.courses}{" "}
                {plural(done.courses, ["курс", "курса", "курсов"])} 🎉 — дарим{" "}
                {done.gifts?.length}{" "}
                {plural(done.gifts?.length ?? 0, [
                  "занятие",
                  "занятия",
                  "занятий",
                ])}
                . Промокод
                {(done.gifts?.length ?? 0) > 1 ? "ы" : ""}:
              </p>
              <p className="mt-1">
                {done.gifts?.map((code) => (
                  <code key={code} className="mx-1 text-accent">
                    {code}
                  </code>
                ))}
              </p>
              <p className="mt-1 text-text/60">(отправлены на почту)</p>
            </div>
          )}
          <button onClick={() => router.push("/")} className="btn-gold mt-6">
            На главную
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {filterLabel && (
        <button
          onClick={() => {
            setFilterFormatId(null);
            setFilterDiagnostic(false);
          }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/60 bg-accent/10 px-4 py-1.5 text-sm text-heading transition hover:bg-accent/20"
        >
          {filterLabel}
          <span className="text-accent">× показать всё расписание</span>
        </button>
      )}

      <p className="rounded-xl bg-surface-2/60 px-4 py-3 text-sm leading-relaxed text-text/85">
        В расписании студии представлены занятия всех форматов и спецпротоколов,
        а также бесплатная диагностика. Приобретайте любые {threshold} занятия
        в неделю (основные форматы или дополнительные) — 4-е в подарок!
        {cart.length > 0 && (
          <span className="text-emerald-400">
            {" "}
            Выбрано: {cart.length}{" "}
            {plural(cart.length, ["занятие", "занятия", "занятий"])}
            {courses
              ? ` — это ${courses} ${plural(courses, ["курс", "курса", "курсов"])} + ${courses} ${plural(courses, ["занятие", "занятия", "занятий"])} в подарок`
              : ""}
          </span>
        )}
      </p>

      <div className="mt-6">
        <WeekMatrix
          limitForward
          formats={visibleFormats}
          slots={weekSlots}
          announcements={filterFormatId || filterDiagnostic ? [] : announcements}
          isSelected={isPicked}
          onPick={pickSlot}
          isAnnouncementSelected={(a) => annSlot?.id === a.id}
          onPickAnnouncement={pickAnnouncement}
        />
      </div>

      <div ref={summaryRef} className="scroll-mb-6">
        {hasSelection && (
          <h2 className="mt-10 font-sub text-lg text-heading md:text-xl">
            Формирование записи на:
          </h2>
        )}

      {annSlot && (
        <div className="mt-4 max-w-2xl rounded-2xl border border-accent/50 bg-surface/40 p-4 text-sm">
          {annSlot.title} · {dayOf(annSlot.startsAt)} {timeOf(annSlot.startsAt)}{" "}
          · {annSlot.durationMin} мин
          {annSlot.trainerName ? ` · ${annSlot.trainerName}` : ""} ·{" "}
          {annSlot.isFree
            ? "бесплатно"
            : `стоимость: ${annSlot.price.toLocaleString("ru-RU")} ₽`}
          <button
            onClick={() => setAnnSlot(null)}
            className="ml-3 text-red-400"
            aria-label="Убрать"
          >
            ×
          </button>
        </div>
      )}

      {diagSlot && (
        <div className="mt-4 max-w-2xl rounded-2xl border border-emerald-400/50 bg-surface/40 p-4 text-sm">
          Диагностика · {dayOf(diagSlot.startsAt)} {timeOf(diagSlot.startsAt)} ·{" "}
          {diagSlot.durationMin} мин
          {diagSlot.trainerName ? ` · ${diagSlot.trainerName}` : ""} · бесплатно
          <button
            onClick={() => setDiagSlot(null)}
            className="ml-3 text-red-400"
            aria-label="Убрать"
          >
            ×
          </button>
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-4 max-w-2xl rounded-2xl border-gold bg-surface/40 p-4 text-sm">
          {cart.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 py-1"
            >
              <span>
                {s.formatName} · {dayOf(s.startsAt)} {timeOf(s.startsAt)}
                {s.trainerName ? ` · ${s.trainerName}` : ""}
                {countedIds.has(s.id) && (
                  <span className="ml-2 text-xs text-accent">курс</span>
                )}
                <span className="ml-2 text-text/60">
                  · стоимость: {s.pricePerSession.toLocaleString("ru-RU")} ₽
                </span>
              </span>
              <button
                onClick={() => pickSlot(s)}
                className="text-red-400"
                aria-label="Убрать"
              >
                ×
              </button>
            </div>
          ))}
          <div className="mt-3 border-t border-white/10 pt-3">
            <span className="text-heading">
              Итого: {total.toLocaleString("ru-RU")} ₽
            </span>
            {courses > 0 && (
              <span className="ml-2 text-accent">
                + промокод на {courses}{" "}
                {plural(courses, [
                  "бесплатное занятие",
                  "бесплатных занятия",
                  "бесплатных занятий",
                ])}{" "}
                🎁
              </span>
            )}
          </div>
          {courses > 0 && (
            <p className="mt-2 text-xs text-text/55">
              Промокод придёт в личный кабинет, записаться по нему можно в
              течение месяца — потом он сгорает.
            </p>
          )}
        </div>
        )}
      </div>

      {hasSelection && !user && <LoginRequired what="Запись на занятия" />}

      {hasSelection && user && (
        <div className="mt-6 max-w-md space-y-3">
          <ClientCard user={user} />

          {(!!diagSlot || !!annSlot || cart.length === 1) && (
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
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                />
              )}
            </>
          )}

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
            {submitting ? "Отправка…" : "Записаться"}
          </button>
        </div>
      )}
    </Container>
  );
}
