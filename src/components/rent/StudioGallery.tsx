"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SnapCarousel } from "../SnapCarousel";
import { clsx } from "@/lib/clsx";
import { mediaUrl, type StudioPhoto } from "@/lib/api";

export function StudioGallery({ photos }: { photos: StudioPhoto[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = photos.find((p) => p.id === openId) ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!photos.length) return null;

  const step = (delta: number) => {
    const i = photos.findIndex((p) => p.id === openId);
    if (i < 0) return;
    const next = photos[(i + delta + photos.length) % photos.length];
    setOpenId(next.id);
  };

  return (
    <div>
      <h2 className="font-sub text-lg text-heading md:text-xl">Наша студия</h2>

      <SnapCarousel
        items={photos}
        keyOf={(p) => p.id}
        labelOf={(p, i) => p.caption || `Фото ${i + 1}`}
        className="mt-4"
        itemClassName="w-[78%] sm:w-[52%] md:w-[38%] lg:w-[31%]"
        trackClassName="-mx-5 px-[11vw] md:mx-0 md:px-0"
        renderItem={(p) => (
          <Photo photo={p} onOpen={() => setOpenId(p.id)} />
        )}
      />

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4"
          onClick={() => setOpenId(null)}
        >
          <figure
            className="max-h-[90vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={mediaUrl(open.url) ?? ""}
              alt={open.caption}
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            {open.caption && (
              <figcaption className="mt-3 text-center text-sm text-heading/85">
                {open.caption}
              </figcaption>
            )}
          </figure>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Предыдущее фото"
                className="absolute left-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-2xl text-heading/85 hover:text-heading md:left-8"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Следующее фото"
                className="absolute right-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-2xl text-heading/85 hover:text-heading md:right-8"
              >
                ›
              </button>
            </>
          )}

          <button
            onClick={() => setOpenId(null)}
            aria-label="Закрыть"
            className="absolute right-5 top-5 text-3xl leading-none text-heading/80 hover:text-heading"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function Photo({
  photo,
  onOpen,
}: {
  photo: StudioPhoto;
  onOpen: () => void;
}) {
  const src = mediaUrl(photo.url);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={clsx(
        "relative block aspect-video w-full overflow-hidden rounded-2xl border-gold bg-surface",
        "transition hover:opacity-90",
      )}
    >
      {src && (
        <Image
          src={src}
          alt={photo.caption}
          fill
          sizes="(max-width: 768px) 78vw, 38vw"
          className="object-cover"
        />
      )}
      {photo.caption && (
        <span className="absolute inset-x-0 bottom-0 bg-black/50 px-3 py-2 text-left text-xs text-heading">
          {photo.caption}
        </span>
      )}
    </button>
  );
}
