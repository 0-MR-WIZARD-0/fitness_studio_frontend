"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminHalls,
  adminRentSlots,
  adminServices,
  createHall,
  createService,
  deleteHall,
  deleteRentSlot,
  deleteService,
  syncRentSlots,
  updateHall,
  updateRentSlot,
  updateService,
  updateSettings,
  type AdminRentalSlot,
} from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";
import {
  getSettings,
  type Hall,
  type Service,
  type SiteSettings,
} from "@/lib/api";
import { WeekGrid } from "@/components/booking/WeekGrid";
import { toKey } from "@/components/Calendar";
import { clsx } from "@/lib/clsx";
import { NumberInput } from "@/components/admin/NumberInput";

type Scope = "main" | "extra";
type Kind = "timed" | "plain";

export default function AdminServices() {
  const [slots, setSlots] = useState<AdminRentalSlot[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [rules, setRules] = useState<SiteSettings | null>(null);
  const [savingRules, setSavingRules] = useState(false);
  const [selected, setSelected] = useState<string>(() => toKey(new Date()));
  const [openId, setOpenId] = useState<number | null>(null);
  const [scope, setScope] = useState<Scope>("main");
  const [kind, setKind] = useState<Kind>("timed");
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminRentSlots().then(setSlots);
  const reloadHalls = () => adminHalls().then(setHalls);
  const reloadServices = () => adminServices().then(setServices);
  useEffect(() => {
    reload();
    reloadHalls();
    reloadServices();
    getSettings().then(setRules);
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const mainHall = halls.find((h) => h.isMain) ?? null;
  const extraHalls = halls.filter((h) => !h.isMain);
  const timedServices = services.filter((s) => !!s.durationMin);
  const plainServices = services.filter((s) => !s.durationMin);

  const scopeSlots = useMemo(() => {
    if (scope === "main")
      return slots.filter((s) =>
        mainHall ? s.hallId === mainHall.id : s.hallId === null,
      );
    const ids = new Set(extraHalls.map((h) => h.id));
    return slots.filter((s) => s.hallId !== null && ids.has(s.hallId));
  }, [slots, scope, mainHall, extraHalls]);

  const byDay = useMemo(() => {
    const map = new Map<string, AdminRentalSlot[]>();
    for (const s of scopeSlots) {
      const key = toKey(new Date(s.startsAt));
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    for (const list of map.values())
      list.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return map;
  }, [scopeSlots]);

  const openSlot = scopeSlots.find((s) => s.id === openId) ?? null;

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const hallsChanged = (m: string) => {
    reloadHalls();
    reload();
    flash(m);
  };

  return (
    <div className="max-w-6xl">
      <PageTitle>Дополнительные услуги</PageTitle>

      <Tabs
        value={scope}
        onChange={(v) => {
          setScope(v);
          setOpenId(null);
        }}
        items={[
          ["main", "Основной зал"],
          ["extra", "Доп. залы"],
        ]}
      />

      {scope === "main" && (
        <Tabs
          value={kind}
          onChange={setKind}
          items={[
            ["timed", "С расписанием"],
            ["plain", "Без расписания"],
          ]}
          className="mb-8 mt-3"
          small
        />
      )}

      {scope === "main" && kind === "timed" && (
        <>
          <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
            <p className="mb-1 font-sub text-heading">Автоматическая аренда</p>
            <p className="mb-4 text-xs text-text/50">
              Как только в дне появляется занятие, свободные часы этого дня сами
              становятся слотами аренды по часу — по цене разового посещения.
              Перерыв до и после занятия остаётся закрытым, перенос или отмена
              занятия возвращают часы в аренду.
            </p>

            {mainHall ? (
              <MainHallForm
                hall={mainHall}
                onChanged={hallsChanged}
                onSync={async () => {
                  const res = await syncRentSlots();
                  reload();
                  flash(
                    `Слоты обновлены: добавлено ${res.created}, убрано ${res.removed}`,
                  );
                }}
              />
            ) : (
              rules && (
                <>
                  <p className="mb-4 text-sm text-text/70">
                    Основного зала нет — аренда собирается на всю студию.
                    Заведите зал на вкладке «Доп. залы», первый станет основным.
                  </p>
                  <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">
                      <span className="mb-1 block h-5 text-text/80">
                        Аренда с
                      </span>
                      <input
                        type="time"
                        className="field"
                        value={rules.rentDayStart}
                        onChange={(e) =>
                          setRules({ ...rules, rentDayStart: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block h-5 text-text/80">
                        Аренда до
                      </span>
                      <input
                        type="time"
                        className="field"
                        value={rules.rentDayEnd}
                        onChange={(e) =>
                          setRules({ ...rules, rentDayEnd: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block h-5 text-text/80">
                        Цена часа, ₽
                      </span>
                      <NumberInput
              value={rules.rentPricePerHour}
              onChange={(v) => setRules({
                            ...rules,
                            rentPricePerHour: Math.max(
                              0,
                              v,
                            ),
                          })}
              min={0}
            />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block h-5 text-text/80">
                        Перерыв у занятия, мин
                      </span>
                      <NumberInput
              value={rules.rentBufferMin}
              onChange={(v) => setRules({
                            ...rules,
                            rentBufferMin: v,
                          })}
              min={0}
            />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <button
                      onClick={async () => {
                        setSavingRules(true);
                        try {
                          const saved = await updateSettings({
                            rentDayStart: rules.rentDayStart,
                            rentDayEnd: rules.rentDayEnd,
                            rentPricePerHour: rules.rentPricePerHour,
                            rentBufferMin: rules.rentBufferMin,
                          });
                          setRules(saved);
                          reload();
                          flash("Правила сохранены, слоты пересобраны");
                        } finally {
                          setSavingRules(false);
                        }
                      }}
                      disabled={savingRules}
                      className="btn-gold disabled:opacity-40"
                    >
                      {savingRules ? "Сохраняем…" : "Сохранить правила"}
                    </button>
                  </div>
                </>
              )
            )}
          </div>

          {timedServices.length > 0 && (
            <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
              <p className="mb-1 font-sub text-heading">Услуги с расписанием</p>
              <p className="mb-4 text-xs text-text/50">
                Название, цена, длительность и комментарий.
              </p>
              <div className="space-y-3">
                {timedServices.map((s) => (
                  <ServiceRow
                    key={s.id}
                    service={s}
                    withDuration
                    onChanged={(m) => {
                      reloadServices();
                      reload();
                      flash(m);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {scope === "extra" && (
        <ExtraHallsBlock
          halls={extraHalls}
          total={halls.length}
          onChanged={hallsChanged}
        />
      )}

      {scope === "main" && kind === "plain" && (
        <PlainServicesBlock
          services={plainServices}
          nextOrder={services.length + 1}
          onChanged={(m) => {
            reloadServices();
            flash(m);
          }}
        />
      )}

      {scope === "main" && kind === "timed" && (
        <>
          <p className="mb-3 font-sub text-heading">
            Расписание основного зала
          </p>
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
                      {fmtTime(s.startsAt)} – {fmtTime(s.endsAt)}
                    </span>
                  </span>
                  <span className="block text-xs text-text/70">
                    {s.hallTitle ? `${s.hallTitle} · ` : ""}
                    {s.serviceTitle}
                  </span>
                  <span className="mt-0.5 block text-xs text-accent">
                    {s.price > 0
                      ? `${s.price.toLocaleString("ru-RU")} ₽`
                      : "бесплатно"}
                  </span>
                  <span className="block text-xs text-text/60">
                    {s.isBooked ? "забронировано" : "свободно"}
                    {s.isAuto ? " · авто" : " · вручную"}
                    {s.isActive ? "" : " · снято с публикации"}
                  </span>
                </button>
              ));
            }}
          />
        </>
      )}

      {openSlot && scope === "main" && kind === "timed" && (
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
                {openSlot.hallTitle ? `${openSlot.hallTitle} · ` : ""}
                {openSlot.durationMin} мин ·{" "}
                {openSlot.price > 0
                  ? `${openSlot.price.toLocaleString("ru-RU")} ₽`
                  : "бесплатно"}
                {openSlot.isAuto
                  ? " · создан автоматически"
                  : " · выставлен вручную"}
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
                if (
                  !confirm(
                    openSlot.isAuto
                      ? "Закрыть этот час? Автоматическая аренда его больше не предложит."
                      : "Удалить слот? Час снова уйдёт под автоматическую аренду.",
                  )
                )
                  return;
                const res = await deleteRentSlot(openSlot.id);
                setOpenId(null);
                reload();
                flash(res.closed ? "Час закрыт" : "Слот удалён");
              }}
              className="text-sm text-red-400"
            >
              {openSlot.isAuto ? "Закрыть час" : "Удалить слот"}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
  small,
}: {
  value: T;
  onChange: (value: T) => void;
  items: [T, string][];
  className?: string;
  small?: boolean;
}) {
  return (
    <div className={clsx("flex flex-wrap gap-2 text-sm", className ?? "mb-3")}>
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={clsx(
            "rounded-xl border transition",
            small ? "px-3 py-1.5 text-xs" : "px-4 py-2",
            value === key
              ? "border-accent bg-accent/15 text-heading"
              : "border-white/15 text-text/70 hover:bg-surface-2/50",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function MainHallForm({
  hall,
  onChanged,
  onSync,
}: {
  hall: Hall;
  onChanged: (message: string) => void;
  onSync: () => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    title: hall.title,
    description: hall.description,
    priceSingle: hall.priceSingle,
    price4: hall.price4,
    price8: hall.price8,
    price12: hall.price12,
    bookingUrl: hall.bookingUrl,
    dayStart: hall.dayStart,
    dayEnd: hall.dayEnd,
    bufferMin: hall.bufferMin,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = (
    Object.keys(draft) as (keyof typeof draft)[]
  ).some((key) => draft[key] !== hall[key]);

  const num = (key: "priceSingle" | "price4" | "price8" | "price12" | "bufferMin") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft({ ...draft, [key]: Math.max(0, Number(e.target.value)) });

  const benefit = (price: number, hours: number) =>
    price > 0 ? Math.max(0, hall.priceSingle - price) * hours : 0;

  return (
    <>
      <div className="grid items-start gap-4 md:grid-cols-3 lg:grid-cols-6">
        <label className="text-sm lg:col-span-2">
          <span className="mb-1 block h-9 text-text/80">Название зала</span>
          <input
            className="field"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
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
            <input
              type="number"
              inputMode="numeric"
              className="field"
              min={0}
              value={draft[key]}
              onChange={num(key)}
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Аренда с</span>
          <input
            type="time"
            className="field"
            value={draft.dayStart}
            onChange={(e) => setDraft({ ...draft, dayStart: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Аренда до</span>
          <input
            type="time"
            className="field"
            value={draft.dayEnd}
            onChange={(e) => setDraft({ ...draft, dayEnd: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">
            Перерыв у занятия, мин
          </span>
          <input
            type="number"
            inputMode="numeric"
            className="field"
            min={0}
            value={draft.bufferMin}
            onChange={num("bufferMin")}
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

      <p className="mt-3 text-xs text-text/55">
        Выгода месячного доступа: {benefit(hall.price4, 4).toLocaleString("ru-RU")}{" "}
        ₽ · {benefit(hall.price8, 8).toLocaleString("ru-RU")} ₽ ·{" "}
        {benefit(hall.price12, 12).toLocaleString("ru-RU")} ₽
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await updateHall(hall.id, {
                ...draft,
                title: draft.title.trim(),
                order: hall.order,
                isMain: true,
                isActive: hall.isActive,
              });
              onChanged("Зал сохранён, слоты пересобраны");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy || !changed || !draft.title.trim()}
          className="btn-gold disabled:opacity-40"
        >
          {busy ? "Сохраняем…" : "Сохранить правила"}
        </button>
        <button
          onClick={onSync}
          className="text-sm text-text/80 underline underline-offset-4"
        >
          Пересобрать слоты
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </>
  );
}

function ExtraHallsBlock({
  halls,
  total,
  onChanged,
}: {
  halls: Hall[];
  total: number;
  onChanged: (message: string) => void;
}) {
  const empty = {
    title: "",
    description: "",
    priceSingle: 0,
    price4: 0,
    price8: 0,
    price12: 0,
    bookingUrl: "",
    dayStart: "09:00",
    dayEnd: "17:30",
    bufferMin: 30,
  };
  const [draft, setDraft] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
      <p className="mb-1 font-sub text-heading">Залы студии</p>
      <p className="mb-4 text-xs text-text/50">
        Залы независимы: бронь одного не занимает время другого. Расписание и
        автоматические слоты есть только у основного зала, дополнительные
        бронируются по ссылке в соцсети.
      </p>

      <div className="grid items-start gap-4 md:grid-cols-3 lg:grid-cols-6">
        <label className="text-sm lg:col-span-2">
          <span className="mb-1 block h-9 text-text/80">Название зала</span>
          <input
            className="field"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Малый зал Латте"
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
              onChange={(v) => setDraft({
                  ...draft,
                  [key]: v,
                })}
              min={0}
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Аренда с</span>
          <input
            type="time"
            className="field"
            value={draft.dayStart}
            onChange={(e) => setDraft({ ...draft, dayStart: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Аренда до</span>
          <input
            type="time"
            className="field"
            value={draft.dayEnd}
            onChange={(e) => setDraft({ ...draft, dayEnd: e.target.value })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">
            Перерыв у занятия, мин
          </span>
          <NumberInput
              value={draft.bufferMin}
              onChange={(v) => setDraft({
                ...draft,
                bufferMin: v,
              })}
              min={0}
            />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Комментарий</span>
          <input
            className="field"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="Зал на 7 человек, зеркала, коврики"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">
            Ссылка на бронирование (соцсеть)
          </span>
          <input
            className="field"
            value={draft.bookingUrl}
            onChange={(e) => setDraft({ ...draft, bookingUrl: e.target.value })}
            placeholder="https://t.me/studio"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={async () => {
            setError(null);
            try {
              await createHall({
                ...draft,
                title: draft.title.trim(),
                order: total + 1,
                isActive: true,
              });
              setDraft(empty);
              onChanged("Зал добавлен");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
          disabled={!draft.title.trim()}
          className="btn-gold disabled:opacity-40"
        >
          Добавить зал
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {halls.length > 0 ? (
        <div className="mt-5 space-y-3">
          {halls.map((h) => (
            <HallRow key={h.id} hall={h} onChanged={onChanged} />
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-text/60">
          Дополнительных залов пока нет.
        </p>
      )}
    </div>
  );
}

function HallRow({
  hall,
  onChanged,
}: {
  hall: Hall;
  onChanged: (message: string) => void;
}) {
  const [draft, setDraft] = useState({
    title: hall.title,
    description: hall.description,
    priceSingle: hall.priceSingle,
    price4: hall.price4,
    price8: hall.price8,
    price12: hall.price12,
    bookingUrl: hall.bookingUrl,
    dayStart: hall.dayStart,
    dayEnd: hall.dayEnd,
    bufferMin: hall.bufferMin,
  });
  const [busy, setBusy] = useState(false);

  const changed = (Object.keys(draft) as (keyof typeof draft)[]).some(
    (key) => draft[key] !== hall[key],
  );

  const save = async (patch?: { isActive?: boolean; isMain?: boolean }) => {
    setBusy(true);
    try {
      await updateHall(hall.id, {
        ...draft,
        title: draft.title.trim(),
        order: hall.order,
        isMain: patch?.isMain ?? hall.isMain,
        isActive: patch?.isActive ?? hall.isActive,
      });
      onChanged(
        patch?.isMain
          ? "Основной зал изменён, слоты пересобраны"
          : "Зал сохранён",
      );
    } finally {
      setBusy(false);
    }
  };

  const benefit = (price: number, hours: number) =>
    price > 0 ? Math.max(0, hall.priceSingle - price) * hours : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
      <div className="grid items-start gap-3 md:grid-cols-3 lg:grid-cols-6">
        <input
          className="field lg:col-span-2"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        {(["priceSingle", "price4", "price8", "price12"] as const).map(
          (key) => (
            <input
              key={key}
              type="number"
              inputMode="numeric"
              className="field"
              min={0}
              value={draft[key]}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  [key]: Math.max(0, Number(e.target.value)),
                })
              }
            />
          ),
        )}
      </div>

      <div className="mt-3 grid items-start gap-3 md:grid-cols-3">
        <label className="text-xs text-text/60">
          Аренда с
          <input
            type="time"
            className="field mt-1"
            value={draft.dayStart}
            onChange={(e) => setDraft({ ...draft, dayStart: e.target.value })}
          />
        </label>
        <label className="text-xs text-text/60">
          Аренда до
          <input
            type="time"
            className="field mt-1"
            value={draft.dayEnd}
            onChange={(e) => setDraft({ ...draft, dayEnd: e.target.value })}
          />
        </label>
        <label className="text-xs text-text/60">
          Перерыв, мин
          <NumberInput
              value={draft.bufferMin}
              onChange={(v) => setDraft({
                ...draft,
                bufferMin: v,
              })}
              min={0}
              className="mt-1"
            />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input
          className="field"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Комментарий"
        />
        <input
          className="field"
          value={draft.bookingUrl}
          onChange={(e) => setDraft({ ...draft, bookingUrl: e.target.value })}
          placeholder="Ссылка на бронирование"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="text-text/60">
          выгода: {benefit(hall.price4, 4).toLocaleString("ru-RU")} ₽ ·{" "}
          {benefit(hall.price8, 8).toLocaleString("ru-RU")} ₽ ·{" "}
          {benefit(hall.price12, 12).toLocaleString("ru-RU")} ₽
        </span>
        <button
          onClick={() => save()}
          disabled={!changed || busy || !draft.title.trim()}
          className="text-text/80 underline underline-offset-4 disabled:opacity-40"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (
              !confirm(
                `Удалить зал «${hall.title}»? Его слоты аренды тоже удалятся.`,
              )
            )
              return;
            await deleteHall(hall.id);
            onChanged("Зал удалён");
          }}
          className="text-red-400"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

function PlainServicesBlock({
  services,
  nextOrder,
  onChanged,
}: {
  services: Service[];
  nextOrder: number;
  onChanged: (message: string) => void;
}) {
  const empty = { title: "", description: "", price: 0 };
  const [draft, setDraft] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
      <p className="mb-1 font-sub text-heading">Услуги без расписания</p>
      <p className="mb-4 text-xs text-text/50">
        Время у таких услуг не задаётся. На сайте они показываются отдельным
        блоком над расписанием — клиент оставляет заявку, студия связывается
        сама.
      </p>

      <div className="grid items-start gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Название</span>
          <input
            className="field"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Планирование питания"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Цена, ₽</span>
          <NumberInput
              value={draft.price}
              onChange={(v) => setDraft({ ...draft, price: v })}
              min={0}
            />
        </label>
        <label className="text-sm">
          <span className="mb-1 block h-5 text-text/80">Комментарий</span>
          <input
            className="field"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="Что входит в услугу"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={async () => {
            setError(null);
            try {
              await createService({
                title: draft.title.trim(),
                description: draft.description,
                price: draft.price,
                durationMin: null,
                order: nextOrder,
                isActive: true,
              });
              setDraft(empty);
              onChanged("Услуга добавлена");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
          disabled={!draft.title.trim()}
          className="btn-gold disabled:opacity-40"
        >
          Добавить услугу
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {services.length > 0 ? (
        <div className="mt-5 space-y-3">
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} onChanged={onChanged} />
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-text/60">
          Услуг без расписания пока нет.
        </p>
      )}
    </div>
  );
}

function ServiceRow({
  service,
  withDuration,
  onChanged,
}: {
  service: Service;
  withDuration?: boolean;
  onChanged: (message: string) => void;
}) {
  const [draft, setDraft] = useState({
    title: service.title,
    description: service.description,
    price: service.price,
    durationMin: service.durationMin ?? 0,
  });
  const [busy, setBusy] = useState(false);

  const changed =
    draft.title !== service.title ||
    draft.description !== service.description ||
    draft.price !== service.price ||
    draft.durationMin !== (service.durationMin ?? 0);

  const save = async (patch?: { isActive?: boolean }) => {
    setBusy(true);
    try {
      await updateService(service.id, {
        title: draft.title.trim(),
        description: draft.description,
        price: draft.price,
        durationMin: withDuration ? draft.durationMin || 60 : null,
        order: service.order,
        isActive: patch?.isActive ?? service.isActive,
      });
      onChanged("Услуга сохранена");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
      <div
        className={clsx(
          "grid items-start gap-3",
          withDuration ? "md:grid-cols-4" : "md:grid-cols-3",
        )}
      >
        <input
          className="field"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <NumberInput
              value={draft.price}
              onChange={(v) => setDraft({ ...draft, price: v })}
              min={0}
            />
        {withDuration && (
          <NumberInput
              value={draft.durationMin}
              onChange={(v) => setDraft({
                ...draft,
                durationMin: v,
              })}
              min={15}
              step={15}
            />
        )}
        <input
          className="field"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="text-text/60">
          {withDuration
            ? `с расписанием · ${draft.durationMin} мин`
            : "без расписания · заявкой"}
        </span>
        <label className="flex items-center gap-2 text-text/80">
          <input
            type="checkbox"
            checked={service.isActive}
            onChange={(e) => save({ isActive: e.target.checked })}
          />
          Показывать на сайте
        </label>
        <button
          onClick={() => save()}
          disabled={busy || !changed || !draft.title.trim()}
          className="text-text/80 underline underline-offset-4 disabled:opacity-40"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm(`Удалить услугу «${service.title}»?`)) return;
            await deleteService(service.id);
            onChanged("Услуга удалена");
          }}
          className="text-red-400"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
