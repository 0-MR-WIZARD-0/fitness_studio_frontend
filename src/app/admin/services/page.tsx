"use client";

import { useEffect, useState } from "react";
import {
  adminServices,
  createService,
  deleteService,
  updateService,
} from "@/lib/admin";
import type { Service } from "@/lib/api";
import { PageTitle, Toast } from "@/components/admin/ui";
import { NumberInput } from "@/components/admin/NumberInput";
import { useAdmin } from "@/components/admin/AdminContext";

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminServices().then(setServices);
  useEffect(() => {
    reload();
  }, []);

  const changed = (m: string) => {
    reload();
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="max-w-4xl">
      <PageTitle>Дополнительные услуги</PageTitle>
      <p className="mt-2 mb-6 text-sm text-text/70">
        Услуги идут без расписания: клиент оставляет заявку, студия связывается
        сама. Почасовая запись есть только у залов.
      </p>

      <NewService
        nextOrder={services.length + 1}
        onCreated={() => changed("Услуга добавлена")}
      />

      {services.length > 0 ? (
        <div className="mt-6 space-y-3">
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} onChanged={changed} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-text/60">Услуг пока нет.</p>
      )}

      <Toast message={toast} />
    </div>
  );
}

function NewService({
  nextOrder,
  onCreated,
}: {
  nextOrder: number;
  onCreated: () => void;
}) {
  const empty = { title: "", description: "", price: 0 };
  const [draft, setDraft] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5">
      <p className="mb-4 font-sub text-heading">Новая услуга</p>
      <div className="grid items-start gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Название</span>
          <input
            className="field"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Планирование питания"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Цена, ₽</span>
          <NumberInput
            value={draft.price}
            onChange={(v) => setDraft({ ...draft, price: v })}
            min={0}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Комментарий</span>
          <input
            className="field"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="Что входит в услугу"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={async () => {
          setError(null);
          try {
            await createService({
              title: draft.title.trim(),
              description: draft.description,
              price: draft.price,
              order: nextOrder,
              isActive: true,
            });
            setDraft(empty);
            onCreated();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Не удалось сохранить");
          }
        }}
        disabled={!draft.title.trim()}
        className="btn-gold mt-4 disabled:opacity-40"
      >
        Добавить услугу
      </button>
    </div>
  );
}

function ServiceRow({
  service,
  onChanged,
}: {
  service: Service;
  onChanged: (message: string) => void;
}) {
  const { canEdit } = useAdmin();
  const mine = canEdit(service);
  const [draft, setDraft] = useState({
    title: service.title,
    description: service.description,
    price: service.price,
  });
  const [busy, setBusy] = useState(false);

  const changed =
    draft.title !== service.title ||
    draft.description !== service.description ||
    draft.price !== service.price;

  const save = async (patch?: { isActive?: boolean }) => {
    setBusy(true);
    try {
      await updateService(service.id, {
        title: draft.title.trim(),
        description: draft.description,
        price: draft.price,
        order: service.order,
        isActive: patch?.isActive ?? service.isActive,
      });
      onChanged("Услуга сохранена");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/30 p-4">
      <div className="grid items-start gap-3 md:grid-cols-3">
        <input
          className="field"
          value={draft.title}
          disabled={!mine}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        <NumberInput
          value={draft.price}
          onChange={(v) => setDraft({ ...draft, price: v })}
          min={0}
        />
        <input
          className="field"
          value={draft.description}
          disabled={!mine}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        {mine ? (
          <>
            <label className="flex items-center gap-2 text-text/80">
              <input
                type="checkbox"
                checked={service.isActive}
                onChange={(e) => save({ isActive: e.target.checked })}
              />
              Показывать на сайте
            </label>
            <button
              onClick={() => save()}
              disabled={busy || !changed || !draft.title.trim()}
              className="text-text/80 underline underline-offset-4 disabled:opacity-40"
            >
              Сохранить
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Удалить услугу «${service.title}»?`)) return;
                await deleteService(service.id);
                onChanged("Услуга удалена");
              }}
              className="text-red-400"
            >
              Удалить
            </button>
          </>
        ) : (
          <span className="text-text/50">
            Услуга создана другим сотрудником — изменить её может только он или
            главный администратор.
          </span>
        )}
      </div>
    </div>
  );
}
