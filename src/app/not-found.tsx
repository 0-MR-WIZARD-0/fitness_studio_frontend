import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="font-heading text-7xl md:text-9xl font-bold text-accent">
          404
        </p>
        <h1 className="mt-4 text-2xl md:text-3xl">Страница не найдена</h1>
        <p className="mx-auto mt-3 max-w-md text-text/80">
          Возможно, ссылка устарела или страницы не существует. Вернитесь на
          главную или выберите формат.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-gold">
            На главную
          </Link>
          <Link
            href="/formats"
            className="inline-flex items-center rounded-xl border-gold px-6 py-3 font-sub text-heading transition hover:bg-surface-2"
          >
            Форматы
          </Link>
        </div>
      </div>
    </div>
  );
}
