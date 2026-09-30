"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Labeled,
  PageTitle,
  SelectField,
  TextArea,
  Toast,
} from "@/components/admin/ui";
import { onlyDigits } from "@/lib/number-input";
import { useAdmin } from "@/components/admin/AdminContext";
import { MeasurementCard, dayOf } from "@/components/clients/MeasurementCard";
import { MeasurementForm } from "@/components/clients/MeasurementForm";
import { PrintReport } from "@/components/clients/PrintReport";
import { getSettings, type SiteSettings } from "@/lib/api";
import {
  addMeasurement,
  deleteMeasurement,
  getClientCard,
  getProtocol,
  saveClientCard,
  updateMeasurement,
  type CardDraft,
  type ClientCardData,
  type Measurement,
  type Protocol,
} from "@/lib/clients";

const isoDay = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

export default function AdminClientCard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const userId = Number(id);
  const { admin, isOwner } = useAdmin();

  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [data, setData] = useState<ClientCardData | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studio, setStudio] = useState<SiteSettings | null>(null);
  const [printing, setPrinting] = useState<number | null>(null);

  useEffect(() => {
    getProtocol().then(setProtocol);
    getClientCard(userId).then(setData);
    getSettings()
      .then(setStudio)
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (printing == null) return;
    const timer = setTimeout(() => {
      window.print();
      setPrinting(null);
    }, 60);
    return () => clearTimeout(timer);
  }, [printing]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  if (!protocol || !data) return <p className="text-text/60">Загрузка…</p>;

  const { user, card, measurements } = data;
  const canDelete = (m: Measurement) =>
    isOwner || (!!admin && m.createdById === admin.id);

  const index = measurements.findIndex((m) => m.id === printing);
  const report = index >= 0 ? measurements[index] : null;

  return (
    <div className="max-w-3xl">
      {report && (
        <PrintReport
          studio={studio}
          user={user}
          card={card}
          protocol={protocol}
          m={report}
          prev={measurements[index + 1] ?? null}
        />
      )}

      <div className="print:hidden">
        <Link
          href="/admin/clients"
          className="mb-3 inline-block text-sm text-text/60 hover:text-heading"
        >
          ← Все клиенты
        </Link>

        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageTitle>{user.name}</PageTitle>
            <p className="-mt-4 text-sm text-text/55">
              {user.phone || "телефон не указан"} · {user.email}
            </p>
          </div>
          <button
            onClick={() => setPrinting(measurements[0]?.id ?? null)}
            disabled={!measurements.length}
            className="btn-gold disabled:opacity-40"
            type="button"
            title={
              measurements.length
                ? "Печать последнего протокола"
                : "Печатать нечего: замеров ещё нет"
            }
          >
            Печать протокола
          </button>
        </div>

        <CardForm
          protocol={protocol}
          data={data}
          onSaved={(next) => {
            setData(next);
            flash("Карточка сохранена");
          }}
        />

        <div className="mt-8 mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-sub text-xl text-heading">
            Замеры{measurements.length ? ` · ${measurements.length}` : ""}
          </h2>
          <button
            onClick={() => setEditing("new")}
            disabled={editing === "new"}
            className="btn-gold disabled:opacity-40"
          >
            + Новый замер
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {editing === "new" && (
          <div className="mb-5">
            <MeasurementForm
              protocol={protocol}
              initial={null}
              onCancel={() => setEditing(null)}
              onSave={async (draft) => {
                setData(await addMeasurement(userId, draft));
                setEditing(null);
                flash("Замер добавлен");
              }}
            />
          </div>
        )}

        <div className="space-y-5">
          {measurements.map((m) =>
            editing === m.id ? (
              <MeasurementForm
                key={m.id}
                protocol={protocol}
                initial={m}
                onCancel={() => setEditing(null)}
                onSave={async (draft) => {
                  setData(await updateMeasurement(m.id, draft));
                  setEditing(null);
                  flash("Замер сохранён");
                }}
              />
            ) : (
              <MeasurementCard
                key={m.id}
                protocol={protocol}
                card={card}
                m={m}
                actions={
                  <div className="flex shrink-0 flex-wrap items-center gap-4 text-sm">
                    <button
                      onClick={() => setEditing(m.id)}
                      className="text-text/70 hover:text-heading"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => setPrinting(m.id)}
                      className="text-text/70 hover:text-heading"
                    >
                      Печать
                    </button>
                    {canDelete(m) && (
                      <button
                        onClick={async () => {
                          if (!confirm(`Удалить замер от ${dayOf(m.takenAt)}?`))
                            return;
                          setError(null);
                          try {
                            setData(await deleteMeasurement(m.id));
                            flash("Замер удалён");
                          } catch (e) {
                            setError(
                              e instanceof Error
                                ? e.message
                                : "Не удалось удалить",
                            );
                          }
                        }}
                        className="text-red-400"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                }
              />
            ),
          )}

          {measurements.length === 0 && editing !== "new" && (
            <p className="text-text/60">
              Замеров пока нет. Заполните карточку и добавьте первый протокол.
            </p>
          )}
        </div>

        <Toast message={toast} />
      </div>
    </div>
  );
}

function CardForm({
  protocol,
  data,
  onSaved,
}: {
  protocol: Protocol;
  data: ClientCardData;
  onSaved: (next: ClientCardData) => void;
}) {
  const card = data.card;
  const [draft, setDraft] = useState<CardDraft>({
    sex: card?.sex ?? null,
    birthDate: isoDay(card?.birthDate ?? null) || null,
    heightCm: card?.heightCm ?? null,
    bodyType: card?.bodyType ?? null,
    note: card?.note ?? "",
  });
  const [height, setHeight] = useState(
    card?.heightCm == null ? "" : String(card.heightCm),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const missing = [
    !draft.heightCm && "рост",
    !draft.sex && "пол",
    !draft.birthDate && "дата рождения",
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border-gold bg-surface/40 p-4 sm:p-5">
      <h2 className="mb-1 font-sub text-xl text-heading">Карточка</h2>
      <p className="mb-4 text-sm text-text/55">
        Постоянные данные. Без них не посчитать Т/Р, ИМТ и идеальный вес.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Пол"
          value={draft.sex ?? ""}
          options={[
            { value: "", label: "Не указан" },
            { value: "FEMALE", label: "Женский" },
            { value: "MALE", label: "Мужской" },
          ]}
          onChange={(v) =>
            setDraft({ ...draft, sex: (v || null) as CardDraft["sex"] })
          }
        />

        <Labeled label="Дата рождения">
          <input
            className="field"
            type="date"
            value={draft.birthDate ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, birthDate: e.target.value || null })
            }
          />
        </Labeled>

        <Labeled label="Рост, см">
          <input
            className="field"
            inputMode="decimal"
            value={height}
            placeholder="—"
            onChange={(e) => setHeight(onlyDigits(e.target.value))}
          />
        </Labeled>

        <SelectField
          label="Тип телосложения"
          value={draft.bodyType ?? ""}
          options={[
            { value: "", label: "Не указан" },
            ...protocol.bodyTypes.map((t) => ({
              value: t.value as string,
              label: t.label,
            })),
          ]}
          onChange={(v) =>
            setDraft({
              ...draft,
              bodyType: (v || null) as CardDraft["bodyType"],
            })
          }
        />
      </div>

      <div className="mt-3">
        <TextArea
          label="Заметка (противопоказания, особенности)"
          rows={2}
          value={draft.note}
          onChange={(note) => setDraft({ ...draft, note })}
        />
      </div>

      {missing.length > 0 && (
        <p className="mt-3 text-xs text-amber-300/80">
          Не заполнено: {missing.join(", ")}. Часть расчётов будет недоступна.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          disabled={saving}
          className="btn-gold disabled:opacity-40"
          onClick={async () => {
            setError(null);
            const clean = height.trim().replace(",", ".");
            const value = clean ? Number(clean) : null;
            if (clean && !Number.isFinite(value)) {
              setError("Рост: введите число");
              return;
            }
            setSaving(true);
            try {
              const next = await saveClientCard(data.user.id, {
                ...draft,
                heightCm: value,
              });
              setDraft((prev) => ({ ...prev, heightCm: value }));
              onSaved(next);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось сохранить");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Сохраняем…" : "Сохранить карточку"}
        </button>
        {card?.updatedBy && (
          <span className="text-xs text-text/45">
            правил {card.updatedBy}, {dayOf(card.updatedAt)}
          </span>
        )}
      </div>
    </section>
  );
}
