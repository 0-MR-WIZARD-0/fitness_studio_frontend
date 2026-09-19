"use client";

import { useEffect, useState } from "react";
import type { HomeStep } from "@/lib/api";
import { adminStepList, createStep, deleteStep, updateStep } from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";

type StepDraft = Pick<HomeStep, "label" | "title" | "description" | "imageUrl">;

export default function AdminSteps() {
  const [items, setItems] = useState<HomeStep[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminStepList().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    await Promise.all([
      updateStep(a.id, { ...a, order: b.order }),
      updateStep(b.id, { ...b, order: a.order }),
    ]);
    await reload();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Шаги «Начни уже сегодня»</PageTitle>
        <button
          onClick={() => setAdding(true)}
          disabled={adding}
          className="btn-gold disabled:opacity-40"
        >
          + Добавить
        </button>
      </div>

      {adding && (
        <div className="mb-5">
          <StepCard
            initial={{
              label: `${items.length + 1} шаг`,
              title: "",
              description: "",
              imageUrl: null,
            }}
            onSave={async (draft) => {
              await createStep({ ...draft, order: items.length + 1 });
              setAdding(false);
              await reload();
              flash("Добавлено");
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="space-y-5">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="pt-5">
              <MoveButtons
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                disableUp={i === 0}
                disableDown={i === items.length - 1}
              />
            </div>
            <div className="flex-1">
              <StepCard
                initial={item}
                onSave={async (draft) => {
                  await updateStep(item.id, { ...draft, order: item.order });
                  await reload();
                  flash("Сохранено");
                }}
                onDelete={async () => {
                  if (!confirm("Удалить шаг?")) return;
                  await deleteStep(item.id);
                  await reload();
                  flash("Удалено");
                }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && !adding && (
          <p className="text-text/60">Пока пусто.</p>
        )}
      </div>
      <Toast message={toast} />
    </div>
  );
}

function StepCard({
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: StepDraft;
  onSave: (draft: StepDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<StepDraft>({
    label: initial.label,
    title: initial.title,
    description: initial.description,
    imageUrl: initial.imageUrl,
  });
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Подпись точки"
          value={draft.label}
          onChange={(v) => setDraft({ ...draft, label: v })}
        />
        <TextField
          label="Заголовок"
          value={draft.title}
          onChange={(v) => setDraft({ ...draft, title: v })}
        />
      </div>
      <TextArea
        label="Описание"
        value={draft.description}
        onChange={(v) => setDraft({ ...draft, description: v })}
      />
      <ImageField
        label="Фон шага (на весь экран)"
        value={draft.imageUrl}
        onChange={(url) => setDraft({ ...draft, imageUrl: url })}
        folder="steps"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={async () => {
            setError(null);
            try {
              await onSave({ ...draft, title: draft.title.trim() });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
          disabled={!draft.title.trim()}
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
