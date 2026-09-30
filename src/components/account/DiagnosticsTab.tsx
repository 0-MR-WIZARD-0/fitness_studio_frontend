"use client";

import { useEffect, useState } from "react";
import { MeasurementCard } from "@/components/clients/MeasurementCard";
import {
  SEX_LABEL,
  getProtocol,
  type ClientCardData,
  type Protocol,
} from "@/lib/clients";

export function DiagnosticsTab({ data }: { data: ClientCardData }) {
  const [protocol, setProtocol] = useState<Protocol | null>(null);

  useEffect(() => {
    getProtocol().then(setProtocol);
  }, []);

  if (!protocol) return <p className="text-text/60">Загрузка…</p>;

  const { card, measurements } = data;
  const bodyType = protocol.bodyTypes.find(
    (t) => t.value === card?.bodyType,
  )?.label;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-sub text-xl text-heading">
          Протокол функциональной диагностики
        </h2>
        <p className="mt-2 text-sm text-text/60">
          Замеры делает тренер. Ниже — ваша история: рядом с каждым показателем
          показано, как он изменился с прошлого раза.
        </p>
      </section>

      {card && (
        <dl className="grid gap-x-6 gap-y-2 rounded-2xl border-gold bg-surface/40 p-4 text-sm sm:grid-cols-2">
          {(
            [
              ["Пол", card.sex ? SEX_LABEL[card.sex] : null],
              [
                "Дата рождения",
                card.birthDate
                  ? new Date(card.birthDate).toLocaleDateString("ru-RU")
                  : null,
              ],
              ["Рост", card.heightCm ? `${card.heightCm} см` : null],
              ["Тип телосложения", bodyType ?? null],
            ] as [string, string | null][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-text/55">{label}</dt>
              <dd className="text-heading">{value ?? "—"}</dd>
            </div>
          ))}
          {card.note && (
            <div className="sm:col-span-2">
              <dt className="text-text/55">Заметка</dt>
              <dd className="whitespace-pre-line text-heading">{card.note}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="space-y-5">
        {measurements.map((m) => (
          <MeasurementCard key={m.id} protocol={protocol} card={card} m={m} />
        ))}
      </div>
    </div>
  );
}
