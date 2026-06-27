"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Format } from "@/lib/api";
import { createFormat, updateFormat } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import {
  ImageField,
  Labeled,
  PageTitle,
  StringList,
  TextField,
  Toast,
} from "./ui";
import { MoveButtons } from "./MoveButtons";

type ForWhom = { title: string; description: string; order?: number };
type Mechanism = {
  number?: number;
  title: string;
  bullets: string[];
  imageUrl?: string | null;
  order?: number;
};

interface Draft {
  slug: string;
  name: string;
  subtitle: string;
  miniResults: string[];
  heroImageUrl: string | null;
  pricePerSession: number;
  priceCourse: number;
  order: number;
  isActive: boolean;
  forWhom: ForWhom[];
  mechanisms: Mechanism[];
}

const empty: Draft = {
  slug: "",
  name: "",
  subtitle: "",
  miniResults: [],
  heroImageUrl: null,
  pricePerSession: 5000,
  priceCourse: 20000,
  order: 0,
  isActive: true,
  forWhom: [],
  mechanisms: [],
};

export function FormatEditor({ initial }: { initial?: Format }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(
    initial
      ? {
          ...empty,
          ...initial,
          forWhom: initial.forWhom ?? [],
          mechanisms: (initial.mechanisms ?? []).map((m) => ({
            number: m.number,
            title: m.title,
            bullets: m.bullets,
            imageUrl: m.imageUrl,
            order: m.order,
          })),
        }
      : empty,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Draft>) => setD({ ...d, ...patch });

  function moveMech(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= d.mechanisms.length) return;
    const next = [...d.mechanisms];
    [next[index], next[target]] = [next[target], next[index]];
    set({ mechanisms: next.map((m, i) => ({ ...m, order: i + 1 })) });
  }

  async function save() {
    setError(null);
    try {
      const payload = { ...d, slug: d.slug || slugify(d.name) };
      if (initial) {
        await updateFormat(initial.id, payload);
      } else {
        await createFormat(payload);
      }
      setToast("Сохранено");
      setTimeout(() => router.push("/admin/formats"), 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <PageTitle>{initial ? `Формат: ${initial.name}` : "Новый формат"}</PageTitle>

      <TextField label="Название" value={d.name} onChange={(v) => set({ name: v })} />
      <p className="-mt-2 text-xs text-text/50">
        Адрес страницы:{" "}
        <span className="text-accent">/formats/{d.slug || slugify(d.name) || "…"}</span>{" "}
        (формируется автоматически из названия)
      </p>
      <TextField
        label="Слоган"
        value={d.subtitle}
        onChange={(v) => set({ subtitle: v })}
      />

      <StringList
        label="Мини-итоги (Сила / Выносливость …)"
        value={d.miniResults}
        onChange={(v) => set({ miniResults: v })}
      />

      <ImageField
        label="Основная фотография (используется и на странице, и в слайдере)"
        value={d.heroImageUrl}
        onChange={(url) => set({ heroImageUrl: url })}
        folder="formats"
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Цена за занятие"
          type="number"
          value={d.pricePerSession}
          onChange={(v) => set({ pricePerSession: Number(v) })}
        />
        <TextField
          label="Цена курса"
          type="number"
          value={d.priceCourse}
          onChange={(v) => set({ priceCourse: Number(v) })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={d.isActive}
          onChange={(e) => set({ isActive: e.target.checked })}
        />
        Активен (порядок задаётся стрелками в списке форматов)
      </label>

      <Labeled label="Для кого этот формат">
        <div className="space-y-3">
          {d.forWhom.map((it, i) => (
            <div key={i} className="rounded-xl border-gold p-4 space-y-2">
              <input
                className="field"
                placeholder="Заголовок"
                value={it.title}
                onChange={(e) => {
                  const next = [...d.forWhom];
                  next[i] = { ...it, title: e.target.value };
                  set({ forWhom: next });
                }}
              />
              <textarea
                className="field"
                placeholder="Описание"
                value={it.description}
                onChange={(e) => {
                  const next = [...d.forWhom];
                  next[i] = { ...it, description: e.target.value };
                  set({ forWhom: next });
                }}
              />
              <button
                type="button"
                onClick={() => set({ forWhom: d.forWhom.filter((_, x) => x !== i) })}
                className="text-xs text-red-400"
              >
                Удалить карточку
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set({ forWhom: [...d.forWhom, { title: "", description: "" }] })
            }
            className="text-sm text-accent"
          >
            + добавить карточку
          </button>
        </div>
      </Labeled>

      <Labeled label="Как это работает (механизмы)">
        <div className="space-y-3">
          {d.mechanisms.map((m, i) => (
            <div key={i} className="rounded-xl border-gold p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MoveButtons
                  onUp={() => moveMech(i, -1)}
                  onDown={() => moveMech(i, 1)}
                  disableUp={i === 0}
                  disableDown={i === d.mechanisms.length - 1}
                />
                <input
                  className="field w-20"
                  type="number"
                  placeholder="№"
                  value={m.number ?? i + 1}
                  onChange={(e) => {
                    const next = [...d.mechanisms];
                    next[i] = { ...m, number: Number(e.target.value) };
                    set({ mechanisms: next });
                  }}
                />
                <input
                  className="field"
                  placeholder="Заголовок механизма"
                  value={m.title}
                  onChange={(e) => {
                    const next = [...d.mechanisms];
                    next[i] = { ...m, title: e.target.value };
                    set({ mechanisms: next });
                  }}
                />
              </div>
              <StringList
                label="Пункты"
                value={m.bullets}
                onChange={(bullets) => {
                  const next = [...d.mechanisms];
                  next[i] = { ...m, bullets };
                  set({ mechanisms: next });
                }}
              />
              <ImageField
                label="Фото механизма"
                value={m.imageUrl ?? null}
                folder="mechanisms"
                onChange={(url) => {
                  const next = [...d.mechanisms];
                  next[i] = { ...m, imageUrl: url };
                  set({ mechanisms: next });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  set({ mechanisms: d.mechanisms.filter((_, x) => x !== i) })
                }
                className="text-xs text-red-400"
              >
                Удалить механизм
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set({
                mechanisms: [
                  ...d.mechanisms,
                  { number: d.mechanisms.length + 1, title: "", bullets: [] },
                ],
              })
            }
            className="text-sm text-accent"
          >
            + добавить механизм
          </button>
        </div>
      </Labeled>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button onClick={save} className="btn-gold">
          Сохранить
        </button>
        <button
          onClick={() => router.push("/admin/formats")}
          className="text-sm text-text/70"
        >
          Отмена
        </button>
      </div>
      <Toast message={toast} />
    </div>
  );
}
