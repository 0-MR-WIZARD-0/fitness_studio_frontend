import type { Service, ServicePeriod } from "./api";

export interface PeriodOption {
  value: ServicePeriod;
  label: string;
  price: number;
}

export function servicePeriods(service: Service): PeriodOption[] {
  if (service.isFree)
    return [{ value: "single", label: "бесплатно", price: 0 }];

  const all: [ServicePeriod, string, number | null][] = [
    ["single", "разово", service.price > 0 ? service.price : null],
    ["week", "неделя", service.priceWeek],
    ["month", "месяц", service.priceMonth],
  ];

  const found = all
    .filter(([, , price]) => price != null)
    .map(([value, label, price]) => ({ value, label, price: price as number }));

  return found.length
    ? found
    : [{ value: "single", label: "бесплатно", price: 0 }];
}

export const priceLabel = (price: number) =>
  price > 0 ? `${price.toLocaleString("ru-RU")} ₽` : "бесплатно";
