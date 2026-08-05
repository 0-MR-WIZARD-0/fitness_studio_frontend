"use client";

import { useEffect, useMemo, useState } from "react";
import type { Announcement, Format, Slot, Trainer } from "@/lib/api";
import {
  adminAnnouncements,
  adminBookings,
  adminFormatList,
  adminSlots,
  adminTrainers,
  createAnnouncement,
  createSlot,
  createWeekdaySlots,
  deleteAnnouncement,
  deleteSlot,
  updateAnnouncement,
  updateSlot,
  type AdminBooking,
  type AdminSlot,
} from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";
import { WeekMatrix } from "@/components/booking/WeekMatrix";
import { toKey } from "@/components/Calendar";
import { Select } from "@/components/Select";

export default function AdminBooking() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [formatId, setFormatId] = useState<number | null>(null);
  const [diag, setDiag] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selected, setSelected] = useState<string>(() => toKey(new Date()));
  const [openSlotId, setOpenSlotId] = useState<number | null>(null);
  const [openAnnId, setOpenAnnId] = useState<number | null>(null);
  const [time, setTime] = useState("10:00");
  const [capacity, setCapacity] = useState(7);
  const [weekdayMode, setWeekdayMode] = useState(false);
  const [weeks, setWeeks] = useState(2);
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(
    null,
  );
  const [confirmMove, setConfirmMove] = useState<AdminSlot | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // анонс отдельного занятия
  const [asAnnouncement, setAsAnnouncement] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annDescription, setAnnDescription] = useState("");
  const [annDuration, setAnnDuration] = useState(60);
  const [annFree, setAnnFree] = useState(true);
  const [annPrice, setAnnPrice] = useState(0);

  useEffect(() => {
    adminFormatList().then((fs) => {
      setFormats(fs);
      if (fs[0]) setFormatId(fs[0].id);
    });
    adminTrainers().then((ts) => {
      const active = ts.filter((t) => t.isActive);
      setTrainers(active);
      if (active[0]) setTrainerId(active[0].id);
    });
  }, []);

  const reload = () => {
    adminSlots().then(setSlots);
    adminAnnouncements().then(setAnnouncements);
    adminBookings().then(setBookings);
  };
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  // AdminSlot -> форма, понятная календарю
  const matrixSlots: Slot[] = useMemo(
    () =>
      slots.map((s) => ({
        id: s.id,
        startsAt: s.startsAt,
        durationMin: s.durationMin,
        capacity: s.capacity,
        formatId: s.formatId,
        isDiagnostic: s.isDiagnostic,
        formatName: s.format?.name ?? null,
        trainerId: s.trainerId,
        trainerName: s.trainer?.name ?? null,
        pricePerSession: s.format?.pricePerSession ?? 0,
        taken: s._count.bookings,
        remaining: Math.max(0, s.capacity - s._count.bookings),
      })),
    [slots],
  );

  const openSlot = slots.find((s) => s.id === openSlotId) ?? null;
  const openAnn = announcements.find((a) => a.id === openAnnId) ?? null;
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

  function startsAtIso() {
    const [h, m] = time.split(":").map(Number);
    const dt = new Date(selected);
    dt.setHours(h, m, 0, 0);
    return dt.toISOString();
  }

  async function create() {
    if (asAnnouncement) {
      if (!annTitle.trim()) {
        flash("Укажите название занятия");
        return;
      }
      if (!trainerId) {
        flash("Укажите тренера");
        return;
      }
      await createAnnouncement({
        title: annTitle.trim(),
        description: annDescription,
        startsAt: startsAtIso(),
        durationMin: annDuration,
        trainerId,
        capacity,
        price: annFree ? 0 : annPrice,
        isFree: annFree,
        isActive: true,
      });
      setAnnTitle("");
      setAnnDescription("");
      flash("Анонс добавлен");
      setTime((t) => shiftTime(t, annDuration));
      reload();
      return;
    }

    if (!trainerId) {
      flash("Сначала добавьте тренера");
      return;
    }
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
      await createSlot({
        formatId: diag ? undefined : formatId!,
        trainerId,
        startsAt: startsAtIso(),
        capacity,
        isDiagnostic: diag,
      });
      flash("Занятие добавлено");
    }
    setTime((t) => shiftTime(t, duration));
    reload();
  }

  async function reschedule(password: string) {
    if (!editing) return;
    setMoveError(null);
    try {
      await updateSlot(
        editing.id,
        new Date(editing.value).toISOString(),
        undefined,
        { password, notified: true },
      );
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "Не удалось перенести");
      return;
    }
    setEditing(null);
    setConfirmMove(null);
    reload();
    flash("Занятие перенесено");
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const fmtDay = (key: string) => {
    const d = new Date(key);
    const date = d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
    const weekday = d.toLocaleDateString("ru-RU", { weekday: "long" });
    return `${date} — ${weekday}`;
  };

  return (
    <div className="max-w-6xl">
      <PageTitle>Расписание и записи</PageTitle>

      <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
        <p className="mb-1 font-sub text-heading">
          Создать на: {fmtDay(selected)}
        </p>
        <p className="mb-4 text-xs text-text/50">
          День берётся из календаря ниже — кликните по дате нужного дня.
          Продолжительность занятия подставляется из формата, у диагностики — 30
          минут. Одного тренера нельзя поставить на два пересекающихся занятия.
        </p>

        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={asAnnouncement}
            onChange={(e) => setAsAnnouncement(e.target.checked)}
          />
          Анонсировать отдельное занятие
        </label>

        {asAnnouncement ? (
          <div className="space-y-4">
            <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">
                <span className="mb-1 block h-5 text-text/80">Название</span>
                <input
                  className="field"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Открытый урок"
                />
              </label>
              <div className="text-sm">
                <span className="mb-1 block h-5 text-text/80">Тренер</span>
                <Select
                  value={trainerId ?? ""}
                  onChange={(v) => setTrainerId(Number(v))}
                  placeholder="Укажите тренера"
                  disabled={trainers.length === 0}
                  options={trainers.map((t) => ({
                    value: t.id,
                    label: t.role ? `${t.name} — ${t.role}` : t.name,
                  }))}
                />
              </div>
              <label className="text-sm">
                <span className="mb-1 block h-5 text-text/80">Время</span>
                <input
                  type="time"
                  className="field"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block h-5 text-text/80">
                  Длительность, мин
                </span>
                <input
                  type="number"
                  className="field"
                  min={5}
                  value={annDuration}
                  onChange={(e) =>
                    setAnnDuration(Math.max(5, Number(e.target.value)))
                  }
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block h-5 text-text/80">Мест</span>
                <input
                  type="number"
                  className="field"
                  min={1}
                  max={7}
                  value={capacity}
                  onChange={(e) =>
                    setCapacity(Math.min(7, Number(e.target.value)))
                  }
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-text/80">Описание</span>
              <textarea
                className="field"
                rows={3}
                value={annDescription}
                onChange={(e) => setAnnDescription(e.target.value)}
              />
            </label>

            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={annFree}
                  onChange={(e) => setAnnFree(e.target.checked)}
                />
                Бесплатно
              </label>
              {!annFree && (
                <label className="mt-3 block text-sm">
                  <span className="mb-1 block text-text/80">Цена, ₽</span>
                  <input
                    type="number"
                    className="field w-40"
                    min={0}
                    value={annPrice}
                    onChange={(e) => setAnnPrice(Number(e.target.value))}
                  />
                </label>
              )}
            </div>

            <div>
              <button
                onClick={create}
                disabled={trainers.length === 0}
                className="btn-gold disabled:opacity-40"
              >
                Создать анонс
              </button>
              {trainers.length === 0 && (
                <p className="mt-2 text-xs text-red-400">
                  Сначала добавьте тренера в разделе «Тренеры».
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-sm">
                <span className="mb-1 block h-5 text-text/80">Занятие</span>
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
                <span className="mb-1 block h-5 text-text/80">Тренер</span>
                <Select
                  value={trainerId ?? ""}
                  onChange={(v) => setTrainerId(Number(v))}
                  placeholder="Укажите тренера"
                  disabled={trainers.length === 0}
                  options={trainers.map((t) => ({
                    value: t.id,
                    label: t.role ? `${t.name} — ${t.role}` : t.name,
                  }))}
                />
              </div>

              <label className="text-sm">
                <span className="mb-1 block h-5 text-text/80">Время</span>
                <input
                  type="time"
                  className="field"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block h-5 text-text/80">Мест</span>
                <input
                  type="number"
                  className="field"
                  value={capacity}
                  min={1}
                  max={7}
                  onChange={(e) =>
                    setCapacity(Math.min(7, Number(e.target.value)))
                  }
                />
              </label>
            </div>

            <p className="mt-2 text-xs text-text/50">
              Занятие {duration} мин — следующее можно ставить с{" "}
              {shiftTime(time, duration)}. Мест не больше 7.
            </p>

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
              <button
                onClick={create}
                disabled={trainers.length === 0}
                className="btn-gold disabled:opacity-40"
              >
                {weekdayMode
                  ? `Создать Пн–Пт × ${weeks} нед.`
                  : "Создать занятие"}
              </button>
            </div>

            {trainers.length === 0 && (
              <p className="mt-3 text-xs text-red-400">
                Список тренеров пуст — добавьте тренера в разделе «Тренеры»,
                иначе занятие создать нельзя.
              </p>
            )}
          </>
        )}
      </div>

      <WeekMatrix
        formats={formats}
        slots={matrixSlots}
        announcements={announcements}
        selectedDay={selected}
        onSelectDay={setSelected}
        emptyText="На этой неделе занятий нет."
        isSelected={(s) => s.id === openSlotId}
        onPick={(s) => {
          setOpenAnnId(null);
          setOpenSlotId(s.id === openSlotId ? null : s.id);
          setSelected(toKey(new Date(s.startsAt)));
          setEditing(null);
        }}
        isAnnouncementSelected={(a) => a.id === openAnnId}
        onPickAnnouncement={(a) => {
          setOpenSlotId(null);
          setOpenAnnId(a.id === openAnnId ? null : a.id);
          setSelected(toKey(new Date(a.startsAt)));
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
                  await updateSlot(openSlot.id, openSlot.startsAt, Number(v));
                  reload();
                  flash("Тренер обновлён");
                }}
                placeholder="Укажите тренера"
                disabled={trainers.length === 0}
                options={trainers.map((t) => ({ value: t.id, label: t.name }))}
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
                  onClick={() => {
                    setMoveError(null);
                    setConfirmMove(openSlot);
                  }}
                  disabled={editing?.id !== openSlot.id}
                  className="btn-gold disabled:opacity-40"
                >
                  Перенести
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
              if (!confirm("Удалить занятие? Записи сохранятся в списке.")) return;
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

      {openAnn && (
        <AnnouncementEditor
          key={openAnn.id}
          item={openAnn}
          trainers={trainers}
          onClose={() => setOpenAnnId(null)}
          onSaved={(m) => {
            reload();
            flash(m);
          }}
        />
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

      {confirmMove && editing && (
        <MoveDialog
          slot={confirmMove}
          newValue={editing.value}
          error={moveError}
          onCancel={() => {
            setConfirmMove(null);
            setMoveError(null);
          }}
          onConfirm={reschedule}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

function MoveDialog({
  slot,
  newValue,
  error,
  onCancel,
  onConfirm,
}: {
  slot: AdminSlot | null;
  newValue: string;
  error: string | null;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}) {
  const [notified, setNotified] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const when = (value: string | Date) =>
    new Date(value).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

  const booked = slot?._count.bookings ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border-gold bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-sub text-xl text-heading">Перенос занятия</h3>

        {slot && (
          <p className="mt-3 text-sm leading-relaxed">
            {when(slot.startsAt)} →{" "}
            <span className="text-accent">{when(newValue)}</span>
            <br />
            {booked > 0
              ? `На занятие записаны ${booked} чел.: ${slot.bookings
                  .map((b) => b.name)
                  .join(", ")}`
              : "Записей на это занятие пока нет."}
          </p>
        )}

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={notified}
            onChange={(e) => setNotified(e.target.checked)}
          />
          <span>
            Подтверждаю, что все записанные клиенты уведомлены о переносе
          </span>
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-text/80">
            Пароль от учётной записи
          </span>
          <input
            type="password"
            className="field"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={async () => {
              setBusy(true);
              await onConfirm(password);
              setBusy(false);
            }}
            disabled={!notified || !password || busy}
            className="btn-gold disabled:opacity-40"
          >
            {busy ? "Переносим…" : "Перенести"}
          </button>
          <button onClick={onCancel} className="text-sm text-text/70">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementEditor({
  item,
  trainers,
  onClose,
  onSaved,
}: {
  item: Announcement;
  trainers: Trainer[];
  onClose: () => void;
  onSaved: (m: string) => void;
}) {
  const [draft, setDraft] = useState(item);

  return (
    <div className="mt-8 rounded-2xl border border-accent/50 bg-surface/50 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="font-sub text-lg text-heading">
          Анонс ·{" "}
          {new Date(item.startsAt).toLocaleString("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <button
          onClick={onClose}
          className="text-2xl leading-none text-text/60 hover:text-heading"
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Название</span>
          <input
            className="field"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <div className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Тренер</span>
          <Select
            value={draft.trainerId ?? ""}
            onChange={(v) => setDraft({ ...draft, trainerId: Number(v) })}
            placeholder="Укажите тренера"
            disabled={trainers.length === 0}
            options={trainers.map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Длительность, мин</span>
          <input
            type="number"
            className="field"
            min={5}
            value={draft.durationMin}
            onChange={(e) =>
              setDraft({
                ...draft,
                durationMin: Math.max(5, Number(e.target.value)),
              })
            }
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Мест</span>
          <input
            type="number"
            className="field"
            min={1}
            max={7}
            value={draft.capacity}
            onChange={(e) =>
              setDraft({
                ...draft,
                capacity: Math.min(7, Number(e.target.value)),
              })
            }
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-text/80">Описание</span>
        <textarea
          className="field"
          rows={3}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </label>

      <div className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isFree}
            onChange={(e) => setDraft({ ...draft, isFree: e.target.checked })}
          />
          Бесплатно
        </label>
        {!draft.isFree && (
          <label className="block text-sm">
            <span className="mb-1 block text-text/80">Цена, ₽</span>
            <input
              type="number"
              className="field w-40"
              min={0}
              value={draft.price}
              onChange={(e) =>
                setDraft({ ...draft, price: Number(e.target.value) })
              }
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
          />
          Показывать на сайте
        </label>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={async () => {
            await updateAnnouncement(item.id, {
              ...draft,
              price: draft.isFree ? 0 : draft.price,
            });
            onSaved("Анонс сохранён");
          }}
          className="btn-gold"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm("Удалить анонс?")) return;
            await deleteAnnouncement(item.id);
            onClose();
            onSaved("Анонс удалён");
          }}
          className="text-sm text-red-400"
        >
          Удалить анонс
        </button>
      </div>
    </div>
  );
}
