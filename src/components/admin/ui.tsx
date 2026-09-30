"use client";

import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/api";
import { clsx } from "@/lib/clsx";
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

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    if (!open) {
      const rect = trigger.current?.getBoundingClientRect();
      setUp(!!rect && window.innerHeight - rect.bottom < 240);
      setActive(
        Math.max(
          0,
          options.findIndex((o) => o.value === value),
        ),
      );
    }
    setOpen(!open);
  }

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) pick(options[active]?.value ?? value);
      else toggle();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        toggle();
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    }
  }

  const list = (
    <div
      role="listbox"
      className={clsx(
        "absolute inset-x-0 z-30 max-h-60 overflow-y-auto rounded-xl border-gold bg-surface py-1 shadow-xl",
        up ? "bottom-full mb-1" : "top-full mt-1",
      )}
    >
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="option"
          aria-selected={o.value === value}
          onMouseEnter={() => setActive(i)}
          onClick={() => pick(o.value)}
          className={clsx(
            "block w-full px-4 py-2 text-left text-sm transition",
            o.value === value
              ? "bg-accent/20 text-heading"
              : i === active
                ? "bg-surface-2 text-heading"
                : "text-text/80",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const control = (
    <div className="relative" ref={box}>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="field flex items-center justify-between gap-3 text-left"
      >
        <span className="truncate">{current?.label ?? ""}</span>
        <svg
          viewBox="0 0 12 8"
          aria-hidden
          className={clsx(
            "h-2 w-3 shrink-0 fill-none stroke-current stroke-2 text-text/70 transition-transform",
            open && "rotate-180",
          )}
        >
          <path d="M1 1.5 6 6.5 11 1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && list}
    </div>
  );

  return label ? <Labeled label={label}>{control}</Labeled> : control;
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border-gold bg-surface px-4 py-2 text-sm text-heading shadow-lg">
      {message}
    </div>
  );
}
