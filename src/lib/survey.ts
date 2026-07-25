import type { Condition, Format, RiskLevel } from "./api";

export const RISK_META: Record<
  RiskLevel,
  { label: string; short: string; dot: string; badge: string; weight: number }
> = {
  ALLOWED: {
    label: "Можно",
    short: "можно",
    dot: "bg-emerald-400",
    badge: "border-emerald-400/60 text-emerald-300",
    weight: 0,
  },
  CAUTION: {
    label: "С осторожностью",
    short: "с осторожностью",
    dot: "bg-amber-400",
    badge: "border-amber-400/60 text-amber-300",
    weight: 1,
  },
  FORBIDDEN: {
    label: "Не рекомендуем",
    short: "не рекомендуем",
    dot: "bg-red-400",
    badge: "border-red-400/60 text-red-300",
    weight: 2,
  },
};

export const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "ALLOWED", label: "🟢 Можно" },
  { value: "CAUTION", label: "🟡 С осторожностью" },
  { value: "FORBIDDEN", label: "🔴 Нельзя" },
];

export interface VerdictNote {
  condition: string;
  risk: RiskLevel;
  note: string;
}

export interface FormatVerdict {
  format: Format;
  risk: RiskLevel;
  notes: VerdictNote[];
}

export function evaluateSurvey(
  formats: Format[],
  conditions: Condition[],
  selectedIds: number[],
): FormatVerdict[] {
  const selected = conditions.filter((c) => selectedIds.includes(c.id));

  return formats
    .map((format) => {
      const notes: VerdictNote[] = [];
      let risk: RiskLevel = "ALLOWED";

      for (const condition of selected) {
        const rule = condition.rules.find((r) => r.formatId === format.id);
        if (!rule) continue;
        if (RISK_META[rule.risk].weight > RISK_META[risk].weight) {
          risk = rule.risk;
        }
        if (rule.risk !== "ALLOWED" || rule.note) {
          notes.push({
            condition: condition.name,
            risk: rule.risk,
            note: rule.note,
          });
        }
      }

      notes.sort(
        (a, b) => RISK_META[b.risk].weight - RISK_META[a.risk].weight,
      );
      return { format, risk, notes };
    })
    .sort(
      (a, b) =>
        RISK_META[a.risk].weight - RISK_META[b.risk].weight ||
        a.format.order - b.format.order,
    );
}

export function summaryText(
  verdicts: FormatVerdict[],
  selectedCount: number,
): string[] {
  if (!verdicts.length) return [];
  const names = (risk: RiskLevel) =>
    verdicts.filter((v) => v.risk === risk).map((v) => v.format.name);

  if (selectedCount === 0) {
    return [
      "Вы не отметили ни одного состояния — по этим данным ограничений нет, вам подойдёт любой из наших форматов.",
      "Начать удобнее всего с бесплатной диагностики: тренер уточнит детали и поможет выбрать нагрузку.",
    ];
  }

  const allowed = names("ALLOWED");
  const caution = names("CAUTION");
  const forbidden = names("FORBIDDEN");
  const out: string[] = [];

  if (allowed.length) {
    out.push(
      `Вам подходит: ${allowed.join(", ")}. По отмеченным состояниям ограничений нет.`,
    );
  }
  if (caution.length) {
    out.push(
      `С осторожностью: ${caution.join(
        ", ",
      )}. Заниматься можно по адаптированной программе — обязательно расскажите тренеру о своём состоянии до первой тренировки.`,
    );
  }
  if (forbidden.length) {
    out.push(
      `Не рекомендуем: ${forbidden.join(
        ", ",
      )}. По отмеченным состояниям такая нагрузка может навредить.`,
    );
  }
  if (!allowed.length && !caution.length) {
    out.push(
      "По вашим ответам мы не можем предложить формат без консультации. Свяжитесь с нами — подберём решение индивидуально.",
    );
  }
  out.push(
    "Это предварительная подсказка, а не медицинская рекомендация. При хронических заболеваниях сначала посоветуйтесь с лечащим врачом.",
  );
  return out;
}
