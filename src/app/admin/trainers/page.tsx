"use client";

import { useEffect, useState } from "react";
import type { Trainer } from "@/lib/api";
import {
  adminTrainers,
  createTrainer,
  deleteTrainer,
  updateTrainer,
} from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";

export default function AdminTrainers() {
  const [items, setItems] = useState<Trainer[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminTrainers().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  async function add() {
    await createTrainer({
      name: "Новый тренер",
      role: "",
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
      updateTrainer(a.id, { ...a, order: b.order }),
      updateTrainer(b.id, { ...b, order: a.order }),
    ]);
    await reload();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Тренеры</PageTitle>
        <button onClick={add} className="btn-gold">
          + Добавить
        </button>
      </div>
      <p className="-mt-4 mb-6 text-sm text-text/70">
        Тренера можно выбрать при создании слотов в разделе «Запись» — он
        показывается посетителю рядом со временем занятия.
      </p>

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
              <TrainerCard
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

function TrainerCard({
  item,
  onSaved,
}: {
  item: Trainer;
  onSaved: (m: string) => void;
}) {
  const [draft, setDraft] = useState(item);

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5 space-y-3">
      <TextField
        label="Имя"
        value={draft.name}
        onChange={(v) => setDraft({ ...draft, name: v })}
      />
      <TextField
        label="Специализация (необязательно)"
        value={draft.role}
        onChange={(v) => setDraft({ ...draft, role: v })}
      />
      <TextArea
        label="О тренере (необязательно)"
        value={draft.description}
        onChange={(v) => setDraft({ ...draft, description: v })}
        rows={3}
      />
      <ImageField
        label="Фото"
        value={draft.photoUrl}
        onChange={(url) => setDraft({ ...draft, photoUrl: url })}
        folder="trainers"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        Активен (можно назначать на занятия)
      </label>
      <div className="flex gap-3">
        <button
          onClick={async () => {
            await updateTrainer(item.id, draft);
            onSaved("Сохранено");
          }}
          className="btn-gold"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm("Удалить тренера? Он отвяжется от своих занятий."))
              return;
            await deleteTrainer(item.id);
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
