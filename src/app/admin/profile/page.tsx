"use client";

import { useEffect, useState } from "react";
import {
  getProfile,
  updateCredentials,
  updateProfile,
  type AdminProfile,
} from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => getProfile().then(setProfile);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  if (!profile) return <p className="text-text/60">Загружаем профиль…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <PageTitle>Профиль</PageTitle>

      <Credentials profile={profile} onSaved={flash} />
      <TrainerCard
        profile={profile}
        onSaved={(m) => {
          reload();
          flash(m);
        }}
      />

      <Toast message={toast} />
    </div>
  );
}

function Credentials({
  profile,
  onSaved,
}: {
  profile: AdminProfile;
  onSaved: (message: string) => void;
}) {
  const [username, setUsername] = useState(profile.username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginChanged = username.trim() !== profile.username;
  const wantsPassword = !!newPassword;
  const canSave =
    !!currentPassword &&
    (loginChanged || wantsPassword) &&
    (!wantsPassword || newPassword === repeat);

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5">
      <p className="mb-1 font-sub text-heading">Вход в админку</p>
      <p className="mb-4 text-xs text-text/50">
        {profile.role === "OWNER"
          ? "Вы главный администратор: доступны все разделы."
          : "Вы тренер: доступны расписание, анонсы, услуги, промокоды и отзывы."}{" "}
        Чтобы сменить логин или пароль, введите текущий пароль.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Логин" value={username} onChange={setUsername} />
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Текущий пароль</span>
          <input
            type="password"
            className="field"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Новый пароль</span>
          <input
            type="password"
            className="field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="оставьте пустым, если не меняете"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Новый пароль ещё раз</span>
          <input
            type="password"
            className="field"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          />
        </label>
      </div>

      {wantsPassword && newPassword !== repeat && (
        <p className="mt-3 text-sm text-red-400">Пароли не совпадают</p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await updateCredentials({
              currentPassword,
              ...(loginChanged ? { username: username.trim() } : {}),
              ...(wantsPassword ? { newPassword } : {}),
            });
            setCurrentPassword("");
            setNewPassword("");
            setRepeat("");
            onSaved("Данные для входа обновлены");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Не удалось сохранить");
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy || !canSave}
        className="btn-gold mt-4 disabled:opacity-40"
      >
        {busy ? "Сохраняем…" : "Сохранить"}
      </button>
    </div>
  );
}

function TrainerCard({
  profile,
  onSaved,
}: {
  profile: AdminProfile;
  onSaved: (message: string) => void;
}) {
  const [isTrainer, setIsTrainer] = useState(profile.isTrainer);
  const [draft, setDraft] = useState({
    name: profile.trainer?.name ?? "",
    role: profile.trainer?.role ?? "",
    description: profile.trainer?.description ?? "",
    photoUrl: profile.trainer?.photoUrl ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isTrainer}
          disabled={profile.role === "TRAINER"}
          onChange={(e) => setIsTrainer(e.target.checked)}
        />
        Тренер
      </label>
      <p className="mt-1 text-xs text-text/50">
        С этой отметкой вы появляетесь в списке тренеров: вас можно поставить на
        занятие, а карточка показывается на сайте.
      </p>

      {isTrainer && (
        <div className="mt-4 space-y-4">
          <TextField
            label="ФИО"
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <TextField
            label="Специализация (необязательно)"
            value={draft.role}
            onChange={(v) => setDraft({ ...draft, role: v })}
          />
          <TextArea
            label="О тренере (необязательно)"
            value={draft.description}
            onChange={(v) => setDraft({ ...draft, description: v })}
          />
          <ImageField
            label="Фото (необязательно)"
            value={draft.photoUrl}
            onChange={(url) => setDraft({ ...draft, photoUrl: url })}
            folder="trainers"
          />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await updateProfile({
              isTrainer,
              ...(isTrainer ? { ...draft, name: draft.name.trim() } : {}),
            });
            onSaved(isTrainer ? "Карточка тренера сохранена" : "Отметка снята");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Не удалось сохранить");
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy || (isTrainer && !draft.name.trim())}
        className="btn-gold mt-4 disabled:opacity-40"
      >
        {busy ? "Сохраняем…" : "Сохранить"}
      </button>
    </div>
  );
}
