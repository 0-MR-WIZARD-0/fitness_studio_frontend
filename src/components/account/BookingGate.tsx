"use client";

import Link from "next/link";
import { mediaUrl, type AccountUser, type StudioDocument } from "@/lib/api";
import { useAccount } from "./AccountProvider";

export function LoginRequired({ what }: { what: string }) {
  const { openAuth } = useAccount();
  return (
    <div className="mt-6 max-w-xl rounded-2xl border-gold bg-surface/50 p-5 text-sm leading-relaxed">
      <p className="font-sub text-lg text-heading">Нужен вход в кабинет</p>
      <p className="mt-2 text-text/80">
        {what} доступна после входа. В личном кабинете видны все ваши записи,
        промокоды, перенос и отмена.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => openAuth("login")} className="btn-gold">
          Войти
        </button>
        <button
          onClick={() => openAuth("register")}
          className="self-center text-accent underline underline-offset-4"
        >
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
}

export function ClientCard({ user }: { user: AccountUser }) {
  return (
    <div className="rounded-xl bg-surface-2/60 px-4 py-3 text-sm">
      <span className="text-text/70">Записываем как </span>
      <span className="text-heading">{user.name}</span>
      <span className="text-text/70">
        {" · "}
        {user.phone}
        {" · "}
        {user.email}
      </span>
      <Link
        href="/account"
        className="ml-2 text-accent underline underline-offset-4"
      >
        изменить
      </Link>
    </div>
  );
}

export function DocumentConsents({
  documents,
  accepted,
  onToggle,
}: {
  documents: StudioDocument[];
  accepted: number[];
  onToggle: (id: number, value: boolean) => void;
}) {
  if (!documents.length) return null;
  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <label key={doc.id} className="flex items-start gap-2 text-sm text-text/80">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted.includes(doc.id)}
            onChange={(e) => onToggle(doc.id, e.target.checked)}
          />
          <span>
            Я ознакомлен(а) с документом{" "}
            <a
              href={mediaUrl(doc.fileUrl) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              «{doc.title}»
            </a>
          </span>
        </label>
      ))}
    </div>
  );
}
