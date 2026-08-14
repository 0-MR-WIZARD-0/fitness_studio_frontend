"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings, type Format } from "@/lib/api";
import {
  adminFormatList,
  deleteFormat,
  updateFormat,
  updateSettings,
} from "@/lib/admin";
import { PageTitle, TextField, Toast } from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";

export default function AdminFormats() {
  const [items, setItems] = useState<Format[]>([]);
  const [threshold, setThreshold] = useState(3);
  const [price, setPrice] = useState(0);
  const [coursePrice, setCoursePrice] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminFormatList().then(setItems);
  useEffect(() => {
    reload();
    getSettings().then((s) => {
      setThreshold(s.courseThreshold);
      setPrice(s.pricePerSession);
      setCoursePrice(s.priceCourse);
    });
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  async function savePrices() {
    await updateSettings({
      courseThreshold: Math.max(1, threshold),
      pricePerSession: Math.max(0, price),
      priceCourse: Math.max(0, coursePrice),
    });
    flash("Цены сохранены");
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    await Promise.all([
      updateFormat(a.id, { slug: a.slug, name: a.name, order: b.order }),
      updateFormat(b.id, { slug: b.slug, name: b.name, order: a.order }),
    ]);
    await reload();
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Форматы</PageTitle>
        <Link href="/admin/formats/new" className="btn-gold">
          + Новый формат
        </Link>
      </div>

      <div className="space-y-2">
        {items.map((f, i) => (
          <div
            key={f.id}
            className="flex items-center justify-between rounded-xl border-gold bg-surface/40 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <MoveButtons
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                disableUp={i === 0}
                disableDown={i === items.length - 1}
              />
              <div>
                <span className="text-heading">{f.name}</span>{" "}
                <span className="text-xs text-text/50">/{f.slug}</span>
                {!f.isActive && (
                  <span className="ml-2 text-xs text-red-400">скрыт</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/admin/formats/${f.id}`}
                className="text-accent hover:underline"
              >
                Редактировать
              </Link>
              <button
                onClick={async () => {
                  if (!confirm(`Удалить формат «${f.name}»?`)) return;
                  await deleteFormat(f.id);
                  reload();
                  setToast("Удалено");
                  setTimeout(() => setToast(null), 2000);
                }}
                className="text-red-400"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-text/60">Форматов нет.</p>}
      </div>

      <div className="mt-8 max-w-xxl rounded-xl border-gold bg-surface/40 p-4">
        <p className="mb-3 font-sub text-heading">Цены и курс</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField
            label="Цена за занятие, ₽"
            type="number"
            value={price}
            onChange={(v) => setPrice(Math.max(0, Number(v)))}
          />
          <TextField
            label="Цена занятия в курсе, ₽"
            type="number"
            value={coursePrice}
            onChange={(v) => setCoursePrice(Math.max(0, Number(v)))}
          />
          <TextField
            label="Занятий = курс"
            type="number"
            value={threshold}
            onChange={(v) => setThreshold(Math.max(1, Number(v)))}
          />
        </div>
        <p className="mt-2 text-xs text-text/50">
          Цена одна для всех форматов. Набрал столько занятий за 7 дней — они
          считаются по курсовой цене, и клиент получает ещё одно в подарок.
        </p>
        <button onClick={savePrices} className="btn-gold mt-3">
          Сохранить
        </button>
      </div>

      <Toast message={toast} />
    </div>
  );
}
