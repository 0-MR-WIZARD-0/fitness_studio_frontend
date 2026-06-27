"use client";

import { useCallback, useEffect, useState } from "react";
import { mediaUrl, type Review, type ReviewStatus } from "@/lib/api";
import { adminReviews, deleteReview, moderateReview } from "@/lib/admin";
import { PageTitle, Toast } from "@/components/admin/ui";
import { clsx } from "@/lib/clsx";

const filters: { value: ReviewStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Все" },
  { value: "PENDING", label: "Ожидают" },
  { value: "APPROVED", label: "Одобрены" },
  { value: "REJECTED", label: "Отклонены" },
];

export default function AdminReviews() {
  const [filter, setFilter] = useState<ReviewStatus | "ALL">("PENDING");
  const [items, setItems] = useState<Review[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      adminReviews(filter === "ALL" ? undefined : filter).then(setItems),
    [filter],
  );
  useEffect(() => {
    reload();
  }, [reload]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="max-w-3xl">
      <PageTitle>Модерация отзывов</PageTitle>

      <div className="mb-6 flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-sm border-gold",
              filter === f.value ? "bg-accent text-bg" : "hover:bg-surface-2",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.map((r) => {
          const media = mediaUrl(r.mediaUrl);
          return (
            <div
              key={r.id}
              className="rounded-2xl border-gold bg-surface/50 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-sub text-heading">
                  {r.authorName}
                  {r.rating ? (
                    <span className="ml-2 text-accent">
                      {"★".repeat(r.rating)}
                    </span>
                  ) : null}
                </p>
                <span className="text-xs text-text/50">{r.status}</span>
              </div>
              <p className="mt-2 text-sm text-text/90">{r.text}</p>
              {media && r.mediaType === "IMAGE" && (
                <img
                  src={media}
                  alt=""
                  className="mt-3 h-40 rounded-lg object-cover"
                />
              )}
              {media && r.mediaType === "VIDEO" && (
                <video src={media} controls className="mt-3 h-40 rounded-lg" />
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={async () => {
                    await moderateReview(r.id, "APPROVED");
                    reload();
                    flash("Одобрено");
                  }}
                  className="btn-gold"
                >
                  Одобрить
                </button>
                <button
                  onClick={async () => {
                    await moderateReview(r.id, "REJECTED");
                    reload();
                    flash("Отклонено");
                  }}
                  className="rounded-lg border-gold px-4 text-sm"
                >
                  Отклонить
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Удалить отзыв?")) return;
                    await deleteReview(r.id);
                    reload();
                    flash("Удалено");
                  }}
                  className="text-sm text-red-400"
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-text/60">Нет отзывов.</p>}
      </div>
      <Toast message={toast} />
    </div>
  );
}
