"use client";

import { useState } from "react";
import { api, API_BASE, type MediaType } from "@/lib/api";
import { clsx } from "@/lib/clsx";

export function SubmitReview() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gold">
        Оставить отзыв
      </button>
      {open && <ReviewModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ReviewModal({ onClose }: { onClose: () => void }) {
  const [authorName, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      let mediaUrl: string | undefined;
      let mediaType: MediaType = "NONE";

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${API_BASE}/uploads`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Не удалось загрузить файл");
        const up = (await res.json()) as { url: string; mediaType: MediaType };
        mediaUrl = up.url;
        mediaType = up.mediaType;
      }

      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({ authorName, text, rating, mediaUrl, mediaType }),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border-gold bg-surface p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-2xl">Ваш отзыв</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-text/60 hover:text-heading"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="text-heading text-lg">Спасибо!</p>
            <p className="text-sm">
              Отзыв отправлен на модерацию и появится после одобрения.
            </p>
            <button onClick={onClose} className="btn-gold mt-2">
              Готово
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <input
              className="field"
              placeholder="Имя"
              value={authorName}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="field min-h-28"
              placeholder="Поделитесь впечатлением"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHover(0)}
            >
              <span className="mr-1 text-sm text-text/80">Оценка:</span>
              {[1, 2, 3, 4, 5].map((n) => {
                const lit = n <= (hover || rating);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    aria-label={`${n} из 5`}
                    className={clsx(
                      "text-2xl transition-transform duration-150",
                      lit ? "text-accent" : "text-text/30",
                      hover === n && "scale-125",
                      hover > 0 && n <= hover && "drop-shadow-[0_0_6px_rgba(195,148,74,0.6)]",
                    )}
                  >
                    ★
                  </button>
                );
              })}
            </div>
            <label className="block text-sm text-text/80">
              Фото или видео (необязательно):
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-heading"
              />
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={submit}
              disabled={!authorName || !text || submitting}
              className="btn-gold w-full disabled:opacity-40"
            >
              {submitting ? "Отправка…" : "Отправить на модерацию"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
