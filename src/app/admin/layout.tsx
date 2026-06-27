"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { adminLogout, adminMe } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { clsx } from "@/lib/clsx";

const sections = [
  { href: "/admin/hero", label: "Главный экран" },
  { href: "/admin/faq", label: "Вопрос-ответ (табы)" },
  { href: "/admin/steps", label: "Шаги «Начни уже сегодня»" },
  { href: "/admin/formats", label: "Форматы" },
  { href: "/admin/announcements", label: "Анонсы" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/booking", label: "Запись" },
  { href: "/admin/promo", label: "Промокоды" },
  { href: "/admin/settings", label: "Контакты студии" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [checked, setChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLogin) {
      setChecked(true);
      return;
    }
    adminMe()
      .then(() => setChecked(true))
      .catch(() => router.replace("/admin/login"));
  }, [isLogin, pathname, router]);

  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const reason = e.reason as unknown;
      if (reason instanceof ApiError && reason.status === 401) {
        router.replace("/admin/login");
        e.preventDefault();
        return;
      }
      const msg =
        reason instanceof Error ? reason.message : "Произошла ошибка";
      setErrorMsg(msg);
      e.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, [router]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  if (isLogin) return <>{children}</>;

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center text-text/70">
        Проверка доступа…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-white/10 bg-surface/40 p-5">
        <Link href="/admin" className="font-sub text-lg text-heading">
          Админка
        </Link>
        <nav className="mt-6 space-y-1">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={clsx(
                "block rounded-lg px-3 py-2 text-sm transition",
                pathname.startsWith(s.href)
                  ? "bg-accent/20 text-heading"
                  : "text-text/80 hover:bg-surface-2",
              )}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 space-y-2 border-t border-white/10 pt-4 text-sm">
          <Link href="/" className="block text-text/70 hover:text-heading">
            ← Вернуться на главную
          </Link>
          <button
            onClick={async () => {
              await adminLogout().catch(() => {});
              router.replace("/admin/login");
            }}
            className="text-text/70 hover:text-heading"
          >
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-x-hidden p-6 md:p-10">{children}</div>

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-red-500/60 bg-surface px-4 py-3 text-sm text-red-300 shadow-lg">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
