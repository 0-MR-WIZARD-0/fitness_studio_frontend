"use client";

import { useEffect, useState } from "react";
import type { HomeStep } from "@/lib/api";
import {
  adminStepList,
  createStep,
  deleteStep,
  updateStep,
} from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";

export default function AdminSteps() {
  const [items, setItems] = useState<HomeStep[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminStepList().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  async function add() {
    await createStep({
      label: `${items.length + 1} шаг`,
      title: "Новый шаг",
      description: "",
      order: items.length + 1,
      isActive: true,
    });
    await reload();
    flash("Добавлено");
  }

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
        <button onClick={add} className="btn-gold">
          + Добавить
        </button>
      </div>

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
                item={item}
                onSaved={(m) => {
                  reload();
                  flash(m);
                }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-text/60">Пока пусто.</p>}
      </div>
      <Toast message={toast} />
    </div>
  );
}

function StepCard({
  item,
  onSaved,
}: {
  item: HomeStep;
  onSaved: (m: string) => void;
}) {
  const [draft, setDraft] = useState(item);

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
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          Порядок
          <input
            className="field w-20"
            type="number"
            value={draft.order}
            onChange={(e) =>
              setDraft({ ...draft, order: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
          />
          Активен
        </label>
      </div>
      <div className="flex gap-3">
        <button
          onClick={async () => {
            await updateStep(item.id, draft);
            onSaved("Сохранено");
          }}
          className="btn-gold"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm("Удалить шаг?")) return;
            await deleteStep(item.id);
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
