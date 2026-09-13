import { plural } from "@/lib/plural";
import { clsx } from "@/lib/clsx";

export function CoursePromo({
  threshold,
  price,
  className,
}: {
  threshold: number;
  price: number;
  className?: string;
}) {
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
      {price > 0 && (
        <p className="mt-2 text-sm leading-relaxed text-text/85">
          {threshold} {plural(threshold, ["занятие", "занятия", "занятий"])} —{" "}
          <span className="font-sub text-emerald-300">
            {(price * threshold).toLocaleString("ru-RU")} ₽
          </span>
          . Промокод на бесплатное занятие придёт в личный кабинет, выбрать
          время можно в течение месяца.
        </p>
      )}
    </div>
  );
}
