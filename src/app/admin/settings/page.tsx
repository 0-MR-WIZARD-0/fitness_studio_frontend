"use client";

import { useEffect, useState } from "react";
import { getSettings, type SiteSettings } from "@/lib/api";
import { updateSettings } from "@/lib/admin";
import { PageTitle, TextField, Toast } from "@/components/admin/ui";

export default function AdminSettings() {
  const [data, setData] = useState<SiteSettings | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setData);
  }, []);

  if (!data) return <p>Загрузка…</p>;

  async function save() {
    if (!data) return;
    await updateSettings(data);
    setToast("Сохранено");
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="max-w-xl space-y-4">
      <PageTitle>Контакты и карта</PageTitle>
      <TextField
        label="Адрес"
        value={data.address}
        onChange={(v) => setData({ ...data, address: v })}
      />
      <TextField
        label="Телефон"
        value={data.phone}
        onChange={(v) => setData({ ...data, phone: v })}
      />
      <TextField
        label="Email"
        value={data.email}
        onChange={(v) => setData({ ...data, email: v })}
      />
      <p className="text-sm text-text/60">
        Карта и точка на сайте формируются автоматически из адреса.
      </p>

      <div className="border-t border-white/10 pt-4 space-y-4">
        <p className="font-sub text-heading">Каналы</p>
        <TextField
          label="Ссылка на Telegram-канал"
          value={data.telegramUrl}
          onChange={(v) => setData({ ...data, telegramUrl: v })}
        />
        <TextField
          label="Ссылка на канал в MAX"
          value={data.maxUrl}
          onChange={(v) => setData({ ...data, maxUrl: v })}
        />
        <p className="text-sm text-text/60">
          Появятся в футере и кружками справа внизу на десктопе. Пустое поле —
          канал не показывается.
        </p>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-4">
        <p className="font-sub text-heading">Личный кабинет</p>
        <label className="block text-sm">
          <span className="mb-1 block text-text/80">
            Перенос и отмена — не позднее чем за, ч
          </span>
          <input
            type="number"
            inputMode="numeric"
            className="field w-40"
            min={0}
            value={data.bookingEditHours}
            onChange={(e) =>
              setData({
                ...data,
                bookingEditHours: Math.max(0, Number(e.target.value)),
              })
            }
          />
        </label>
        <p className="text-sm text-text/60">
          За этот срок до начала клиент ещё может перенести или отменить запись
          сам. Позже — только через студию. По умолчанию 4 часа.
        </p>
      </div>

      <button onClick={save} className="btn-gold">
        Сохранить
      </button>
      <Toast message={toast} />
    </div>
  );
}
