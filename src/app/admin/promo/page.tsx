"use client";

import { useEffect, useState } from "react";
import {
  adminPromos,
  deletePromo,
  generatePromo,
  updatePromoExpiry,
  type PromoCode,
} from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";
import { clsx } from "@/lib/clsx";

export default function AdminPromo() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const reload = () => adminPromos().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  async function generate() {
    const p = await generatePromo();
    await reload();
    flash(`Создан: ${p.code}`);
  }

  async function saveExpiry() {
    if (!editing) return;
    const d = new Date(editing.value);
    d.setHours(23, 59, 59, 0);
    await updatePromoExpiry(editing.id, d.toISOString());
    setEditing(null);
    reload();
    flash("Срок перенесён");
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const isExpired = (iso: string) => new Date(iso).getTime() < now;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Промокоды</PageTitle>
        <button onClick={generate} className="btn-gold">
          Сгенерировать промокод
        </button>
      </div>
      <p className="mb-5 text-sm text-text/60">
        Единоразовые, действуют 30 дней. Пользователь вводит код при записи и
        записывается бесплатно. <span className="text-accent">GIFT</span> —
        подарок за курс (хранит данные пользователя). Срок можно перенести,
        иначе код сгорает и удаляется.
      </p>

      <div className="space-y-2">
        {items.map((p) => {
          const expired = isExpired(p.expiresAt);
          return (
            <div
              key={p.id}
              className="rounded-xl border-gold bg-surface/40 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-heading">{p.code}</span>
                  <span
                    className={clsx(
                      "ml-3 rounded px-2 py-0.5 text-xs",
                      p.kind === "GIFT"
                        ? "bg-accent/20 text-accent"
                        : "bg-white/10 text-text/70",
                    )}
                  >
                    {p.kind === "GIFT" ? "подарок" : "обычный"}
                  </span>
                  {p.isUsed ? (
                    <span className="ml-2 text-xs text-red-400">
                      использован
                    </span>
                  ) : expired ? (
                    <span className="ml-2 text-xs text-red-400">истёк</span>
                  ) : (
                    <span className="ml-2 text-xs text-text/60">
                      действует до {fmt(p.expiresAt)}
                    </span>
                  )}
                  {p.kind === "GIFT" && (p.name || p.email) && (
                    <div className="mt-1 text-xs text-text/60">
                      {p.name} · {p.phone} {p.email ? `· ${p.email}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button
                    onClick={() =>
                      setEditing({
                        id: p.id,
                        value: new Date(p.expiresAt)
                          .toISOString()
                          .slice(0, 10),
                      })
                    }
                    className="text-text/70 hover:text-heading"
                  >
                    перенести срок
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Удалить промокод?")) return;
                      await deletePromo(p.id);
                      reload();
                    }}
                    className="text-red-400"
                  >
                    удалить
                  </button>
                </div>
              </div>

              {editing?.id === p.id && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="date"
                    className="field"
                    value={editing.value}
                    onChange={(e) =>
                      setEditing({ id: p.id, value: e.target.value })
                    }
                  />
                  <button onClick={saveExpiry} className="btn-gold">
                    ОК
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-text/60">Промокодов нет.</p>}
      </div>
      <Toast message={toast} />
    </div>
  );
}
