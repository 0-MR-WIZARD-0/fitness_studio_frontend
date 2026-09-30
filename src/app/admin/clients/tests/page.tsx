"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTitle, TextField, Toast } from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";
import {
  createFunctionalTest,
  deleteFunctionalTest,
  listFunctionalTests,
  updateFunctionalTest,
  type FunctionalTest,
} from "@/lib/clients";

type Draft = Pick<
  FunctionalTest,
  "name" | "measures" | "howTo" | "norm" | "unit"
>;

const EMPTY: Draft = { name: "", measures: "", howTo: "", norm: "", unit: "" };

export default function AdminFunctionalTests() {
  const [items, setItems] = useState<FunctionalTest[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => listFunctionalTests().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const active = items.filter((t) => t.isActive);
  const hidden = items.filter((t) => !t.isActive);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= active.length) return;
    const a = active[index];
    const b = active[target];
    await Promise.all([
      updateFunctionalTest(a.id, { ...a, order: b.order }),
      updateFunctionalTest(b.id, { ...b, order: a.order }),
    ]);
    await reload();
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/clients"
        className="mb-3 inline-block text-sm text-text/60 hover:text-heading"
      >
        ← Клиенты
      </Link>

      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Тесты диагностики</PageTitle>
        <button
          onClick={() => setAdding(true)}
          disabled={adding}
          className="btn-gold disabled:opacity-40"
        >
          + Добавить
        </button>
      </div>

      <p className="mb-5 text-sm text-text/60">
        Общий для студии список: он появляется в каждом протоколе. Тест, который
        уже заполнен в замерах, не удаляется, а прячется — история сохраняется.
      </p>

      {adding && (
        <div className="mb-5">
          <TestCard
            initial={EMPTY}
            onSave={async (draft) => {
              await createFunctionalTest({
                ...draft,
                order: active.length + 1,
              });
              setAdding(false);
              await reload();
              flash("Тест добавлен");
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {active.map((t, i) => (
          <div key={t.id} className="flex items-start gap-3">
            <div className="pt-5">
              <MoveButtons
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                disableUp={i === 0}
                disableDown={i === active.length - 1}
              />
            </div>
            <div className="flex-1">
              <TestCard
                initial={t}
                onSave={async (draft) => {
                  await updateFunctionalTest(t.id, {
                    ...draft,
                    order: t.order,
                  });
                  await reload();
                  flash("Сохранено");
                }}
                onDelete={async () => {
                  if (!confirm(`Удалить тест «${t.name}»?`)) return;
                  const res = await deleteFunctionalTest(t.id);
                  await reload();
                  flash(res.message ?? "Тест удалён");
                }}
              />
            </div>
          </div>
        ))}
        {active.length === 0 && !adding && (
          <p className="text-text/60">Список пуст.</p>
        )}
      </div>

      {hidden.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-sub text-sm uppercase tracking-wider text-text/50">
            Скрытые тесты
          </h2>
          <div className="space-y-2">
            {hidden.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-2 rounded-xl border border-white/10 bg-surface/20 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-text/60">{t.name}</span>
                <button
                  onClick={async () => {
                    await updateFunctionalTest(t.id, {
                      ...t,
                      isActive: true,
                      order: active.length + 1,
                    });
                    await reload();
                    flash("Тест возвращён в протокол");
                  }}
                  className="self-start text-text/70 hover:text-heading sm:self-auto"
                >
                  Вернуть в протокол
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

function TestCard({
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: Draft;
  onSave: (draft: Draft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    name: initial.name,
    measures: initial.measures,
    howTo: initial.howTo,
    norm: initial.norm,
    unit: initial.unit,
  });
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-2xl border-gold bg-surface/50 p-4 sm:p-5">
      <TextField
        label="Название"
        value={draft.name}
        onChange={(name) => setDraft({ ...draft, name })}
      />
      <TextField
        label="Что оцениваем"
        value={draft.measures}
        onChange={(measures) => setDraft({ ...draft, measures })}
      />
      <TextField
        label="Как выполнять"
        value={draft.howTo}
        onChange={(howTo) => setDraft({ ...draft, howTo })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Норма"
          value={draft.norm}
          onChange={(norm) => setDraft({ ...draft, norm })}
        />
        <TextField
          label="Единица (сек, раз, см)"
          value={draft.unit}
          onChange={(unit) => setDraft({ ...draft, unit })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={async () => {
            setError(null);
            try {
              await onSave({ ...draft, name: draft.name.trim() });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
          disabled={!draft.name.trim()}
          className="btn-gold disabled:opacity-40"
        >
          Сохранить
        </button>
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-text/70">
            Отмена
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="text-sm text-red-400">
            Удалить
          </button>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
