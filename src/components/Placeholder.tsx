import { clsx } from "@/lib/clsx";
import { mediaUrl } from "@/lib/api";

export function Placeholder({
  src,
  alt = "",
  className,
  label,
  rounded = true,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  label?: string;
  rounded?: boolean;
}) {
  const url = mediaUrl(src);
  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-surface border-gold",
        rounded && "rounded-2xl",
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-text/40">
          <span className="font-sub text-sm">{label ?? "изображение"}</span>
        </div>
      )}
    </div>
  );
}
