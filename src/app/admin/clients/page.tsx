"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTitle } from "@/components/admin/ui";
import { listClients, type ClientRow } from "@/lib/clients";

const dayOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU") : null;

export default function AdminClients() {
  const [items, setItems] = useState<ClientRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      listClients(query)
        .then(setItems)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle>Клиенты</PageTitle>
        <Link href="/admin/clients/tests" className="btn-gold">
          Тесты диагностики
        </Link>
      </div>

      <p className="mb-4 text-sm text-text/60">
        Анкета функциональной диагностики заводится на клиента с аккаунтом.
        Заполнять и править её может любой тренер, каждый замер подписан
        автором.
      </p>

      <input
        className="field mb-5"
        value={query}
        placeholder="Поиск по имени, телефону или почте"
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="space-y-2">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clients/${c.id}`}
            className="block rounded-xl border-gold bg-surface/40 px-4 py-3 transition hover:bg-surface-2/60"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-heading">{c.name}</p>
                <p className="truncate text-xs text-text/55">
                  {c.phone || "телефон не указан"} · {c.email}
                </p>
              </div>
              <p className="shrink-0 text-xs text-text/60 sm:text-right">
                {c.measurements > 0
                  ? `замеров: ${c.measurements} · последний ${dayOf(c.lastAt)}`
                  : c.hasCard
                    ? "карточка заведена, замеров нет"
                    : "анкеты нет"}
              </p>
            </div>
          </Link>
        ))}

        {!loading && items.length === 0 && (
          <p className="text-text/60">
            {query.trim()
              ? "Никого не нашли — попробуйте другой запрос."
              : "Пока нет зарегистрированных клиентов."}
          </p>
        )}
      </div>
    </div>
  );
}
