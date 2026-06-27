"use client";

import { useEffect, useState } from "react";
import { getSettings, mediaUrl, type SiteSettings } from "@/lib/api";
import { deleteAgreement, uploadAgreement } from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";

export default function AdminAgreement() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  async function pick(file?: File) {
    if (!file) return;
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Можно загрузить только PDF");
      return;
    }
    setBusy(true);
    try {
      const s = await uploadAgreement(file);
      setSettings(s);
      flash("Файл загружен");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Удалить пользовательское соглашение?")) return;
    setError(null);
    const s = await deleteAgreement();
    setSettings(s);
    flash("Удалено");
  }

  if (!settings) return <p>Загрузка…</p>;

  const url = mediaUrl(settings.userAgreementUrl);

  return (
    <div className="max-w-xl">
      <PageTitle>Пользовательское соглашение</PageTitle>

      <div className="rounded-2xl border-gold bg-surface/50 p-5">
        {url ? (
          <p className="mb-4 text-sm">
            Текущий файл:{" "}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              открыть PDF
            </a>
          </p>
        ) : (
          <p className="mb-4 text-sm text-text/60">Файл ещё не загружен.</p>
        )}

        <div className="flex items-center gap-4">
          <label className="inline-flex cursor-pointer items-center rounded-lg border-gold bg-surface-2 px-4 py-2 text-sm text-heading hover:bg-surface">
            {busy ? "Загрузка…" : url ? "Заменить PDF" : "Загрузить PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          {url && (
            <button onClick={remove} className="text-sm text-red-400">
              Удалить
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
      <Toast message={toast} />
    </div>
  );
}
