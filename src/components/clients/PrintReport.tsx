"use client";

import type { SiteSettings } from "@/lib/api";
import { plural } from "@/lib/plural";
import {
  SEX_LABEL,
  type ClientCard,
  type Measurement,
  type NumericKey,
  type Protocol,
} from "@/lib/clients";

const num = (value: number | null | undefined, digits = 1) =>
  value == null
    ? "—"
    : value.toLocaleString("ru-RU", { maximumFractionDigits: digits });

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU") : "—";

const unitOf = (key: string, unit: string, value: number) =>
  key === "metabolicAge" ? plural(value, ["год", "года", "лет"]) : unit;

function Was({
  field,
  m,
  prev,
}: {
  field: NumericKey;
  m: Measurement;
  prev: Measurement | null;
}) {
  const was = prev?.[field];
  if (was == null) return <td className="num">—</td>;
  const diff = m.delta[field];
  return (
    <td className="num">
      {num(was)}
      {diff != null && diff !== 0 && (
        <span className="diff">
          {" "}
          ({diff > 0 ? "+" : "−"}
          {num(Math.abs(diff))})
        </span>
      )}
    </td>
  );
}

export function PrintReport({
  studio,
  user,
  card,
  protocol,
  m,
  prev,
}: {
  studio: SiteSettings | null;
  user: { name: string; phone: string; email: string };
  card: ClientCard | null;
  protocol: Protocol;
  m: Measurement;
  prev: Measurement | null;
}) {
  const d = m.derived;
  const bodyType = protocol.bodyTypes.find(
    (t) => t.value === card?.bodyType,
  )?.label;
  const testById = new Map(m.tests.map((t) => [t.testId, t]));

  const filledTests = protocol.tests.filter((t) => {
    const r = testById.get(t.id);
    return r && (r.value.trim() || r.passed != null);
  });
  const tests = filledTests.length ? filledTests : protocol.tests;

  const notes: [string, string][] = [
    ["Сильные стороны", m.strengths],
    ["Зоны риска", m.risks],
    ["Рекомендации по тренировкам", m.trainingAdvice],
    ["Рекомендации по питанию", m.nutritionAdvice],
  ];
  const filledNotes = notes.filter(([, text]) => text.trim());

  const bioZone = (key: string) =>
    key === "fatPct"
      ? d.fat
      : key === "waterPct"
        ? d.water
        : key === "visceralFat"
          ? d.visceral
          : null;

  return (
    <div className="print-report hidden print:block">
      <p className="studio">
        {studio
          ? `ТРИЕДИНСТВО · ${studio.address} · ${studio.phone}`
          : "ТРИЕДИНСТВО"}
      </p>

      <h1>Протокол функциональной диагностики</h1>

      <table className="meta">
        <tbody>
          <tr>
            <td>
              <b>Клиент:</b> {user.name}
            </td>
            <td>
              <b>Дата протокола:</b> {day(m.takenAt)}
            </td>
          </tr>
          <tr>
            <td>
              <b>Телефон:</b> {user.phone || "—"}
            </td>
            <td>
              <b>Предыдущая диагностика:</b> {day(m.prevAt)}
            </td>
          </tr>
          <tr>
            <td>
              <b>Email:</b> {user.email}
            </td>
            <td>
              <b>Диагностику проводил:</b> {m.author ?? "—"}
              {m.editor && `, правки: ${m.editor}`}
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <b>Пол:</b> {card?.sex ? SEX_LABEL[card.sex] : "—"} ·{" "}
              <b>Возраст:</b> {d.age ?? "—"} · <b>Рост:</b>{" "}
              {card?.heightCm ? `${num(card.heightCm)} см` : "—"} ·{" "}
              <b>Тип телосложения:</b> {bodyType ?? "—"}
            </td>
          </tr>
          {card?.note.trim() && (
            <tr>
              <td colSpan={2}>
                <b>Примечание:</b> {card.note}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <section>
        <h2>1. Антропометрия</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Показатель</th>
              <th>Как измерять</th>
              <th>Норма</th>
              <th className="num">Результат</th>
              <th className="num">Было</th>
            </tr>
          </thead>
          <tbody>
            {protocol.girths.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td>{f.howTo}</td>
                <td>{f.norm}</td>
                <td className="num">
                  {m[f.key] == null ? "—" : `${num(m[f.key])} см`}
                </td>
                <Was field={f.key} m={m} prev={prev} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>2. Интерпретация соотношений</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Показатель</th>
              <th>Расчёт</th>
              <th>Норма</th>
              <th className="num">Результат</th>
              <th>Зона</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Т/Б</td>
              <td>Талия ÷ Бёдра</td>
              <td>
                {card?.sex === "MALE"
                  ? "М < 0,95"
                  : card?.sex === "FEMALE"
                    ? "Ж < 0,85"
                    : "Ж < 0,85 · М < 0,95"}
              </td>
              <td className="num">{d.whr ? num(d.whr.value, 2) : "—"}</td>
              <td>{d.whr?.zone.label ?? "—"}</td>
            </tr>
            <tr>
              <td>Т/Р</td>
              <td>Талия ÷ Рост</td>
              <td>0,4–0,49</td>
              <td className="num">{d.whtr ? num(d.whtr.value, 2) : "—"}</td>
              <td>{d.whtr?.zone.label ?? "—"}</td>
            </tr>
            <tr>
              <td>ИМТ</td>
              <td>Вес ÷ рост²</td>
              <td>18,5–24,9</td>
              <td className="num">{d.bmi ? num(d.bmi.value) : "—"}</td>
              <td>{d.bmi?.zone.label ?? "—"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. Биоимпедансный анализ</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Показатель</th>
              <th>Норма</th>
              <th className="num">Результат</th>
              <th className="num">Было</th>
              <th>Оценка</th>
            </tr>
          </thead>
          <tbody>
            {protocol.bio.map((f) => (
              <tr key={f.key}>
                <td>{f.label}</td>
                <td>{f.norm}</td>
                <td className="num">
                  {m[f.key] == null
                    ? "—"
                    : `${num(m[f.key], f.key === "bmr" ? 0 : 1)} ${unitOf(f.key, f.unit, m[f.key] as number)}`.trim()}
                </td>
                <Was field={f.key} m={m} prev={prev} />
                <td>{bioZone(f.key)?.label ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>4. Расчёт идеального веса</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Формула</th>
              <th>Расчёт</th>
              <th className="num">Результат</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Брока</td>
              <td>Рост − 100 с поправкой на тип телосложения</td>
              <td className="num">{num(d.ideal.broca)} кг</td>
            </tr>
            <tr>
              <td>Лоренца</td>
              <td>(Рост − 100) − (Рост − 150) ÷ 2 (Ж) или ÷ 4 (М)</td>
              <td className="num">{num(d.ideal.lorentz)} кг</td>
            </tr>
            <tr>
              <td>ИМТ-ориентир</td>
              <td>22 × рост в метрах²</td>
              <td className="num">{num(d.ideal.bmiRef)} кг</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <b>Средний идеальный вес</b>
              </td>
              <td className="num">
                <b>{num(d.ideal.average)} кг</b>
              </td>
            </tr>
            {m.weightKg != null && d.ideal.average != null && (
              <tr>
                <td colSpan={2}>Разница с текущим весом</td>
                <td className="num">
                  {m.weightKg > d.ideal.average ? "+" : "−"}
                  {num(Math.abs(m.weightKg - d.ideal.average))} кг
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {tests.length > 0 && (
        <section>
          <h2>5. Функциональные тесты</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th className="no">№</th>
                <th>Тест</th>
                <th>Что оцениваем</th>
                <th>Норма</th>
                <th className="num">Результат</th>
                <th>Оценка</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, i) => {
                const r = testById.get(t.id);
                return (
                  <tr key={t.id}>
                    <td className="no">{i + 1}</td>
                    <td>{t.name}</td>
                    <td>{t.measures}</td>
                    <td>{t.norm}</td>
                    <td className="num">
                      {r?.value.trim()
                        ? `${r.value}${t.unit ? ` ${t.unit}` : ""}`
                        : "—"}
                    </td>
                    <td>
                      {r?.passed == null
                        ? "—"
                        : r.passed
                          ? "В норме"
                          : "Ниже нормы"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2>Итоговые заметки тренера</h2>
        {filledNotes.length || m.nextCheckAt ? (
          <dl className="notes">
            {filledNotes.map(([label, text]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{text}</dd>
              </div>
            ))}
            {m.nextCheckAt && (
              <div>
                <dt>Повторная диагностика</dt>
                <dd>{day(m.nextCheckAt)}</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="empty">Заметок нет.</p>
        )}
      </section>

      <p className="foot">
        Протокол сформирован {new Date().toLocaleDateString("ru-RU")}
        {studio?.email ? ` · ${studio.email}` : ""}
      </p>
    </div>
  );
}
