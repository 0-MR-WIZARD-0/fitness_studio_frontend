"use client";

import { useEffect, useState } from "react";
import {
  addStudioPhoto,
  deleteStudioPhoto,
  updateStudioPhoto,
} from "@/lib/admin";
import { ImageField, PageTitle, Toast } from "@/components/admin/ui";
import { getStudioPhotos, mediaUrl, type StudioPhoto } from "@/lib/api";

export default function AdminPhotos() {
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => getStudioPhotos().then(setPhotos);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="max-w-4xl">
      <PageTitle>Фотографии студии</PageTitle>

      <div className="rounded-2xl border-gold bg-surface/50 p-5">
        <p className="mb-4 text-xs text-text/50">
          Показываются слайдером в блоке «Наша студия» на странице
          дополнительных услуг. По клику фото открывается в увеличенном виде.
          Порядок задаётся временем добавления, подпись необязательна.
        </p>

        <ImageField
          label="Добавить фото"
          value={null}
          onChange={async (url) => {
            if (!url) return;
            await addStudioPhoto({ url, order: photos.length + 1 });
            await reload();
            flash("Фото добавлено");
          }}
          folder="studio"
        />

        {photos.length === 0 ? (
          <p className="mt-4 text-sm text-text/60">Фотографий пока нет.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => (
              <PhotoCard
                key={p.id}
                photo={p}
                onChanged={(m) => {
                  reload();
                  flash(m);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </div>
  );
}

function PhotoCard({
  photo,
  onChanged,
}: {
  photo: StudioPhoto;
  onChanged: (message: string) => void;
}) {
  const [caption, setCaption] = useState(photo.caption);
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-surface/30 p-3">
      <div className="relative aspect-video overflow-hidden rounded-xl border-gold bg-surface">
        <img
          src={mediaUrl(photo.url) ?? ""}
          alt={photo.caption}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <input
        className="field mt-3"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Подпись (необязательно)"
      />

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <button
          onClick={async () => {
            setBusy(true);
            try {
              await updateStudioPhoto(photo.id, {
                url: photo.url,
                caption,
                order: photo.order,
              });
              onChanged("Подпись сохранена");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy || caption === photo.caption}
          className="text-text/80 underline underline-offset-4 disabled:opacity-40"
        >
          Сохранить
        </button>
        <button
          onClick={async () => {
            if (!confirm("Удалить фото?")) return;
            await deleteStudioPhoto(photo.id);
            onChanged("Фото удалено");
          }}
          className="text-red-400"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
