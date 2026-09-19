"use client";

import { useState } from "react";

export function PasswordDialog({
  title,
  description,
  confirmLabel = "Удалить",
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overlay-dim backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border-gold bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-sub text-lg text-heading">{title}</p>
        {description && (
          <p className="mt-2 text-sm text-text/70">{description}</p>
        )}
        <label className="mt-4 block text-sm">
          <span className="mb-1 block text-text/80">Ваш пароль</span>
          <input
            type="password"
            className="field"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm(password);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Не удалось");
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy || !password}
            className="btn-gold disabled:opacity-40"
          >
            {busy ? "Проверяем…" : confirmLabel}
          </button>
          <button onClick={onClose} className="text-sm text-text/70">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
