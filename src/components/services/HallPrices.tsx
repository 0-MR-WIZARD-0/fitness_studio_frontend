import type { Hall } from "@/lib/api";

const money = (value: number) => value.toLocaleString("ru-RU");

export function HallPrices({ hall }: { hall: Hall }) {
  const rows: { label: string; price: number; hours?: number }[] = [
    { label: "Разовое посещение", price: hall.priceSingle },
    { label: "Месячный доступ: 4 часа", price: hall.price4, hours: 4 },
    { label: "Месячный доступ: 8 часов", price: hall.price8, hours: 8 },
    { label: "Месячный доступ: 12 часов", price: hall.price12, hours: 12 },
  ].filter((r) => r.price > 0);

  const link = hall.bookingUrl ? (
    <p className="mt-4 text-sm">
      Арендовать зал можно{" "}
      <a
        href={hall.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-4"
      >
        по ссылке
      </a>
    </p>
  ) : null;

  if (!rows.length)
    return (
      <div className="rounded-2xl border-gold bg-surface/40 p-5">
        <p className="font-sub text-xl text-heading">{hall.title}</p>
        {hall.description && (
          <p className="mt-2 text-sm text-text/75">{hall.description}</p>
        )}
        {link}
      </div>
    );

  return (
    <div className="rounded-2xl border-gold bg-surface/40 p-5">
      <p className="font-sub text-xl text-heading">{hall.title}</p>
      {hall.description && (
        <p className="mt-2 text-sm leading-relaxed text-text/75">
          {hall.description}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-sub text-heading">
              <th className="py-2 pr-4 font-normal">Тариф</th>
              <th className="py-2 pr-4 font-normal">Цена за час</th>
              <th className="py-2 font-normal">Выгода</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const benefit = r.hours
                ? Math.max(0, hall.priceSingle - r.price) * r.hours
                : 0;
              return (
                <tr key={r.label} className="border-t border-white/10">
                  <td className="py-2 pr-4">{r.label}</td>
                  <td className="py-2 pr-4 whitespace-nowrap text-heading">
                    {money(r.price)} ₽
                  </td>
                  <td className="py-2 whitespace-nowrap text-accent">
                    {benefit > 0 ? `${money(benefit)} ₽` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-text/55">
        Аренда с {hall.dayStart} до {hall.dayEnd}.{" "}
        {hall.isMain
          ? "Свободные часы видны в расписании ниже."
          : hall.bookingUrl
            ? "Свободное время подскажем в переписке."
            : "Время этого зала выставляет студия — напишите нам."}
      </p>
      {link}
    </div>
  );
}
