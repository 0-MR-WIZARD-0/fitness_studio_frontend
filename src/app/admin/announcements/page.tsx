"use client";

import { useEffect, useState } from "react";
import type { Announcement } from "@/lib/api";
import {
  adminAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminAnnouncements().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  async function add() {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    await createAnnouncement({
      title: "Новое занятие",
      description: "",
      startsAt: now.toISOString(),
      capacity: 7,
      price: 0,
      isFree: true,
      isActive: true,
    });
    await reload();
    flash("Добавлено");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Анонсы / отдельные занятия</PageTitle>
        <button onClick={add} className="btn-gold">
          + Добавить
        </button>
      </div>
      <p className="mb-5 text-sm text-text/60">
        Показываются на главной после форматов. Если активных анонсов нет —
        блок не отображается.
      </p>

      <div className="space-y-5">
        {items.map((item) => (
          <AnnouncementCard
            key={item.id}
            item={item}
            onSaved={(m) => {
              reload();
              flash(m);
            }}
          />
        ))}
        {items.length === 0 && <p className="text-text/60">Пока пусто.</p>}
      </div>
      <Toast message={toast} />
    </div>
  );
}

function AnnouncementCard({
  item,
  onSaved,
}: {
  item: Announcement;
  onSaved: (m: string) => void;
}) {
  const [d, setD] = useState(item);
  const dtLocal = new Date(d.startsAt).toISOString().slice(0, 16);

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5 space-y-3">
      <TextField
        label="Название"
        value={d.title}
        onChange={(v) => setD({ ...d, title: v })}
      />
      <TextArea
        label="Описание"
        value={d.description}
        onChange={(v) => setD({ ...d, description: v })}
      />
      <ImageField
        label="Изображение"
        value={d.imageUrl}
        folder="announcements"
        onChange={(url) => setD({ ...d, imageUrl: url })}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Дата и время
          <input
            type="datetime-local"
            className="field mt-1"
            value={dtLocal}
            onChange={(e) =>
              setD({ ...d, startsAt: new Date(e.target.value).toISOString() })
            }
          />
        </label>
        <label className="text-sm">
          Мест
          <input
            type="number"
            className="field mt-1"
            value={d.capacity}
            onChange={(e) => setD({ ...d, capacity: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={d.isFree}
            onChange={(e) => setD({ ...d, isFree: e.target.checked })}
          />
          Бесплатно
        </label>
        {!d.isFree && (
          <label className="text-sm">
            Цена, руб.
            <input
              type="number"
              className="field mt-1 w-28"
              value={d.price}
              onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={d.isActive}
            onChange={(e) => setD({ ...d, isActive: e.target.checked })}
          />
          Активен
        </label>
      </div>
      <div className="flex gap-3">
        <button
          onClick={async () => {
            await updateAnnouncement(item.id, d);
            onSaved("Сохранено");
          }}
          className="btn-gold"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm("Удалить анонс?")) return;
            await deleteAnnouncement(item.id);
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
