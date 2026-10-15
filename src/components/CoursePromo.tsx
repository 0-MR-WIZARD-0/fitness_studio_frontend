import { plural } from "@/lib/plural";
import { clsx } from "@/lib/clsx";

const money = (value: number) => value.toLocaleString("ru-RU");

export function CoursePromo({
  threshold,
  prices = [],
  className,
}: {
  threshold: number;
  prices?: number[];
  className?: string;
}) {
  const paid = prices.filter((p) => p > 0);
  const base = paid.length ? Math.min(...paid) : 0;
  const same = new Set(paid).size === 1;
  const total = base * threshold;
  const full = base * (threshold + 1);
  const perLesson = Math.round(total / (threshold + 1) / 10) * 10;

  return (
    <div
      className={clsx(
        "mx-auto max-w-2xl rounded-2xl border border-emerald-400/50 bg-emerald-400/5 px-5 py-4 text-center",
        className,
      )}
    >
      <p className="font-sub text-emerald-300">
        Приобретаете {threshold}{" "}
        {plural(threshold, ["занятие", "занятия", "занятий"])} в неделю —{" "}
        {threshold + 1}-е в подарок!
      </p>
      {base > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-text/85">
          {same ? (
            "Всего "
          ) : (
            <>
              Например, занятия по{" "}
              <span className="font-sub text-emerald-300">
                {money(base)} ₽
              </span>{" "}
              — всего{" "}
            </>
          )}
          <span className="font-sub text-emerald-300">{money(total)} ₽</span>{" "}
          вместо{" "}
          <span className="text-text/60 line-through">{money(full)} ₽</span>.
          Цена за одно занятие снижается до{" "}
          <span className="font-sub text-emerald-300">
            {money(perLesson)} ₽
          </span>{" "}
          вместо{" "}
          <span className="text-text/60 line-through">{money(base)} ₽</span>.
        </p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-text/85">
        Промокод на бесплатное занятие придёт в личный кабинет. Действует на
        любые тренировки из расписания студии.
      </p>
    </div>
  );
}
