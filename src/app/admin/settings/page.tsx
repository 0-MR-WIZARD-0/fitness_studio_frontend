"use client";

import { useEffect, useState } from "react";
import { getSettings, type SiteSettings } from "@/lib/api";
import { updateSettings } from "@/lib/admin";
import { Labeled, PageTitle, TextField, Toast } from "@/components/admin/ui";
import { formatPhone, isValidPhone } from "@/lib/phone";

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
      <Labeled label="Телефон">
        <input
          className="field"
          inputMode="tel"
          placeholder="+7 (999) 999-99-99"
          value={data.phone}
          onChange={(e) =>
            setData({ ...data, phone: formatPhone(e.target.value) })
          }
        />
      </Labeled>
      {data.phone && !isValidPhone(data.phone) && (
        <p className="-mt-2 text-xs text-red-400">Введите телефон полностью</p>
      )}
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

      <button onClick={save} className="btn-gold">
        Сохранить
      </button>
      <Toast message={toast} />
    </div>
  );
}
