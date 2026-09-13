"use client";

import { useEffect, useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  getDocuments,
  orderService,
  type Service,
  type StudioDocument,
} from "@/lib/api";
import { useAccount } from "../account/AccountProvider";
import {
  ClientCard,
  DocumentConsents,
  LoginRequired,
} from "../account/BookingGate";

export function ServiceOrder({ services }: { services: Service[] }) {
  const { user } = useAccount();
  const [picked, setPicked] = useState<Service | null>(null);
  const [documents, setDocuments] = useState<StudioDocument[]>([]);
  const [accepted, setAccepted] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ title: string; total: number } | null>(
    null,
  );

  useEffect(() => {
    getDocuments().then(setDocuments).catch(() => {});
  }, []);

  const docsAccepted = documents.every((d) => accepted.includes(d.id));

  if (done)
    return (
      <div className="mt-6 max-w-lg rounded-2xl border-gold bg-surface/60 p-6 text-center">
        <p className="text-xl text-heading">Заявка отправлена!</p>
        <p className="mt-3 text-sm">
          «{done.title}» ·{" "}
          {done.total > 0
            ? `${done.total.toLocaleString("ru-RU")} ₽`
            : "бесплатно"}
        </p>
        <p className="mt-2 text-sm text-text/70">
          Заявка появилась в личном кабинете, студия свяжется с вами.
        </p>
        <button onClick={() => setDone(null)} className="btn-gold mt-5">
          Заказать ещё
        </button>
      </div>
    );

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setPicked((prev) => (prev?.id === s.id ? null : s))}
            className={clsx(
              "rounded-2xl border p-5 text-left transition",
              picked?.id === s.id
                ? "border-accent bg-accent/10"
                : "border-[color-mix(in_srgb,var(--color-border)_40%,transparent)] bg-surface/40 hover:bg-surface",
            )}
          >
            <p className="font-sub text-lg text-heading">{s.title}</p>
            {s.description && (
              <p className="mt-2 text-sm leading-relaxed text-text/75">
                {s.description}
              </p>
            )}
            <p className="mt-3 text-accent">
              {s.price > 0
                ? `${s.price.toLocaleString("ru-RU")} ₽`
                : "бесплатно"}
            </p>
          </button>
        ))}
      </div>

      {picked && !user && <LoginRequired what="Заявка на услугу" />}

      {picked && user && (
        <div className="mt-6 max-w-md space-y-3">
          <p className="rounded-xl border-gold bg-surface/40 px-4 py-3 text-sm">
            Заявка на{" "}
            <span className="text-heading">«{picked.title}»</span> ·{" "}
            <span className="text-accent">
              {picked.price > 0
                ? `${picked.price.toLocaleString("ru-RU")} ₽`
                : "бесплатно"}
            </span>
          </p>

          <ClientCard user={user} />

          <DocumentConsents
            documents={documents}
            accepted={accepted}
            onToggle={(id, value) =>
              setAccepted((prev) =>
                value ? [...prev, id] : prev.filter((x) => x !== id),
              )
            }
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={async () => {
              setSubmitting(true);
              setError(null);
              try {
                const res = await orderService({
                  serviceId: picked.id,
                  documentIds: accepted,
                });
                setDone({ title: picked.title, total: res.total });
                setPicked(null);
                setAccepted([]);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Не удалось отправить заявку",
                );
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={!docsAccepted || submitting}
            className="btn-gold w-full disabled:opacity-40"
          >
            {submitting ? "Отправка…" : "Оставить заявку"}
          </button>
        </div>
      )}
    </>
  );
}
