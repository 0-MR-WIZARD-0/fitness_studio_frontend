"use client";

import { useEffect, useState } from "react";
import { getHero, type HomeHero, type Sphere } from "@/lib/api";
import { updateHero } from "@/lib/admin";
import {
  ImageField,
  Labeled,
  PageTitle,
  StringList,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";

export default function AdminHero() {
  const [data, setData] = useState<HomeHero | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getHero().then((h) => {
      const spheres = [...(h.spheres ?? [])].slice(0, 3);
      while (spheres.length < 3) spheres.push({ label: "", items: [] });
      setData({ ...h, spheres });
    });
  }, []);

  if (!data) return <p>Загрузка…</p>;

  const setSphere = (i: number, patch: Partial<Sphere>) => {
    const spheres = data.spheres.map((s, idx) =>
      idx === i ? { ...s, ...patch } : s,
    );
    setData({ ...data, spheres });
  };

  async function save() {
    if (!data) return;
    await updateHero(data);
    setToast("Сохранено");
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageTitle>Главный экран</PageTitle>
      <TextField
        label="Заголовок"
        value={data.title}
        onChange={(v) => setData({ ...data, title: v })}
      />
      <TextField
        label="Слоган"
        value={data.subtitle}
        onChange={(v) => setData({ ...data, subtitle: v })}
      />
      <TextArea
        label="Описание"
        value={data.description}
        onChange={(v) => setData({ ...data, description: v })}
        rows={6}
      />
      <ImageField
        label="Фотография на фон"
        value={data.imageUrl}
        onChange={(url) => setData({ ...data, imageUrl: url })}
        folder="hero"
      />

      <Labeled label="Три сферы">
        <div className="space-y-4">
          {data.spheres.map((s, i) => (
            <div key={i} className="rounded-xl border-gold p-4">
              <input
                className="field"
                placeholder={`Название сферы ${i + 1}`}
                value={s.label}
                onChange={(e) => setSphere(i, { label: e.target.value })}
              />
              <div className="mt-3">
                <StringList
                  label="Пункты"
                  value={s.items ?? []}
                  onChange={(items) => setSphere(i, { items })}
                />
              </div>
            </div>
          ))}
        </div>
      </Labeled>

      <button onClick={save} className="btn-gold">
        Сохранить
      </button>
      <Toast message={toast} />
    </div>
  );
}
