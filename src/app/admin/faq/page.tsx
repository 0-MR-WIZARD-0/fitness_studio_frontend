"use client";

import { useEffect, useState } from "react";
import type { HomeFaq } from "@/lib/api";
import { adminFaqList, createFaq, deleteFaq, updateFaq } from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";

type FaqDraft = Pick<HomeFaq, "question" | "answer" | "imageUrl">;

const EMPTY: FaqDraft = { question: "", answer: "", imageUrl: null };

export default function AdminFaq() {
  const [items, setItems] = useState<HomeFaq[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminFaqList().then(setItems);
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
      updateFaq(a.id, { ...a, order: b.order }),
      updateFaq(b.id, { ...b, order: a.order }),
    ]);
    await reload();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Вопросы (табы на главной)</PageTitle>
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
          <FaqCard
            initial={EMPTY}
            onSave={async (draft) => {
              await createFaq({ ...draft, order: items.length + 1 });
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
              <FaqCard
                initial={item}
                onSave={async (draft) => {
                  await updateFaq(item.id, { ...draft, order: item.order });
                  await reload();
                  flash("Сохранено");
                }}
                onDelete={async () => {
                  if (!confirm("Удалить вопрос?")) return;
                  await deleteFaq(item.id);
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

function FaqCard({
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: FaqDraft;
  onSave: (draft: FaqDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<FaqDraft>({
    question: initial.question,
    answer: initial.answer,
    imageUrl: initial.imageUrl,
  });
  const [error, setError] = useState<string | null>(null);

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
        label="Фото (показывается при выборе таба)"
        value={draft.imageUrl}
        onChange={(url) => setDraft({ ...draft, imageUrl: url })}
        folder="faq"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={async () => {
            setError(null);
            try {
              await onSave({ ...draft, question: draft.question.trim() });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            }
          }}
          disabled={!draft.question.trim()}
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
