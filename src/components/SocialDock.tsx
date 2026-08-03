"use client";

import { usePathname } from "next/navigation";
import { MaxIcon, TelegramIcon } from "./SocialIcons";

export function SocialDock({
  telegramUrl,
  maxUrl,
}: {
  telegramUrl: string;
  maxUrl: string;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  if (!telegramUrl && !maxUrl) return null;

  return (
    <div className="fixed bottom-8 right-5 z-30 hidden flex-col gap-3 md:flex">
      {telegramUrl && (
        <Bubble href={telegramUrl} label="Telegram-канал">
          <TelegramIcon className="h-5 w-5" />
        </Bubble>
      )}
      {maxUrl && (
        <Bubble href={maxUrl} label="Канал в MAX">
          <MaxIcon className="h-5 w-5" />
        </Bubble>
      )}
    </div>
  );
}

function Bubble({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="grid h-12 w-12 place-items-center rounded-full border border-accent/50 bg-surface/80 text-accent backdrop-blur-sm transition duration-300 hover:scale-105 hover:border-accent hover:bg-accent hover:text-bg"
    >
      {children}
    </a>
  );
}
