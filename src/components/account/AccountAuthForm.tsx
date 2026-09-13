"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { accountLogin, accountRegister, type AccountUser } from "@/lib/api";
import {
  formatPhone,
  isValidEmail,
  isValidPhone,
  passwordIssues,
} from "@/lib/phone";

type Mode = "login" | "register";

export function AccountAuthForm({
  initialMode = "login",
  next = "/account",
  className,
  onSuccess,
}: {
  initialMode?: Mode;
  next?: string;
  className?: string;
  onSuccess?: (user: AccountUser) => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";
  const pwdIssues = passwordIssues(form.password);
  const canSubmit =
    isValidEmail(form.email) &&
    !!form.password &&
    (!isRegister ||
      (!!form.name.trim() && isValidPhone(form.phone) && !pwdIssues.length));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = isRegister
        ? await accountRegister({
            email: form.email.trim(),
            password: form.password,
            name: form.name.trim(),
            phone: form.phone,
          })
        : await accountLogin(form.email.trim(), form.password);
      if (onSuccess) {
        onSuccess(res.user);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={clsx(
        "max-w-md rounded-2xl border-gold bg-surface p-6",
        className ?? "mt-8",
      )}
    >
      <div className="flex gap-2 text-sm">
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={clsx(
              "flex-1 rounded-xl border px-3 py-2 transition",
              mode === m
                ? "border-accent bg-accent/15 text-heading"
                : "border-white/15 text-text/70 hover:bg-surface-2/50",
            )}
          >
            {m === "login" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {isRegister && (
          <>
            <input
              className="field"
              placeholder="ФИО полностью"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="field"
              inputMode="tel"
              placeholder="+7 (999) 999-99-99"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: formatPhone(e.target.value) })
              }
            />
            {form.phone && !isValidPhone(form.phone) && (
              <p className="text-xs text-red-400">Введите телефон полностью</p>
            )}
          </>
        )}

        <input
          className="field"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {form.email && !isValidEmail(form.email) && (
          <p className="text-xs text-red-400">
            Email вида имя@почта.ru — с «@» и точкой в домене
          </p>
        )}

        <input
          className="field"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder="Пароль"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit && !busy) void submit();
          }}
        />
        {isRegister &&
          (form.password ? (
            pwdIssues.length > 0 && (
              <p className="text-xs text-red-400">
                В пароле не хватает: {pwdIssues.join(", ")}
              </p>
            )
          ) : (
            <p className="text-xs text-text/55">
              Пароль: 8 символов и больше, заглавная и строчная буквы, цифра и
              специальный символ
            </p>
          ))}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={submit}
          disabled={!canSubmit || busy}
          className="btn-gold w-full disabled:opacity-40"
        >
          {busy
            ? "Подождите…"
            : isRegister
              ? "Зарегистрироваться"
              : "Войти"}
        </button>
      </div>
    </div>
  );
}
