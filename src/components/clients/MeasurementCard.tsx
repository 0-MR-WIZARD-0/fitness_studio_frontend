"use client";

import { clsx } from "@/lib/clsx";
import { plural } from "@/lib/plural";
import {
  ZONE_CLASS,
  type ClientCard,
  type Measurement,
  type NumericKey,
  type Protocol,
  type Zone,
} from "@/lib/clients";

const num = (value: number | null | undefined, digits = 1) =>
  value == null
    ? "—"
    : value.toLocaleString("ru-RU", { maximumFractionDigits: digits });

export const dayOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU") : "—";

export function ZoneBadge({ zone }: { zone: Zone | null }) {
  if (!zone) return null;
  return (
    <span
      className={clsx(
        "inline-block rounded-lg border px-2 py-0.5 text-xs whitespace-nowrap",
        ZONE_CLASS[zone.level],
      )}
    >
      {zone.label}
    </span>
  );
}

function Delta({ value, unit }: { value?: number; unit: string }) {
  if (value == null || value === 0) return null;
  const sign = value > 0 ? "+" : "−";
  return (
    <span className="text-xs text-text/50 whitespace-nowrap">
      {sign}
      {num(Math.abs(value))} {unit}
    </span>
  );
}

function Row({
  label,
  hint,
  norm,
  value,
  unit,
  delta,
  zone,
}: {
  label: string;
  hint?: string;
  norm?: string;
  value: string;
  unit?: string;
  delta?: number;
  zone?: Zone | null;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-2 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm text-heading">{label}</p>
        {hint && <p className="text-xs text-text/50">{hint}</p>}
        {norm && <p className="text-xs text-text/40">Норма: {norm}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        <span className="font-sub text-heading">
          {value}
          {unit && value !== "—" ? ` ${unit}` : ""}
        </span>
        <Delta value={delta} unit={unit ?? ""} />
        {zone !== undefined && <ZoneBadge zone={zone ?? null} />}
      </div>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border-gold bg-surface/40 p-4">
      <h3 className="mb-2 font-sub text-sm uppercase tracking-wider text-text/60">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Notes({ m }: { m: Measurement }) {
  const items: [string, string][] = [
    ["Сильные стороны", m.strengths],
    ["Зоны риска", m.risks],
    ["Рекомендации по тренировкам", m.trainingAdvice],
    ["Рекомендации по питанию", m.nutritionAdvice],
  ];
  const filled = items.filter(([, text]) => text.trim());
  if (!filled.length && !m.nextCheckAt) return null;

  return (
    <Block title="Заметки тренера">
      <div className="space-y-3">
        {filled.map(([label, text]) => (
          <div key={label}>
            <p className="text-xs text-text/50">{label}</p>
            <p className="whitespace-pre-line text-sm text-heading">{text}</p>
          </div>
        ))}
        {m.nextCheckAt && (
          <p className="text-sm text-text/70">
            Повторная диагностика:{" "}
            <span className="text-heading">{dayOf(m.nextCheckAt)}</span>
          </p>
        )}
      </div>
    </Block>
  );
}

export function MeasurementCard({
  protocol,
  card,
  m,
  actions,
}: {
  protocol: Protocol;
  card: ClientCard | null;
  m: Measurement;
  actions?: React.ReactNode;
}) {
  const d = m.derived;
  const testById = new Map(m.tests.map((t) => [t.testId, t]));
  const value = (key: NumericKey, digits = 1) => num(m[key], digits);

  const bioZone = (key: string): Zone | null | undefined => {
    if (key === "fatPct") return d.fat;
    if (key === "waterPct") return d.water;
    if (key === "visceralFat") return d.visceral;
    return undefined;
  };

  return (
    <article className="space-y-4 rounded-2xl border-gold bg-surface/20 p-4 sm:p-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-sub text-lg text-heading">{dayOf(m.takenAt)}</p>
          <p className="text-xs text-text/50">
            {m.author ? `внёс ${m.author}` : "автор не указан"}
            {m.editor && `, правил ${m.editor}`}
            {d.age != null && ` · возраст ${d.age}`}
            {m.prevAt && ` · прошлый замер ${dayOf(m.prevAt)}`}
          </p>
        </div>
        {actions}
      </header>

      <Block title="Антропометрия">
        {protocol.girths.map((f) => (
          <Row
            key={f.key}
            label={f.label}
            hint={f.howTo}
            norm={f.norm === "Индивидуально" ? undefined : f.norm}
            value={value(f.key)}
            unit="см"
            delta={m.delta[f.key]}
          />
        ))}
      </Block>

      <Block title="Соотношения">
        <Row
          label="Т/Б — талия ÷ бёдра"
          norm={
            card?.sex === "MALE"
              ? "< 0,95"
              : card?.sex === "FEMALE"
                ? "< 0,85"
                : "зависит от пола — укажите его в карточке"
          }
          value={d.whr ? num(d.whr.value, 2) : "—"}
          zone={d.whr?.zone ?? null}
        />
        <Row
          label="Т/Р — талия ÷ рост"
          norm="0,4–0,49"
          value={d.whtr ? num(d.whtr.value, 2) : "—"}
          zone={d.whtr?.zone ?? null}
        />
        <Row
          label="ИМТ"
          norm="18,5–24,9; избыток 25–29,9; ожирение 30+"
          value={d.bmi ? num(d.bmi.value) : "—"}
          zone={d.bmi?.zone ?? null}
        />
        {!card?.heightCm && (
          <p className="pt-2 text-xs text-amber-300/80">
            Т/Р и ИМТ не считаются: в карточке не указан рост.
          </p>
        )}
      </Block>

      <Block title="Биоимпедансный анализ">
        {protocol.bio.map((f) => (
          <Row
            key={f.key}
            label={f.label}
            norm={f.norm === "Индивидуально" ? undefined : f.norm}
            value={value(f.key, f.key === "bmr" ? 0 : 1)}
            unit={
              f.key === "metabolicAge" && m.metabolicAge != null
                ? plural(m.metabolicAge, ["год", "года", "лет"])
                : f.unit
            }
            delta={m.delta[f.key]}
            zone={bioZone(f.key)}
          />
        ))}
      </Block>

      <Block title="Идеальный вес">
        <Row
          label="Брока"
          hint="Рост − 100 с поправкой на тип телосложения"
          value={num(d.ideal.broca)}
          unit="кг"
        />
        <Row
          label="Лоренца"
          hint="(Рост − 100) − (Рост − 150) ÷ 2 (Ж) или ÷ 4 (М)"
          value={num(d.ideal.lorentz)}
          unit="кг"
        />
        <Row
          label="ИМТ-ориентир"
          hint="22 × рост в метрах²"
          value={num(d.ideal.bmiRef)}
          unit="кг"
        />
        <Row label="Среднее из трёх" value={num(d.ideal.average)} unit="кг" />
        {m.weightKg != null && d.ideal.average != null && (
          <p className="pt-2 text-sm text-text/70">
            Разница с текущим весом:{" "}
            <span className="text-heading">
              {m.weightKg > d.ideal.average ? "+" : "−"}
              {num(Math.abs(m.weightKg - d.ideal.average))} кг
            </span>
          </p>
        )}
      </Block>

      {protocol.tests.length > 0 && (
        <Block title="Функциональные тесты">
          {protocol.tests.map((t) => {
            const result = testById.get(t.id);
            return (
              <Row
                key={t.id}
                label={t.name}
                hint={t.howTo}
                norm={t.norm}
                value={result?.value?.trim() || "—"}
                unit={result?.value?.trim() ? t.unit : ""}
                zone={
                  result?.passed == null
                    ? undefined
                    : result.passed
                      ? { level: "norm", label: "Норма" }
                      : { level: "warn", label: "Ниже нормы" }
                }
              />
            );
          })}
        </Block>
      )}

      <Notes m={m} />
    </article>
  );
}
