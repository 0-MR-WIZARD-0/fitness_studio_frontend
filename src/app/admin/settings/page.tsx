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

      <button onClick={save} className="btn-gold">
        Сохранить
      </button>
      <Toast message={toast} />
    </div>
  );
}
