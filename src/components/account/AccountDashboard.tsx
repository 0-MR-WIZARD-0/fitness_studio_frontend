"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { formatPhone, isValidPhone } from "@/lib/phone";
import { plural } from "@/lib/plural";
import {
  accountBookings,
  accountCourses,
  accountFreezes,
  accountLogout,
  accountProfile,
  accountPromos,
  cancelAccountBooking,
  cancelAccountCourse,
  freezeAccountBooking,
  getAvailableSlots,
  getDiagnosticSlots,
  getRentSlots,
  getSettings,
  moveAccountBooking,
  type AccountBooking,
  type AccountCourse,
  type AccountFreeze,
  type AccountPromo,
  type RentalSlot,
  type SiteSettings,
  type Slot,
} from "@/lib/api";
import { WeekGrid } from "../booking/WeekGrid";
import { toKey } from "../Calendar";
import { useAccount } from "./AccountProvider";

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

type Tab = "profile" | "bookings" | "promo";

interface Confirm {
  title: string;
  text: string;
  warning?: string | null;
  confirmLabel: string;
  danger?: boolean;
  run: () => Promise<void>;
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function AccountDashboard() {
  const router = useRouter();
  const { user, setUser, loading, openAuth } = useAccount();
  const [bookings, setBookings] = useState<AccountBooking[]>([]);
  const [promos, setPromos] = useState<AccountPromo[]>([]);
  const [courses, setCourses] = useState<AccountCourse[]>([]);
  const [freezes, setFreezes] = useState<AccountFreeze[]>([]);
  const [contacts, setContacts] = useState<SiteSettings | null>(null);
  const [moving, setMoving] = useState<AccountBooking | null>(null);
  const [confirming, setConfirming] = useState<Confirm | null>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    accountBookings()
      .then(setBookings)
      .catch(() => {});
    accountPromos()
      .then(setPromos)
      .catch(() => {});
    accountCourses()
      .then(setCourses)
      .catch(() => {});
    accountFreezes()
      .then(setFreezes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    getSettings()
      .then(setContacts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) reload();
  }, [user, reload]);

  if (loading) return <p className="mt-8 text-text/60">Загрузка…</p>;

  if (!user)
    return (
      <div className="mt-8 max-w-md rounded-2xl border-gold bg-surface/50 p-6">
        <p className="text-sm leading-relaxed">
          Чтобы посмотреть свои записи и промокоды, войдите в кабинет.
        </p>
        <button onClick={() => openAuth("login")} className="btn-gold mt-4">
          Войти
        </button>
      </div>
    );

  const upcoming = bookings.filter(
    (b) =>
      b.status !== "CANCELLED" &&
      b.startsAt &&
      new Date(b.startsAt).getTime() > Date.now(),
  );
  const history = bookings.filter((b) => !upcoming.includes(b));
  const activePromos = promos.filter(
    (p) => !p.isUsed && new Date(p.expiresAt).getTime() > Date.now(),
  ).length;

  const run = async (action: () => Promise<string>) => {
    setError(null);
    try {
      setMessage(await action());
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось выполнить");
    } finally {
      setConfirming(null);
    }
  };

  function askCancel(booking: AccountBooking) {
    setConfirming({
      title: "Отмена записи",
      text: `${booking.title} · ${when(booking.startsAt)}.`,
      warning: booking.cancelWarning,
      confirmLabel: "Отменить запись",
      danger: true,
      run: () =>
        run(async () => {
          const res = await cancelAccountBooking(booking.id);
          return res.burnedGift
            ? `Запись отменена, промокод ${res.burnedGift} сгорел`
            : "Запись отменена";
        }),
    });
  }

  function askFreeze(booking: AccountBooking) {
    setConfirming({
      title: "Заморозка занятия",
      text: `${booking.title} · ${when(booking.startsAt)}.`,
      warning:
        "Занятие снимется, но курс и подарочный промокод сохранятся. Заморозка одна на курс, повторно ею воспользоваться нельзя.",
      confirmLabel: "Заморозить",
      run: () =>
        run(async () => {
          await freezeAccountBooking(booking.id);
          return "Занятие заморожено — курс и подарок сохранены";
        }),
    });
  }

  function askCancelCourse(course: AccountCourse) {
    setConfirming({
      title: "Отказ от курса",
      text: `Курс из ${course.lessons} ${plural(course.lessons, ["занятия", "занятий", "занятий"])} на сумму ${course.total.toLocaleString("ru-RU")} ₽.`,
      warning: course.giftCode
        ? `Снимутся все занятия курса, подарочный промокод ${course.giftCode} сгорит.`
        : "Снимутся все занятия курса вместе с занятием по подарочному промокоду.",
      confirmLabel: "Отказаться от курса",
      danger: true,
      run: () =>
        run(async () => {
          const res = await cancelAccountCourse(course.courseGroupId);
          return `Курс отменён, снято записей: ${res.cancelled}`;
        }),
    });
  }

  const tabs: [Tab, string][] = [
    ["profile", "Личная информация"],
    ["bookings", `Мои записи${upcoming.length ? ` · ${upcoming.length}` : ""}`],
    ["promo", `Мои промокоды${activePromos ? ` · ${activePromos}` : ""}`],
  ];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text/70">
          <span className="text-heading">{user.name}</span> · {user.email}
        </p>
        <button
          onClick={async () => {
            await accountLogout().catch(() => {});
            setUser(null);
            router.push("/");
          }}
          className="text-sm text-text/70 hover:text-heading"
        >
          Выйти
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setMessage(null);
              setError(null);
            }}
            className={clsx(
              "rounded-xl border px-4 py-2 transition",
              tab === key
                ? "border-accent bg-accent/15 text-heading"
                : "border-white/15 text-text/70 hover:bg-surface-2/50",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {(message || error) && (
        <p
          className={clsx(
            "mt-5 text-sm",
            error ? "text-red-400" : "text-emerald-400",
          )}
        >
          {error ?? message}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {tab === "profile" && (
          <ProfileCard
            user={user}
            onSaved={(u) => {
              setUser(u);
              setMessage("Профиль сохранён");
            }}
          />
        )}

        {tab === "bookings" && (
          <>
            {courses.length > 0 && (
              <section>
                <h2 className="font-sub text-xl text-heading">Мои курсы</h2>
                <div className="mt-4 space-y-3">
                  {courses.map((c) => (
                    <CourseRow
                      key={c.courseGroupId}
                      course={c}
                      onCancel={() => askCancelCourse(c)}
                    />
                  ))}
                </div>
              </section>
            )}

            {freezes.length > 0 && (
              <section>
                <h2 className="font-sub text-xl text-heading">Заморозки</h2>
                <p className="mt-2 text-sm text-text/60">
                  По одной заморозке за курс: снимает занятие, но сохраняет курс
                  и подарок. Использовать можно не позднее чем за{" "}
                  {upcoming[0]?.editHours ?? 4} ч до начала.
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  {freezes.map((f) => (
                    <div
                      key={f.id}
                      className="rounded-xl border-gold bg-surface/40 px-4 py-2"
                    >
                      {f.usedAt ? (
                        <span className="text-text/60">
                          использована{" "}
                          {new Date(f.usedAt).toLocaleDateString("ru-RU")}
                        </span>
                      ) : f.isExpired ? (
                        <span className="text-text/50">сгорела</span>
                      ) : (
                        <span className="text-emerald-400">
                          доступна до{" "}
                          {new Date(f.expiresAt).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-sub text-xl text-heading">
                Ближайшие записи
              </h2>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-text/60">
                  Пока ничего не запланировано.{" "}
                  <Link
                    href="/booking"
                    className="text-accent underline underline-offset-4"
                  >
                    Записаться
                  </Link>
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {upcoming.map((b) => (
                    <BookingRow
                      key={b.id}
                      booking={b}
                      onCancel={() => askCancel(b)}
                      onFreeze={() => askFreeze(b)}
                      onMove={() => {
                        setError(null);
                        setMoving(b);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-emerald-400/40 bg-emerald-400/5 p-4 text-sm leading-relaxed">
              <p className="font-sub text-emerald-300">Заболели?</p>
              <p className="mt-1 text-text/80">
                Свяжитесь со студией — перенесём занятия вне общих правил, даже
                если до начала осталось меньше {upcoming[0]?.editHours ?? 4} ч.
              </p>
              {contacts && (
                <p className="mt-2 text-text/75">
                  {contacts.phone}
                  {contacts.email ? ` · ${contacts.email}` : ""}
                </p>
              )}
            </section>

            {history.length > 0 && (
              <section>
                <h2 className="font-sub text-xl text-heading">История</h2>
                <div className="mt-4 space-y-2">
                  {history.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-white/10 bg-surface/20 px-4 py-2 text-sm text-text/70"
                    >
                      <span className="text-heading/80">{b.title}</span> ·{" "}
                      {when(b.startsAt)}
                      {b.status === "CANCELLED" && (
                        <span className="ml-2 text-red-400">отменена</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {tab === "promo" && (
          <section>
            <h2 className="font-sub text-xl text-heading">Мои промокоды</h2>
            {promos.length === 0 ? (
              <p className="mt-3 text-sm text-text/60">Промокодов пока нет.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {promos.map((p) => {
                  const expired = new Date(p.expiresAt).getTime() < Date.now();
                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-gold bg-surface/40 px-4 py-2 text-sm"
                    >
                      <code className="text-accent">{p.code}</code>
                      <span className="text-text/70">
                        {p.kind === "GIFT" ? "подарочный" : "промокод"}
                      </span>
                      <span
                        className={clsx(
                          "text-xs",
                          p.isUsed || expired
                            ? "text-text/50"
                            : "text-emerald-400",
                        )}
                      >
                        {p.isUsed
                          ? "использован"
                          : expired
                            ? "истёк"
                            : `действует до ${new Date(p.expiresAt).toLocaleDateString("ru-RU")}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {confirming && (
        <ConfirmDialog data={confirming} onClose={() => setConfirming(null)} />
      )}

      {moving && (
        <MoveDialog
          booking={moving}
          onClose={() => setMoving(null)}
          onDone={() => {
            setMoving(null);
            setMessage("Запись перенесена");
            reload();
          }}
        />
      )}
    </div>
  );
}

function ProfileCard({
  user,
  onSaved,
}: {
  user: { id: number; email: string; name: string; phone: string };
  onSaved: (user: {
    id: number;
    email: string;
    name: string;
    phone: string;
  }) => void;
}) {
  const [draft, setDraft] = useState({ name: user.name, phone: user.phone });
  const [busy, setBusy] = useState(false);
  const changed = draft.name !== user.name || draft.phone !== user.phone;

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5">
      <p className="font-sub text-lg text-heading">Личная информация</p>
      <p className="mt-1 text-xs text-text/50">
        Эти данные подставляются в запись и бронь. Почта {user.email} — логин
        кабинета, её сменить нельзя.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-text/80">ФИО</span>
          <input
            className="field"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Телефон</span>
          <input
            className="field"
            inputMode="tel"
            value={draft.phone}
            onChange={(e) =>
              setDraft({ ...draft, phone: formatPhone(e.target.value) })
            }
          />
        </label>
      </div>

      <button
        onClick={async () => {
          setBusy(true);
          try {
            const res = await accountProfile({
              name: draft.name,
              phone: draft.phone,
            });
            onSaved(res.user);
          } finally {
            setBusy(false);
          }
        }}
        disabled={
          !changed || busy || !draft.name.trim() || !isValidPhone(draft.phone)
        }
        className="btn-gold mt-4 disabled:opacity-40"
      >
        {busy ? "Сохраняем…" : "Сохранить"}
      </button>
    </div>
  );
}

function BookingRow({
  booking,
  onCancel,
  onFreeze,
  onMove,
}: {
  booking: AccountBooking;
  onCancel: () => void;
  onFreeze: () => void;
  onMove: () => void;
}) {
  return (
    <div className="rounded-2xl border-gold bg-surface/40 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-sub text-heading">{booking.title}</p>
          <p className="mt-0.5 text-text/75">
            {when(booking.startsAt)}
            {booking.durationMin ? ` · ${booking.durationMin} мин` : ""}
            {booking.trainerName ? ` · ${booking.trainerName}` : ""}
          </p>
          <p className="mt-0.5 text-text/60">
            {booking.isFree
              ? "бесплатно"
              : `${booking.price.toLocaleString("ru-RU")} ₽`}
            {booking.isCourse ? " · в составе курса" : ""}
            {booking.promoCode ? ` · промокод ${booking.promoCode}` : ""}
          </p>
          {booking.awaitingPayment && (
            <p className="mt-1 text-amber-300">
              Ожидает оплаты
              {booking.paymentUrl && (
                <>
                  {" · "}
                  <a
                    href={booking.paymentUrl}
                    className="underline underline-offset-4"
                  >
                    оплатить
                  </a>
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {booking.canMove && (
            <button
              onClick={onMove}
              className="text-accent underline underline-offset-4"
            >
              Перенести
            </button>
          )}
          {booking.canFreeze && (
            <button
              onClick={onFreeze}
              className="text-emerald-300 underline underline-offset-4"
            >
              Заморозить
            </button>
          )}
          {booking.canCancel ? (
            <button onClick={onCancel} className="text-red-400">
              Отменить
            </button>
          ) : (
            <span className="text-xs text-text/50">
              перенос и отмена — не позднее чем за {booking.editHours} ч до
              начала
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MoveDialog({
  booking,
  onClose,
  onDone,
}: {
  booking: AccountBooking;
  onClose: () => void;
  onDone: () => void;
}) {
  const [lessons, setLessons] = useState<Slot[]>([]);
  const [rentals, setRentals] = useState<RentalSlot[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRent = booking.kind === "RENT";

  useEffect(() => {
    if (isRent) {
      getRentSlots()
        .then((list) =>
          setRentals(
            list.filter((s) => !s.isBooked && s.id !== booking.rentalSlotId),
          ),
        )
        .catch(() => {});
      return;
    }
    const source =
      booking.kind === "DIAGNOSTIC"
        ? getDiagnosticSlots()
        : getAvailableSlots(booking.formatId ?? undefined);
    source
      .then((list) =>
        setLessons(
          list.filter((s) => s.id !== booking.slotId && s.remaining > 0),
        ),
      )
      .catch(() => {});
  }, [booking, isRent]);

  const options = isRent
    ? rentals.map((s) => ({
        id: s.id,
        startsAt: s.startsAt,
        title: s.hallTitle
          ? `${s.hallTitle} · ${s.serviceTitle}`
          : s.serviceTitle,
        note: `${timeOf(s.startsAt)} – ${timeOf(s.endsAt)}`,
        extra:
          s.price > 0 ? `${s.price.toLocaleString("ru-RU")} ₽` : "бесплатно",
      }))
    : lessons.map((s) => ({
        id: s.id,
        startsAt: s.startsAt,
        title: s.formatName ?? "Диагностика",
        note: `${timeOf(s.startsAt)}${s.trainerName ? ` · ${s.trainerName}` : ""}`,
        extra: `мест ${s.remaining}`,
      }));

  const byDay = new Map<string, typeof options>();
  for (const o of options) {
    const key = toKey(new Date(o.startsAt));
    byDay.set(key, [...(byDay.get(key) ?? []), o]);
  }
  for (const list of byDay.values())
    list.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-start justify-center overflow-y-auto overlay-dim backdrop-blur-sm p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border-gold bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-sub text-xl text-heading">Перенос записи</h3>
        <p className="mt-2 text-sm text-text/75">
          {booking.title} · {when(booking.startsAt)}. Выберите свободное время в
          календаре.
        </p>

        {options.length === 0 ? (
          <p className="mt-4 text-sm text-text/60">
            Свободного времени для переноса сейчас нет. Свяжитесь со студией.
          </p>
        ) : (
          <div className="mt-4">
            <WeekGrid
              firstDate={options[0]?.startsAt ?? null}
              renderDay={(key) => {
                const day = byDay.get(key) ?? [];
                if (!day.length)
                  return <p className="px-1 text-xs text-text/30">нет мест</p>;
                return day.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setPicked(o.id)}
                    className={clsx(
                      "block w-full rounded-xl border px-3 py-2 text-left transition",
                      picked === o.id
                        ? "border-accent bg-accent/15"
                        : "border-[color-mix(in_srgb,var(--color-border)_40%,transparent)] bg-surface/30 hover:bg-surface",
                    )}
                  >
                    <span className="block font-sub text-sm text-heading">
                      {o.note}
                    </span>
                    <span className="block text-xs text-text/60">
                      {o.title}
                    </span>
                    <span className="block text-xs text-accent">{o.extra}</span>
                  </button>
                ));
              }}
              renderFooter={(days) =>
                days.some((d) => byDay.has(toKey(d))) ? null : (
                  <p className="mt-5 text-sm text-text/60">
                    На этой неделе мест нет — листайте вперёд.
                  </p>
                )
              }
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={async () => {
              if (!picked) return;
              setBusy(true);
              setError(null);
              try {
                await moveAccountBooking(
                  booking.id,
                  isRent ? { rentalSlotId: picked } : { slotId: picked },
                );
                onDone();
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Не удалось перенести",
                );
              } finally {
                setBusy(false);
              }
            }}
            disabled={!picked || busy}
            className="btn-gold disabled:opacity-40"
          >
            {busy ? "Переносим…" : "Перенести"}
          </button>
          <button onClick={onClose} className="text-sm text-text/70">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseRow({
  course,
  onCancel,
}: {
  course: AccountCourse;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border-gold bg-surface/40 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-sub text-heading">
            Курс из {course.lessons}{" "}
            {plural(course.lessons, ["занятия", "занятий", "занятий"])}
          </p>
          <p className="mt-0.5 text-text/75">
            Первое занятие: {when(course.firstAt)} ·{" "}
            {course.total.toLocaleString("ru-RU")} ₽
          </p>
          <p className="mt-0.5 text-text/60">
            {course.giftCode
              ? `подарочный промокод ${course.giftCode}`
              : course.giftUsedAt
                ? `подарок использован на ${when(course.giftUsedAt)}`
                : "подарок уже не действует"}
            {course.freezeExpiresAt
              ? ` · заморозка до ${new Date(course.freezeExpiresAt).toLocaleDateString("ru-RU")}`
              : " · заморозка использована"}
          </p>
        </div>

        {course.canCancel ? (
          <button onClick={onCancel} className="text-red-400">
            Отказаться от курса
          </button>
        ) : (
          <span className="text-xs text-text/50">
            отказ от курса — не позднее чем за {course.courseHours} ч до первого
            занятия
          </span>
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({
  data,
  onClose,
}: {
  data: Confirm;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overlay-dim backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border-gold bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-sub text-xl text-heading">{data.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-text/80">{data.text}</p>
        {data.warning && (
          <p
            className={clsx(
              "mt-3 rounded-xl px-3 py-2 text-sm leading-relaxed",
              data.danger
                ? "bg-red-500/10 text-red-300"
                : "bg-emerald-400/10 text-emerald-300",
            )}
          >
            {data.warning}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await data.run();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className={clsx(
              "disabled:opacity-40",
              data.danger
                ? "rounded-xl border border-red-400 px-5 py-2 text-sm text-red-300"
                : "btn-gold",
            )}
          >
            {busy ? "Выполняем…" : data.confirmLabel}
          </button>
          <button onClick={onClose} className="text-sm text-text/70">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
