"use client";

import { useEffect, useMemo, useState } from "react";
import type { Condition, Format, RiskLevel } from "@/lib/api";
import {
  adminConditions,
  adminFormatList,
  createCondition,
  deleteCondition,
  importConditions,
  updateCondition,
  type ConditionInput,
} from "@/lib/admin";
import { PageTitle, TextField, Toast } from "@/components/admin/ui";
import { clsx } from "@/lib/clsx";
import { Select } from "@/components/Select";
import { RISK_OPTIONS } from "@/lib/survey";
import { cleanCell, parseCsv, riskFromCell } from "@/lib/csv";

const PER_PAGE = 6;

export default function AdminSurvey() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [items, setItems] = useState<Condition[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const reload = () => adminConditions().then(setItems);

  useEffect(() => {
    adminFormatList().then(setFormats);
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const formatsKey = formats.map((f) => f.id).join(",");

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const current = Math.min(page, pages - 1);
  const visible = found.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE);

  async function add() {
    const minOrder = items.reduce((m, i) => Math.min(m, i.order), 0);
    await createCondition({
      name: "Новое состояние",
      order: minOrder - 1,
      isActive: true,
      rules: formats.map((f) => ({
        formatId: f.id,
        risk: "ALLOWED" as RiskLevel,
        note: "",
      })),
    });
    await reload();
    setPage(0);
    flash("Добавлено");
  }

  return (
    <div className="max-w-4xl">
      <PageTitle>Опрос: состояния и противопоказания</PageTitle>
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-text/70">
        Список состояний показывается посетителю на странице «Пройти опрос и
        подобрать формат». Для каждого состояния задайте, что можно с каждым
        форматом, и пояснение — оно попадёт в результат опроса.
      </p>

      <ImportPanel
        formats={formats}
        onDone={async (m) => {
          await reload();
          flash(m);
        }}
      />

      <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          className="field max-w-xs"
          placeholder="Поиск по списку…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        <button onClick={add} className="btn-gold" disabled={!formats.length}>
          + Добавить состояние
        </button>
      </div>

      {!formats.length && (
        <p className="mb-4 text-sm text-red-400">
          Сначала создайте хотя бы один формат в разделе «Форматы».
        </p>
      )}

      <div className="space-y-5">
        {formats.length > 0 &&
          visible.map((item) => (
            <ConditionCard
              key={`${item.id}:${formatsKey}`}
              item={item}
              formats={formats}
              onSaved={async (m) => {
                await reload();
                flash(m);
              }}
            />
          ))}
        {!items.length && <p className="text-text/60">Пока пусто.</p>}
        {!!items.length && !found.length && (
          <p className="text-text/60">Ничего не найдено.</p>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, current - 1))}
            disabled={current === 0}
            className="rounded-lg border-gold px-3 py-1.5 text-sm disabled:opacity-30"
          >
            ←
          </button>
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={clsx(
                "h-8 w-8 rounded-lg border-gold text-sm transition",
                i === current ? "bg-accent text-bg" : "hover:bg-surface-2",
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(pages - 1, current + 1))}
            disabled={current === pages - 1}
            className="rounded-lg border-gold px-3 py-1.5 text-sm disabled:opacity-30"
          >
            →
          </button>
          <span className="ml-2 text-sm text-text/60">
            Всего: {found.length}
          </span>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

function ConditionCard({
  item,
  formats,
  onSaved,
}: {
  item: Condition;
  formats: Format[];
  onSaved: (m: string) => void;
}) {
  const [name, setName] = useState(item.name);
  const [isActive, setIsActive] = useState(item.isActive);
  const [rules, setRules] = useState<Record<number, { risk: RiskLevel; note: string }>>(
    () => {
      const map: Record<number, { risk: RiskLevel; note: string }> = {};
      for (const f of formats) {
        const rule = item.rules.find((r) => r.formatId === f.id);
        map[f.id] = { risk: rule?.risk ?? "ALLOWED", note: rule?.note ?? "" };
      }
      return map;
    },
  );

  const payload = (): ConditionInput => ({
    name,
    order: item.order,
    isActive,
    rules: formats.map((f) => ({
      formatId: f.id,
      risk: rules[f.id]?.risk ?? "ALLOWED",
      note: rules[f.id]?.note ?? "",
    })),
  });

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5 space-y-4">
      <TextField label="Состояние / заболевание" value={name} onChange={setName} />

      <div className="space-y-3">
        {formats.map((f) => (
          <div key={f.id} className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
            <div className="font-sub text-sm text-heading">{f.name}</div>
            <Select
              className="w-full md:w-56"
              value={rules[f.id]?.risk ?? "ALLOWED"}
              onChange={(v) =>
                setRules({
                  ...rules,
                  [f.id]: {
                    risk: v as RiskLevel,
                    note: rules[f.id]?.note ?? "",
                  },
                })
              }
              options={RISK_OPTIONS}
            />
            <input
              className="field md:col-span-2"
              placeholder="Пояснение для посетителя (например: без осевой нагрузки)"
              value={rules[f.id]?.note ?? ""}
              onChange={(e) =>
                setRules({
                  ...rules,
                  [f.id]: {
                    risk: rules[f.id]?.risk ?? "ALLOWED",
                    note: e.target.value,
                  },
                })
              }
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Показывать в опросе
      </label>

      <div className="flex gap-3">
        <button
          onClick={async () => {
            await updateCondition(item.id, payload());
            onSaved("Сохранено");
          }}
          className="btn-gold"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm("Удалить состояние?")) return;
            await deleteCondition(item.id);
            onSaved("Удалено");
          }}
          className="text-sm text-red-400"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

function normalize(text: string) {
  return cleanCell(text)
    .toLowerCase()
    .replace(/[«»"'(),.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ImportPanel({
  formats,
  onDone,
}: {
  formats: Format[];
  onDone: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<(number | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parse() {
    setError(null);
    const parsed = parseCsv(csv);
    if (parsed.length < 2) {
      setError("Не удалось разобрать таблицу: нужны заголовок и хотя бы одна строка");
      setRows(null);
      return;
    }
    const header = parsed[0].slice(1);
    setRows(parsed);
    setMapping(
      header.map((cell) => {
        const h = normalize(cell);
        const found = formats.find((f) => {
          const n = normalize(f.name);
          return h.includes(n) || n.includes(h.split(" ")[0] ?? "");
        });
        return found?.id ?? null;
      }),
    );
  }

  async function run() {
    if (!rows) return;
    setBusy(true);
    setError(null);
    try {
      const items: ConditionInput[] = [];
      rows.slice(1).forEach((row, i) => {
        const name = cleanCell(row[0] ?? "");
        if (!name) return;
        const rules: ConditionInput["rules"] = [];
        mapping.forEach((formatId, col) => {
          if (!formatId) return;
          const parsed = riskFromCell(row[col + 1] ?? "");
          if (!parsed) return;
          rules.push({ formatId, risk: parsed.risk, note: parsed.note });
        });
        items.push({ name, order: i + 1, isActive: true, rules });
      });
      if (!items.length) {
        setError("В таблице не нашлось строк с состояниями");
        return;
      }
      const res = await importConditions(items);
      setRows(null);
      setCsv("");
      setOpen(false);
      onDone(`Импортировано: новых ${res.created}, обновлено ${res.updated}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось импортировать");
    } finally {
      setBusy(false);
    }
  }

  const formatOptions = formats.map((f) => ({ value: f.id, label: f.name }));

  return (
    <div className="rounded-2xl border-gold bg-surface/30 p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-sub text-heading"
      >
        {open ? "− " : "+ "}Импорт из таблицы (CSV)
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-text/70">
            Вставьте содержимое CSV-файла: первый столбец — состояние, остальные
            — форматы. Метки 🟢 / 🟡 / 🔴 распознаются автоматически, текст в
            скобках станет пояснением. Совпадающие по названию состояния будут
            обновлены.
          </p>
          <textarea
            className="field font-mono text-xs"
            rows={8}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Заболевание,Формат 1,Формат 2…"
          />
          <button onClick={parse} className="btn-gold" disabled={!csv.trim()}>
            Разобрать
          </button>

          {rows && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-sm text-heading">
                Строк с состояниями: {rows.length - 1}. Сопоставьте столбцы с
                форматами:
              </p>
              {rows[0].slice(1).map((cell, i) => (
                <div key={i} className="grid gap-2 md:grid-cols-2 md:items-center">
                  <span className="text-sm text-text/80">{cleanCell(cell)}</span>
                  <Select
                    value={mapping[i]}
                    onChange={(v) => {
                      const next = [...mapping];
                      next[i] = Number(v);
                      setMapping(next);
                    }}
                    options={formatOptions}
                    placeholder="Не импортировать"
                  />
                </div>
              ))}
              <button onClick={run} className="btn-gold" disabled={busy}>
                {busy ? "Импорт…" : "Импортировать"}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
