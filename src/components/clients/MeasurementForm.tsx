"use client";

import { useState } from "react";
import { Labeled, SelectField, TextArea } from "@/components/admin/ui";
import { onlyDigits } from "@/lib/number-input";
import type {
  Measurement,
  MeasurementDraft,
  NumericKey,
  Protocol,
} from "@/lib/clients";

const INTEGER_KEYS = new Set(["metabolicAge", "bmr"]);

const GRADES = [
  { value: "", label: "Оценка не выставлена" },
  { value: "yes", label: "В норме" },
  { value: "no", label: "Ниже нормы" },
];

const isoDay = (iso: string | null | undefined) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

const asText = (value: number | null | undefined) =>
  value == null ? "" : String(value);

const asNumber = (text: string): number | null | "bad" => {
  const clean = text.trim();
  if (!clean || clean === ".") return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : "bad";
};

function NumField({
  label,
  unit,
  hint,
  value,
  integer,
  onChange,
}: {
  label: string;
  unit?: string;
  hint?: string;
  value: string;
  integer?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <Labeled label={unit ? `${label}, ${unit}` : label}>
      <input
        className="field"
        inputMode={integer ? "numeric" : "decimal"}
        value={value}
        placeholder="—"
        onChange={(e) => onChange(onlyDigits(e.target.value, integer))}
      />
      {hint && <span className="mt-1 block text-xs text-text/45">{hint}</span>}
    </Labeled>
  );
}

export function MeasurementForm({
  protocol,
  initial,
  onSave,
  onCancel,
}: {
  protocol: Protocol;
  initial: Measurement | null;
  onSave: (draft: MeasurementDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const [numbers, setNumbers] = useState<Record<string, string>>(() => {
    const start: Record<string, string> = {};
    for (const f of [...protocol.girths, ...protocol.bio])
      start[f.key] = asText(initial?.[f.key]);
    return start;
  });
  const [tests, setTests] = useState<Record<number, string>>(() => {
    const start: Record<number, string> = {};
    for (const t of protocol.tests)
      start[t.id] = initial?.tests.find((r) => r.testId === t.id)?.value ?? "";
    return start;
  });
  const [passed, setPassed] = useState<Record<number, string>>(() => {
    const start: Record<number, string> = {};
    for (const t of protocol.tests) {
      const found = initial?.tests.find((r) => r.testId === t.id);
      start[t.id] = found?.passed == null ? "" : found.passed ? "yes" : "no";
    }
    return start;
  });

  const [takenAt, setTakenAt] = useState(
    isoDay(initial?.takenAt ?? new Date().toISOString()),
  );
  const [nextCheckAt, setNextCheckAt] = useState(isoDay(initial?.nextCheckAt));
  const [strengths, setStrengths] = useState(initial?.strengths ?? "");
  const [risks, setRisks] = useState(initial?.risks ?? "");
  const [trainingAdvice, setTraining] = useState(initial?.trainingAdvice ?? "");
  const [nutritionAdvice, setNutrition] = useState(
    initial?.nutritionAdvice ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: string, v: string) =>
    setNumbers((prev) => ({ ...prev, [key]: v }));

  async function submit() {
    setError(null);
    const draft: MeasurementDraft = {
      takenAt: takenAt ? new Date(takenAt).toISOString() : undefined,
      nextCheckAt: nextCheckAt ? new Date(nextCheckAt).toISOString() : null,
      strengths,
      risks,
      trainingAdvice,
      nutritionAdvice,
      tests: protocol.tests.map((t) => ({
        testId: t.id,
        value: tests[t.id] ?? "",
        passed:
          passed[t.id] === "yes" ? true : passed[t.id] === "no" ? false : null,
      })),
    };

    for (const f of [...protocol.girths, ...protocol.bio]) {
      const parsed = asNumber(numbers[f.key] ?? "");
      if (parsed === "bad") {
        setError(`${f.label}: введите число`);
        return;
      }
      (draft as Record<string, unknown>)[f.key as NumericKey] = parsed;
    }

    setSaving(true);
    try {
      await onSave(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border-gold bg-surface/40 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Labeled label="Дата замера">
          <input
            className="field"
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
          />
        </Labeled>
        <Labeled label="Повторная диагностика">
          <input
            className="field"
            type="date"
            value={nextCheckAt}
            onChange={(e) => setNextCheckAt(e.target.value)}
          />
        </Labeled>
      </div>

      <div>
        <p className="mb-2 font-sub text-sm uppercase tracking-wider text-text/60">
          Антропометрия, см
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {protocol.girths.map((f) => (
            <NumField
              key={f.key}
              label={f.label}
              hint={f.howTo}
              value={numbers[f.key] ?? ""}
              onChange={(v) => set(f.key, v)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-sub text-sm uppercase tracking-wider text-text/60">
          Биоимпеданс
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {protocol.bio.map((f) => (
            <NumField
              key={f.key}
              label={f.label}
              unit={f.label.includes("%") ? undefined : f.unit || undefined}
              hint={f.norm === "Индивидуально" ? undefined : `Норма: ${f.norm}`}
              value={numbers[f.key] ?? ""}
              integer={INTEGER_KEYS.has(f.key)}
              onChange={(v) => set(f.key, v)}
            />
          ))}
        </div>
      </div>

      {protocol.tests.length > 0 && (
        <div>
          <p className="mb-2 font-sub text-sm uppercase tracking-wider text-text/60">
            Функциональные тесты
          </p>
          <div className="space-y-3">
            {protocol.tests.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-white/10 bg-bg/40 p-3"
              >
                <p className="text-sm text-heading">{t.name}</p>
                <p className="text-xs text-text/45">
                  {t.howTo}
                  {t.norm && ` · норма: ${t.norm}`}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    className="field"
                    inputMode={t.unit ? "decimal" : "text"}
                    value={tests[t.id] ?? ""}
                    placeholder={t.unit ? `Результат, ${t.unit}` : "Результат"}
                    onChange={(e) =>
                      setTests((prev) => ({
                        ...prev,
                        [t.id]: t.unit
                          ? onlyDigits(e.target.value)
                          : e.target.value,
                      }))
                    }
                  />
                  <SelectField
                    value={passed[t.id] ?? ""}
                    options={GRADES}
                    onChange={(v) =>
                      setPassed((prev) => ({ ...prev, [t.id]: v }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <TextArea
          label="Сильные стороны"
          rows={2}
          value={strengths}
          onChange={setStrengths}
        />
        <TextArea
          label="Зоны риска"
          rows={2}
          value={risks}
          onChange={setRisks}
        />
        <TextArea
          label="Рекомендации по тренировкам"
          rows={2}
          value={trainingAdvice}
          onChange={setTraining}
        />
        <TextArea
          label="Рекомендации по питанию"
          rows={2}
          value={nutritionAdvice}
          onChange={setNutrition}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={submit}
          disabled={saving}
          className="btn-gold disabled:opacity-40"
        >
          {saving ? "Сохраняем…" : "Сохранить замер"}
        </button>
        <button onClick={onCancel} className="text-sm text-text/70">
          Отмена
        </button>
      </div>
    </div>
  );
}
