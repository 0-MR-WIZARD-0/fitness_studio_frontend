"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "../Container";
import { WeekSchedule } from "./WeekSchedule";
import { courseIds } from "@/lib/course";
import {
  api,
  getAvailableSlots,
  getDiagnosticSlots,
  getFormats,
  getSettings,
  mediaUrl,
  type Format,
  type Slot,
} from "@/lib/api";
import { formatPhone, isValidEmail, isValidPhone } from "@/lib/phone";

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

  const [formats, setFormats] = useState<Format[]>([]);
  const [filterFormatId, setFilterFormatId] = useState<number | null>(
    initialFormatId,
  );
  const [filterDiagnostic, setFilterDiagnostic] = useState(initialDiagnostic);
  const [threshold, setThreshold] = useState(3);
  const [lessons, setLessons] = useState<Slot[]>([]);
  const [diagSlots, setDiagSlots] = useState<Slot[]>([]);
  const [cart, setCart] = useState<Slot[]>([]);
  const [diagSlot, setDiagSlot] = useState<Slot | null>(null);
  const [usePromo, setUsePromo] = useState(false);
  const [promo, setPromo] = useState("");
  const [agreementUrl, setAgreementUrl] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | {
    course?: boolean;
    gift?: string | null;
    free?: boolean;
    total?: number;
  }>(null);

  useEffect(() => {
    getFormats().then(setFormats);
    getSettings().then((s) => {
      setThreshold(s.courseThreshold);
      setAgreementUrl(s.userAgreementUrl);
    });
    getAvailableSlots().then(setLessons).catch(() => {});
    getDiagnosticSlots().then(setDiagSlots).catch(() => {});
  }, []);

  const weekSlots = useMemo(() => {
    if (filterDiagnostic) return diagSlots;
    if (filterFormatId)
      return lessons.filter((s) => s.formatId === filterFormatId);
    return [...lessons, ...diagSlots];
  }, [lessons, diagSlots, filterFormatId, filterDiagnostic]);

  const filterLabel = filterDiagnostic
    ? "Только диагностика"
    : filterFormatId
      ? `Только «${formats.find((f) => f.id === filterFormatId)?.name ?? "формат"}»`
      : null;

  const inCourse = useMemo(() => courseIds(cart, threshold), [cart, threshold]);
  const isCourse = inCourse.size > 0;
  const total = cart.reduce(
    (sum, s) =>
      sum + (inCourse.has(s.id) ? s.coursePerSession : s.pricePerSession),
    0,
  );
  const singlesTotal = cart.reduce((s, x) => s + x.pricePerSession, 0);
  const needsAgreement = !diagSlot && total > 0 && !!agreementUrl;

  function pickSlot(slot: Slot) {
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

  const isPicked = (slot: Slot) =>
    slot.isDiagnostic
      ? diagSlot?.id === slot.id
      : cart.some((x) => x.id === slot.id);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const promoCode = usePromo && promo ? promo : undefined;
      if (diagSlot) {
        await api("/booking/single", {
          method: "POST",
          body: JSON.stringify({
            slotId: diagSlot.id,
            name: form.name,
            phone: form.phone,
            email: form.email,
            promoCode,
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
            body: JSON.stringify({
              slotId: cart[0].id,
              name: form.name,
              phone: form.phone,
              email: form.email,
              promoCode,
            }),
          },
        );
        setDone({ free: res.free, total: res.total });
      } else {
        const res = await api<{
          isCourse: boolean;
          total: number;
          giftCode: string | null;
        }>("/booking/cart", {
          method: "POST",
          body: JSON.stringify({
            slotIds: cart.map((s) => s.id),
            name: form.name,
            phone: form.phone,
            email: form.email,
          }),
        });
        setDone({ course: res.isCourse, gift: res.giftCode, total: res.total });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка записи");
    } finally {
      setSubmitting(false);
    }
  }

  const hasSelection = !!diagSlot || cart.length > 0;
  const canSubmit =
    hasSelection &&
    !!form.name.trim() &&
    isValidPhone(form.phone) &&
    isValidEmail(form.email) &&
    (!needsAgreement || agreed);

  if (done) {
    return (
      <Container>
        <div className="mx-auto mt-10 max-w-lg rounded-2xl border-gold bg-surface/60 p-8 text-center">
          <p className="text-2xl text-heading">Заявка создана!</p>
          {done.course && (
            <p className="mt-4 text-sm leading-relaxed">
              Это курс 🎉 Скидка применена. Подарочный промокод на бесплатное
              занятие:
              <br />
              <code className="text-accent">{done.gift}</code>
              <br />
              (отправлен на почту)
            </p>
          )}
          {!done.course &&
            (done.free ? (
              <p className="mt-4 text-sm">Бесплатно. Ждём вас!</p>
            ) : (
              <p className="mt-4 text-sm">
                К оплате: <span className="text-accent">{done.total} ₽</span>{" "}
                (заглушка оплаты)
              </p>
            ))}
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
        Всё расписание студии на неделю — занятия всех форматов и бесплатная
        диагностика. Наберите {threshold}+ занятий в пределах одной недели — они
        станут курсом со скидкой и подарочным промокодом.
        {cart.length > 0 &&
          ` Выбрано: ${cart.length}${
            isCourse ? ` — курсом идут ${inCourse.size}` : ""
          }`}
      </p>

      <div className="mt-6">
        <WeekSchedule
          slots={weekSlots}
          emptyText="Свободных занятий пока нет."
          isSelected={isPicked}
          onPick={pickSlot}
        />
      </div>

      {diagSlot && (
        <div className="mt-6 max-w-2xl rounded-2xl border border-emerald-400/50 bg-surface/40 p-4 text-sm">
          Диагностика · {dayOf(diagSlot.startsAt)} {timeOf(diagSlot.startsAt)}
          {diagSlot.trainerName ? ` · ${diagSlot.trainerName}` : ""} — бесплатно
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
        <div className="mt-6 max-w-2xl rounded-2xl border-gold bg-surface/40 p-4 text-sm">
          {cart.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 py-1"
            >
              <span>
                {s.formatName} · {dayOf(s.startsAt)} {timeOf(s.startsAt)}
                {s.trainerName ? ` · ${s.trainerName}` : ""}
                {inCourse.has(s.id) && (
                  <span className="ml-2 text-xs text-accent">курс</span>
                )}
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
            {isCourse && singlesTotal > total && (
              <span className="mr-2 text-text/50 line-through">
                {singlesTotal} ₽
              </span>
            )}
            <span className="text-heading">Итого: {total} ₽</span>
            {isCourse && (
              <span className="ml-2 text-accent">курс + подарок 🎁</span>
            )}
          </div>
        </div>
      )}

      {hasSelection && (
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

          {(!!diagSlot || cart.length === 1) && (
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

          {needsAgreement && (
            <label className="flex items-start gap-2 text-sm text-text/80">
              <input
                type="checkbox"
                className="mt-1"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                Я ознакомлен(а) с{" "}
                <a
                  href={mediaUrl(agreementUrl) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  пользовательским соглашением
                </a>
              </span>
            </label>
          )}

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
