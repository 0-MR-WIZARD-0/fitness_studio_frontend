"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { Calendar, toKey } from "./Calendar";
import { Select } from "./Select";
import { clsx } from "@/lib/clsx";
import { formatPhone, isValidEmail, isValidPhone } from "@/lib/phone";

type Tab = "lesson" | "diagnostic";

interface BookingCtx {
  open: (formatId?: number, tab?: Tab) => void;
}
const Ctx = createContext<BookingCtx | null>(null);

export function useBooking(): BookingCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking вне BookingProvider");
  return ctx;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [formatId, setFormatId] = useState<number | undefined>(undefined);
  const [initialTab, setInitialTab] = useState<Tab>("lesson");

  const open = (id?: number, tab: Tab = "lesson") => {
    setFormatId(id);
    setInitialTab(tab);
    setOpen(true);
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && (
        <BookingModal
          initialFormatId={formatId}
          initialTab={initialTab}
          onClose={() => setOpen(false)}
        />
      )}
    </Ctx.Provider>
  );
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
const dayOf = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
const MS_DAY = 86400000;

function BookingModal({
  initialFormatId,
  initialTab,
  onClose,
}: {
  initialFormatId?: number;
  initialTab: Tab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [formats, setFormats] = useState<Format[]>([]);
  const [formatId, setFormatId] = useState<number | undefined>(initialFormatId);
  const [threshold, setThreshold] = useState(3);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [diagSlots, setDiagSlots] = useState<Slot[]>([]);
  const [day, setDay] = useState<string | null>(null);
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
    getFormats().then((fs) => {
      setFormats(fs);
      if (!initialFormatId && fs[0]) setFormatId(fs[0].id);
    });
    getSettings().then((s) => {
      setThreshold(s.courseThreshold);
      setAgreementUrl(s.userAgreementUrl);
    });
    getDiagnosticSlots().then(setDiagSlots).catch(() => {});
  }, [initialFormatId]);

  useEffect(() => {
    if (!formatId) return;
    setDay(null);
    getAvailableSlots(formatId).then(setSlots).catch(() => {});
  }, [formatId]);

  const activeSlots = tab === "lesson" ? slots : diagSlots;
  const daysWithSlots = useMemo(
    () => new Set(activeSlots.map((s) => toKey(new Date(s.startsAt)))),
    [activeSlots],
  );
  const daySlots = useMemo(
    () =>
      activeSlots
        .filter((s) => toKey(new Date(s.startsAt)) === day)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)),
    [activeSlots, day],
  );

  const spanOk = (() => {
    if (cart.length < 2) return true;
    const t = cart.map((s) => +new Date(s.startsAt));
    return Math.max(...t) - Math.min(...t) <= 6 * MS_DAY;
  })();
  const isCourse = cart.length >= threshold && spanOk;
  const total = cart.reduce(
    (sum, s) => sum + (isCourse ? s.coursePerSession : s.pricePerSession),
    0,
  );
  const singlesTotal = cart.reduce((s, x) => s + x.pricePerSession, 0);
  const needsAgreement = tab === "lesson" && total > 0 && !!agreementUrl;

  function toggleCart(slot: Slot) {
    setCart((prev) =>
      prev.some((x) => x.id === slot.id)
        ? prev.filter((x) => x.id !== slot.id)
        : [...prev, slot],
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const promoCode = usePromo && promo ? promo : undefined;
      if (tab === "diagnostic") {
        if (!diagSlot) return;
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

  const hasSelection = tab === "diagnostic" ? !!diagSlot : cart.length > 0;
  const canSubmit =
    hasSelection &&
    !!form.name.trim() &&
    isValidPhone(form.phone) &&
    isValidEmail(form.email) &&
    spanOk &&
    (!needsAgreement || agreed);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto no-scrollbar rounded-2xl border-gold bg-surface p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-2xl">Запись</h3>
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
            <p className="text-lg text-heading">Заявка создана!</p>
            {done.course && (
              <p className="text-sm">
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
                <p className="text-sm">Бесплатно. Ждём вас!</p>
              ) : (
                <p className="text-sm">
                  К оплате: <span className="text-accent">{done.total} ₽</span>{" "}
                  (заглушка оплаты)
                </p>
              ))}
            <button onClick={onClose} className="btn-gold mt-2">
              Готово
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 flex gap-2">
              <Toggle active={tab === "lesson"} onClick={() => setTab("lesson")}>
                Занятие
              </Toggle>
              <Toggle
                active={tab === "diagnostic"}
                onClick={() => {
                  setTab("diagnostic");
                  setDay(null);
                }}
              >
                Диагностика (бесплатно)
              </Toggle>
            </div>

            {tab === "lesson" && (
              <>
                <div className="mt-4 text-sm">
                  <span className="mb-1 block text-text/80">Формат</span>
                  <Select
                    value={formatId ?? null}
                    onChange={(v) => setFormatId(Number(v))}
                    options={formats.map((f) => ({ value: f.id, label: f.name }))}
                  />
                </div>
                <p className="mt-3 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-text/80">
                  Выберите занятия (можно из разных форматов). Наберётся{" "}
                  {threshold}+ за неделю — станет курсом со скидкой и подарком.
                  {cart.length > 0 &&
                    ` Выбрано: ${cart.length}${
                      isCourse ? " — это курс!" : `/${threshold}`
                    }`}
                  {!spanOk && (
                    <span className="block text-red-400">
                      Для курса занятия должны уместиться в 7 дней.
                    </span>
                  )}
                </p>
              </>
            )}

            {activeSlots.length === 0 ? (
              <p className="mt-6 text-sm text-text/70">
                {tab === "diagnostic"
                  ? "Свободных слотов диагностики пока нет."
                  : "Для этого формата пока нет свободных занятий."}
              </p>
            ) : (
              <div className="mt-5">
                <Calendar
                  selected={day}
                  onSelect={setDay}
                  isMarked={(d) => daysWithSlots.has(d)}
                />
                {day && (
                  <div className="mt-4">
                    <p className="mb-2 font-sub text-sm text-accent">
                      Время в выбранный день
                    </p>
                    {daySlots.length === 0 ? (
                      <p className="text-sm text-text/60">
                        В этот день слотов нет.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((s) => {
                          const picked =
                            tab === "diagnostic"
                              ? diagSlot?.id === s.id
                              : cart.some((x) => x.id === s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() =>
                                tab === "diagnostic"
                                  ? setDiagSlot(s)
                                  : toggleCart(s)
                              }
                              className={clsx(
                                "rounded-lg border-gold px-3 py-1.5 text-sm transition",
                                picked
                                  ? "bg-accent text-bg"
                                  : "hover:bg-surface-2",
                              )}
                            >
                              {timeOf(s.startsAt)}
                              <span className="ml-1 opacity-70">
                                · {s.remaining} мест
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "lesson" && cart.length > 0 && (
              <div className="mt-4 rounded-lg border-gold p-3 text-sm">
                {cart.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-0.5"
                  >
                    <span>
                      {s.formatName} · {dayOf(s.startsAt)} {timeOf(s.startsAt)}
                    </span>
                    <button
                      onClick={() => toggleCart(s)}
                      className="text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="mt-2 border-t border-white/10 pt-2">
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

                {(tab === "diagnostic" || cart.length === 1) && (
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
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="btn-gold mt-5 w-full disabled:opacity-40"
            >
              {submitting ? "Отправка…" : "Записаться"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-lg border-gold px-3 py-2 text-sm transition",
        active ? "bg-accent text-bg" : "hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
