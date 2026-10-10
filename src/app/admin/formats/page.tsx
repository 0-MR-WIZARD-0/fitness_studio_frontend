"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings } from "@/lib/api";
import {
  adminFormatList,
  deleteFormat,
  updateFormat,
  updateSettings,
  type AdminFormat,
} from "@/lib/admin";
import { Labeled, PageTitle, Toast } from "@/components/admin/ui";
import { PasswordDialog } from "@/components/admin/PasswordDialog";
import { NumberInput } from "@/components/admin/NumberInput";
import { MoveButtons } from "@/components/admin/MoveButtons";

export default function AdminFormats() {
  const [items, setItems] = useState<AdminFormat[]>([]);
  const [removing, setRemoving] = useState<AdminFormat | null>(null);
  const [threshold, setThreshold] = useState(3);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminFormatList().then(setItems);
  useEffect(() => {
    reload();
    getSettings().then((s) => setThreshold(s.courseThreshold));
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  async function savePrices() {
    await updateSettings({ courseThreshold: Math.max(1, threshold) });
    flash("Сохранено");
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
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Форматы</PageTitle>
        <Link href="/admin/formats/new" className="btn-gold">
          + Новый формат
        </Link>
      </div>

      <div className="space-y-2">
        {items.map((f, i) => (
          <div
            key={f.id}
            className="flex flex-col gap-3 rounded-xl border-gold bg-surface/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
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
                {f.isExtra && (
                  <span className="ml-2 rounded-md border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-xs text-accent">
                    дополнительный
                  </span>
                )}
                {f.upcomingLessons > 0 && (
                  <span className="ml-2 text-xs text-text/50">
                    занятий в расписании: {f.upcomingLessons}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 pl-12 text-sm sm:pl-0">
              <Link
                href={`/admin/formats/${f.id}`}
                className="text-accent hover:underline"
              >
                Редактировать
              </Link>
              <button
                onClick={() => setRemoving(f)}
                disabled={f.upcomingLessons > 0}
                title={
                  f.upcomingLessons > 0
                    ? "Сначала удалите или перенесите занятия этого формата"
                    : undefined
                }
                className="text-red-400 disabled:opacity-40"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-text/60">Форматов нет.</p>}
      </div>

      <div className="mt-8 max-w-xxl rounded-xl border-gold bg-surface/40 p-4">
        <p className="mb-3 font-sub text-heading">Курс</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Labeled label="Занятий = курс">
            <NumberInput value={threshold} onChange={setThreshold} min={1} />
          </Labeled>
        </div>
        <p className="mt-2 text-xs text-text/50">
          Цена и количество мест задаются внутри каждого формата. Набрал столько
          занятий за 7 дней — получает промокод на бесплатное занятие, которым
          можно воспользоваться в течение месяца. В счёт идут только форматы с
          галочкой «входит в курс».
        </p>
        <button onClick={savePrices} className="btn-gold mt-3">
          Сохранить
        </button>
      </div>

      {removing && (
        <PasswordDialog
          title={`Удалить формат «${removing.name}»?`}
          description="Формат исчезнет с сайта вместе со своими карточками и механикой. Подтвердите паролем."
          onConfirm={async (password) => {
            await deleteFormat(removing.id, password);
            setRemoving(null);
            reload();
            flash("Формат удалён");
          }}
          onClose={() => setRemoving(null)}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
