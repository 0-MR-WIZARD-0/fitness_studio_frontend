"use client";

import { useEffect, useState } from "react";
import type { HomeFaq } from "@/lib/api";
import {
  adminFaqList,
  createFaq,
  deleteFaq,
  updateFaq,
} from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";

export default function AdminFaq() {
  const [items, setItems] = useState<HomeFaq[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminFaqList().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  async function add() {
    await createFaq({
      question: "Новый вопрос",
      answer: "",
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
      updateFaq(a.id, { ...a, order: b.order }),
      updateFaq(b.id, { ...b, order: a.order }),
    ]);
    await reload();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Вопросы (табы на главной)</PageTitle>
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
              <FaqCard
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

function FaqCard({
  item,
  onSaved,
}: {
  item: HomeFaq;
  onSaved: (m: string) => void;
}) {
  const [draft, setDraft] = useState(item);

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5 space-y-3">
      <TextField
        label="Вопрос"
        value={draft.question}
        onChange={(v) => setDraft({ ...draft, question: v })}
      />
      <TextArea
        label="Ответ"
        value={draft.answer}
        onChange={(v) => setDraft({ ...draft, answer: v })}
      />
      <ImageField
        label="Картинка (показывается при выборе таба)"
        value={draft.imageUrl}
        onChange={(url) => setDraft({ ...draft, imageUrl: url })}
        folder="faq"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        Активен
      </label>
      <div className="flex gap-3">
        <button
          onClick={async () => {
            await updateFaq(item.id, draft);
            onSaved("Сохранено");
          }}
          className="btn-gold"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm("Удалить вопрос?")) return;
            await deleteFaq(item.id);
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
