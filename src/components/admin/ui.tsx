"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/api";
import { deleteUpload, uploadFile, type UploadFolder } from "@/lib/admin";

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-6 text-3xl font-bold">{children}</h1>;
}

export function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-sub text-sm text-text/80">{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <Labeled label={label}>
      <input
        className="field"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Labeled>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <Labeled label={label}>
      <textarea
        className="field"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Labeled>
  );
}

export function ImageField({
  label,
  value,
  onChange,
  folder = "formats",
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: UploadFolder;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const preview = mediaUrl(value);

  async function pick(file?: File) {
    if (!file) return;
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("Можно загрузить только изображение");
      return;
    }
    setBusy(true);
    try {
      const { url } = await uploadFile(file, folder);
      if (value && value !== url) await deleteUpload(value).catch(() => {});
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось загрузить файл");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setErr(null);
    try {
      await deleteUpload(value);
    } catch {}
    onChange(null);
  }

  return (
    <Labeled label={label}>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border-gold bg-surface">
          {preview && (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="space-y-1">
          <label className="inline-flex cursor-pointer items-center rounded-lg border-gold bg-surface-2 px-3 py-1.5 text-sm text-heading hover:bg-surface">
            {busy ? "Загрузка…" : value ? "Заменить" : "Загрузить"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={remove}
              className="block text-xs text-red-400"
            >
              Убрать
            </button>
          )}
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
      </div>
    </Labeled>
  );
}

export function StringList({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Labeled label={label}>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="flex items-stretch gap-2">
            <input
              className="field"
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="grid aspect-square w-10 shrink-0 place-items-center rounded-lg border-gold text-red-400"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...value, ""])}
          className="text-sm text-accent"
        >
          + добавить
        </button>
      </div>
    </Labeled>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border-gold bg-surface px-4 py-2 text-sm text-heading shadow-lg">
      {message}
    </div>
  );
}
