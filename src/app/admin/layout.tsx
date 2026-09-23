"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { adminLogout, adminMe, type AdminUser } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { clsx } from "@/lib/clsx";
import { AdminProvider, TRAINER_PATHS } from "@/components/admin/AdminContext";

const groups = [
  {
    title: null,
    items: [{ href: "/admin/profile", label: "Профиль" }],
  },
  {
    title: "Содержимое сайта",
    items: [
      { href: "/admin/hero", label: "Главный экран" },
      { href: "/admin/faq", label: "Вопрос-ответ (табы)" },
      { href: "/admin/steps", label: "Шаги «Начни уже сегодня»" },
      { href: "/admin/formats", label: "Форматы" },
      { href: "/admin/survey", label: "Опрос (противопоказания)" },
      { href: "/admin/photos", label: "Фотографии студии" },
      { href: "/admin/settings", label: "Контакты студии" },
      { href: "/admin/documents", label: "Документы студии" },
    ],
  },
  {
    title: "Работа студии",
    items: [
      { href: "/admin/booking", label: "Расписание и запись" },
      { href: "/admin/trainers", label: "Тренеры" },
      { href: "/admin/halls", label: "Залы" },
      { href: "/admin/services", label: "Дополнительные услуги" },
      { href: "/admin/promo", label: "Промокоды" },
      { href: "/admin/reviews", label: "Отзывы" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [me, setMe] = useState<AdminUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLogin) return;
    adminMe()
      .then(({ user }) => {
        setMe(user);
        const allowed = TRAINER_PATHS.some((p) => pathname.startsWith(p));
        if (user.role === "TRAINER" && !allowed)
          router.replace("/admin/booking");
      })
      .catch(() => router.replace("/admin/login"));
  }, [isLogin, pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          me?.role === "OWNER" ||
          TRAINER_PATHS.some((p) => item.href.startsWith(p)),
      ),
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const reason = e.reason as unknown;
      if (reason instanceof ApiError && reason.status === 401) {
        router.replace("/admin/login");
        e.preventDefault();
        return;
      }
      const msg = reason instanceof Error ? reason.message : "Произошла ошибка";
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

  const blocked =
    me?.role === "TRAINER" &&
    !TRAINER_PATHS.some((p) => pathname.startsWith(p));
  if (!me || blocked) {
    return (
      <div className="grid min-h-screen place-items-center text-text/70">
        Проверка доступа…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-surface px-4 md:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Открыть меню"
          className="grid h-9 w-9 place-items-center rounded-lg border-gold"
        >
          <span className="relative block h-3 w-5">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-heading" />
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-heading" />
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-heading" />
          </span>
        </button>
        <span className="font-sub text-heading">Админка</span>
      </header>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 overlay-dim backdrop-blur-sm md:hidden"
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 overflow-y-auto border-r border-white/10 bg-surface p-5 transition-transform duration-300 ease-out",
          "md:static md:z-auto md:w-60 md:translate-x-0 md:bg-surface/40 md:transition-none",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMenuOpen(false)}
          aria-label="Закрыть меню"
          className="absolute right-3 top-3 text-2xl leading-none text-text/60 md:hidden"
        >
          ×
        </button>
        <Link href="/admin" className="font-sub text-lg text-heading">
          Админка
        </Link>
        <p className="mt-1 text-xs text-text/50">
          {me.username} · {me.role === "OWNER" ? "главный админ" : "тренер"}
        </p>
        <nav className="mt-6 space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.title ?? "account"}>
              {group.title && (
                <p className="mb-2 px-3 font-sub text-xs uppercase tracking-wider text-text/45">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((s) => (
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
              </div>
            </div>
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

      <div className="flex-1 overflow-x-hidden p-4 pt-20 md:p-10 md:pt-10">
        <AdminProvider value={me}>{children}</AdminProvider>
      </div>

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg border border-red-500/60 bg-surface px-4 py-3 text-sm text-red-300 shadow-lg">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
