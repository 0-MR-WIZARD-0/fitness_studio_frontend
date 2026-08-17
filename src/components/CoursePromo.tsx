import { plural } from "@/lib/plural";
import { clsx } from "@/lib/clsx";

export function CoursePromo({
  threshold,
  price,
  coursePrice,
  className,
}: {
  threshold: number;
  price: number;
  coursePrice: number;
  className?: string;
}) {
  const discounted = coursePrice > 0 && coursePrice < price;

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
      {discounted && (
        <p className="mt-2 text-sm leading-relaxed text-text/85">
          Цена каждого занятия снижается до{" "}
          <span className="font-sub text-emerald-300">
            {coursePrice.toLocaleString("ru-RU")} ₽
          </span>{" "}
          (вместо {price.toLocaleString("ru-RU")} ₽). Действует на любые
          тренировки из расписания студии.
        </p>
      )}
    </div>
  );
}
