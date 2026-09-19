"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminHalls,
  adminRentSlots,
  createHall,
  deleteHall,
  deleteRentSlot,
  syncRentSlots,
  updateHall,
  updateRentSlot,
  type AdminRentalSlot,
  type HallInput,
} from "@/lib/admin";
import type { Hall } from "@/lib/api";
import { PageTitle, Toast } from "@/components/admin/ui";
import { NumberInput } from "@/components/admin/NumberInput";
import { WeekGrid } from "@/components/booking/WeekGrid";
import { toKey } from "@/components/Calendar";
import { clsx } from "@/lib/clsx";

type HallDraft = {
  title: string;
  description: string;
  priceSingle: number;
  price4: number;
  price8: number;
  price12: number;
  dayStart: string;
  dayEnd: string;
  bufferMin: number;
  autoSchedule: boolean;
  bookingUrl: string;
};

const EMPTY: HallDraft = {
  title: "",
  description: "",
  priceSingle: 0,
  price4: 0,
  price8: 0,
  price12: 0,
  dayStart: "09:00",
  dayEnd: "17:30",
  bufferMin: 30,
  autoSchedule: true,
  bookingUrl: "",
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminHalls() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [slots, setSlots] = useState<AdminRentalSlot[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => {
    adminHalls().then(setHalls);
    adminRentSlots().then(setSlots);
  };
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };
  const changed = (m: string) => {
    reload();
    flash(m);
  };

  const autoHalls = halls.filter((h) => h.autoSchedule && h.isActive);

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Залы</PageTitle>
        <button
          onClick={() => setAdding(true)}
          disabled={adding}
          className="btn-gold disabled:opacity-40"
        >
          + Добавить зал
        </button>
      </div>
      <p className="-mt-4 mb-6 text-sm text-text/70">
        Залы независимы: занятие в одном не занимает время другого. Зал с
        автоматическим расписанием сам отдаёт свободные часы под аренду в те
        дни, когда в нём есть занятия. Если автоматику выключить, клиент
        записывается по ссылке, которую вы укажете.
      </p>

      {adding && (
        <HallForm
          initial={EMPTY}
          submitLabel="Добавить зал"
          onSubmit={async (draft) => {
            await createHall({
              ...draft,
              order: halls.length + 1,
              isActive: true,
            });
            setAdding(false);
            changed("Зал добавлен");
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="space-y-4">
        {halls.map((hall) => (
          <HallForm
            key={hall.id}
            initial={{
              title: hall.title,
              description: hall.description,
              priceSingle: hall.priceSingle,
              price4: hall.price4,
              price8: hall.price8,
              price12: hall.price12,
              dayStart: hall.dayStart,
              dayEnd: hall.dayEnd,
              bufferMin: hall.bufferMin,
              autoSchedule: hall.autoSchedule,
              bookingUrl: hall.bookingUrl,
            }}
            submitLabel="Сохранить"
            onSubmit={async (draft) => {
              await updateHall(hall.id, {
                ...draft,
                order: hall.order,
                isActive: hall.isActive,
              });
              changed("Зал сохранён");
            }}
            onDelete={async () => {
              if (
                !confirm(
                  `Удалить зал «${hall.title}»? Его часы аренды тоже пропадут.`,
                )
              )
                return;
              await deleteHall(hall.id);
              changed("Зал удалён");
            }}
          />
        ))}
        {halls.length === 0 && !adding && (
          <p className="text-text/60">
            Залов пока нет. Пока нет ни одного зала, занятие создать нельзя.
          </p>
        )}
      </div>

      {autoHalls.length > 0 && (
        <RentCalendar
          halls={autoHalls}
          slots={slots}
          onChanged={changed}
          onSync={async () => {
            const res = await syncRentSlots();
            changed(
              `Часы пересобраны: добавлено ${res.created}, убрано ${res.removed}`,
            );
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

function HallForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  onCancel,
}: {
  initial: HallDraft;
  submitLabel: string;
  onSubmit: (draft: HallInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benefit = (price: number, hours: number) =>
    price > 0 ? Math.max(0, draft.priceSingle - price) * hours : 0;

  return (
    <div className="mb-4 rounded-2xl border-gold bg-surface/50 p-5">
      <div className="grid items-start gap-4 md:grid-cols-3 lg:grid-cols-6">
        <label className="text-sm lg:col-span-2">
          <span className="mb-1 block h-9 text-text/80">Название зала</span>
          <input
            className="field"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Основной зал"
          />
        </label>
        {(
          [
            ["priceSingle", "Разовое посещение"],
            ["price4", "Месяц: 4 часа"],
            ["price8", "Месяц: 8 часов"],
            ["price12", "Месяц: 12 часов"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block h-9 text-text/80">{label}, ₽/час</span>
            <NumberInput
              value={draft[key]}
              onChange={(v) => setDraft({ ...draft, [key]: v })}
              min={0}
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Аренда с</span>
          <input
            type="time"
            className="field"
            value={draft.dayStart}
            onChange={(e) => setDraft({ ...draft, dayStart: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Аренда до</span>
          <input
            type="time"
            className="field"
            value={draft.dayEnd}
            onChange={(e) => setDraft({ ...draft, dayEnd: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">
            Перерыв у занятия, мин
          </span>
          <NumberInput
            value={draft.bufferMin}
            onChange={(v) => setDraft({ ...draft, bufferMin: v })}
            min={0}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-text/80">Комментарий</span>
        <input
          className="field"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Зал на 7 человек, зеркала, коврики"
        />
      </label>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!draft.autoSchedule}
          onChange={(e) =>
            setDraft({ ...draft, autoSchedule: !e.target.checked })
          }
        />
        Не составлять расписание автоматически
      </label>

      {draft.autoSchedule ? (
        <p className="mt-1 text-xs text-text/50">
          Свободные часы этого зала сами уходят под аренду в дни, когда в нём
          есть занятия. Перерыв до и после занятия остаётся закрытым.
        </p>
      ) : (
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-text/80">
            Ссылка на запись (соцсеть)
          </span>
          <input
            className="field"
            value={draft.bookingUrl}
            onChange={(e) => setDraft({ ...draft, bookingUrl: e.target.value })}
            placeholder="https://t.me/studio"
          />
        </label>
      )}

      <p className="mt-3 text-xs text-text/55">
        Выгода месячного доступа:{" "}
        {benefit(draft.price4, 4).toLocaleString("ru-RU")} ₽ ·{" "}
        {benefit(draft.price8, 8).toLocaleString("ru-RU")} ₽ ·{" "}
        {benefit(draft.price12, 12).toLocaleString("ru-RU")} ₽
      </p>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await onSubmit({ ...draft, title: draft.title.trim() });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy || !draft.title.trim()}
          className="btn-gold disabled:opacity-40"
        >
          {busy ? "Сохраняем…" : submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-text/70">
            Отмена
          </button>
        )}
        {onDelete && (
          <button
            onClick={async () => {
              setError(null);
              try {
                await onDelete();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Не удалось удалить");
              }
            }}
            className="text-sm text-red-400"
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}

function RentCalendar({
  halls,
  slots,
  onChanged,
  onSync,
}: {
  halls: Hall[];
  slots: AdminRentalSlot[];
  onChanged: (message: string) => void;
  onSync: () => Promise<void>;
}) {
  const [hallId, setHallId] = useState(halls[0]?.id ?? 0);
  const [selected, setSelected] = useState<string>(() => toKey(new Date()));
  const [openId, setOpenId] = useState<number | null>(null);

  const hallSlots = useMemo(
    () => slots.filter((s) => s.hallId === hallId),
    [slots, hallId],
  );
  const byDay = useMemo(() => {
    const map = new Map<string, AdminRentalSlot[]>();
    for (const s of hallSlots) {
      const key = toKey(new Date(s.startsAt));
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    for (const list of map.values())
      list.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return map;
  }, [hallSlots]);

  const openSlot = hallSlots.find((s) => s.id === openId) ?? null;

  return (
    <div className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-sub text-heading">Часы аренды</p>
        <button
          onClick={onSync}
          className="text-sm text-text/80 underline underline-offset-4"
        >
          Пересобрать часы
        </button>
      </div>

      {halls.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          {halls.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setHallId(h.id);
                setOpenId(null);
              }}
              className={clsx(
                "rounded-xl border px-4 py-2 transition",
                h.id === hallId
                  ? "border-accent bg-accent/15 text-heading"
                  : "border-white/15 text-text/70 hover:bg-surface-2/50",
              )}
            >
              {h.title}
            </button>
          ))}
        </div>
      )}

      <WeekGrid
        firstDate={hallSlots[0]?.startsAt ?? null}
        selectedDay={selected}
        onSelectDay={setSelected}
        renderDay={(key) => {
          const daySlots = byDay.get(key) ?? [];
          if (!daySlots.length)
            return <p className="px-1 text-xs text-text/30">нет часов</p>;
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
                  {fmtTime(s.startsAt)} – {fmtTime(s.endsAt)}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-accent">
                {s.price > 0
                  ? `${s.price.toLocaleString("ru-RU")} ₽`
                  : "бесплатно"}
              </span>
              <span className="block text-xs text-text/60">
                {s.isBooked ? "забронировано" : "свободно"}
                {s.isActive ? "" : " · час закрыт"}
              </span>
            </button>
          ));
        }}
      />

      {openSlot && (
        <div className="mt-6 rounded-2xl border-gold bg-surface/50 p-5">
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
                {openSlot.hallTitle ? `${openSlot.hallTitle} · ` : ""}
                {openSlot.durationMin} мин ·{" "}
                {openSlot.price > 0
                  ? `${openSlot.price.toLocaleString("ru-RU")} ₽`
                  : "бесплатно"}
                {openSlot.isAuto
                  ? " · час создан автоматически"
                  : " · выставлен вручную"}
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
                onChanged(
                  openSlot.isActive
                    ? "Час снят с публикации"
                    : "Час опубликован",
                );
              }}
              className="text-sm text-text/80 underline underline-offset-4"
            >
              {openSlot.isActive ? "Снять с публикации" : "Опубликовать"}
            </button>
            <button
              onClick={async () => {
                if (
                  !confirm(
                    openSlot.isAuto
                      ? "Закрыть этот час? Автоматика его больше не предложит."
                      : "Удалить час? Время снова уйдёт под автоматическую аренду.",
                  )
                )
                  return;
                const res = await deleteRentSlot(openSlot.id);
                setOpenId(null);
                onChanged(res.closed ? "Час закрыт" : "Час удалён");
              }}
              className="text-sm text-red-400"
            >
              {openSlot.isAuto ? "Закрыть час" : "Удалить час"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
