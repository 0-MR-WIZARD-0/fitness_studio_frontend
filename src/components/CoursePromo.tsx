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
  const savePerSession = price - coursePrice;
  const saveTotal = savePerSession * threshold;

  return (
    <div
      className={clsx(
        "mx-auto max-w-2xl rounded-2xl border border-emerald-400/50 bg-emerald-400/5 px-5 py-4 text-center",
        className,
      )}
    >
      <p className="font-sub text-emerald-300">
        Приобретаете {threshold}{" "}
        {plural(threshold, ["занятие", "занятия", "занятий"])} в неделю — дарим
        1 бесплатное в подарок.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text/85">
        Занятия можно брать из любых форматов.
        {discounted && (
          <>
            {" "}
            При этом цена занятия падает с{" "}
            <span className="text-text/60 line-through">
              {price.toLocaleString("ru-RU")} ₽
            </span>{" "}
            до{" "}
            <span className="font-sub text-emerald-300">
              {coursePrice.toLocaleString("ru-RU")} ₽
            </span>{" "}
            — экономия {saveTotal.toLocaleString("ru-RU")} ₽ за курс + 1
            бесплатное занятие.
          </>
        )}
      </p>
    </div>
  );
}
