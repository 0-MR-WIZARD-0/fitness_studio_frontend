"use client";

import { useEffect, useState } from "react";
import {
  adminTrainers,
  createTrainerAccount,
  deleteTrainer,
  grantTrainerAccess,
  resetTrainerPassword,
  revokeTrainerAccess,
  updateTrainer,
  type AdminTrainer,
} from "@/lib/admin";
import {
  ImageField,
  PageTitle,
  TextArea,
  TextField,
  Toast,
} from "@/components/admin/ui";
import { MoveButtons } from "@/components/admin/MoveButtons";

export default function AdminTrainers() {
  const [items, setItems] = useState<AdminTrainer[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminTrainers().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    await Promise.all([
      updateTrainer(a.id, { ...a, order: b.order }),
      updateTrainer(b.id, { ...b, order: a.order }),
    ]);
    await reload();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <PageTitle>Тренеры</PageTitle>
        <button
          onClick={() => setAdding(true)}
          disabled={adding}
          className="btn-gold disabled:opacity-40"
        >
          + Новый тренер
        </button>
      </div>
      <p className="-mt-4 mb-6 text-sm text-text/70">
        Тренер с доступом сам ведёт своё расписание, анонсы, услуги, промокоды и
        отзывы. Чужие занятия и анонсы он не меняет и не удаляет. Остальное
        тренер заполняет в своём профиле, а вы можете поправить здесь.
      </p>

      {adding && (
        <NewTrainerForm
          onCancel={() => setAdding(false)}
          onCreated={(m) => {
            setAdding(false);
            reload();
            flash(m);
          }}
        />
      )}

      <div className="space-y-5">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="pt-5">
              <MoveButtons
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                disableUp={i === 0}
                disableDown={i === items.length - 1}
              />
            </div>
            <div className="flex-1">
              <TrainerCard
                item={item}
                onSaved={(m) => {
                  reload();
                  flash(m);
                }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && !adding && (
          <p className="text-text/60">Пока пусто.</p>
        )}
      </div>
      <Toast message={toast} />
    </div>
  );
}

function NewTrainerForm({
  onCreated,
  onCancel,
}: {
  onCreated: (message: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState({ name: "", username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mb-6 rounded-2xl border-gold bg-surface/50 p-5 space-y-3">
      <p className="font-sub text-heading">Новый тренер с доступом</p>
      <TextField
        label="ФИО"
        value={draft.name}
        onChange={(v) => setDraft({ ...draft, name: v })}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="Логин"
          value={draft.username}
          onChange={(v) => setDraft({ ...draft, username: v })}
        />
        <label className="text-sm">
          <span className="mb-1 block text-text/80">Пароль</span>
          <input
            type="text"
            className="field"
            value={draft.password}
            onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            placeholder="8+ символов, буквы разного регистра, цифра, символ"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4">
        <button
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await createTrainerAccount({
                name: draft.name.trim(),
                username: draft.username.trim(),
                password: draft.password,
              });
              onCreated("Тренер создан, передайте ему логин и пароль");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Не удалось создать");
            } finally {
              setBusy(false);
            }
          }}
          disabled={
            busy ||
            !draft.name.trim() ||
            !draft.username.trim() ||
            !draft.password
          }
          className="btn-gold disabled:opacity-40"
        >
          {busy ? "Создаём…" : "Создать"}
        </button>
        <button onClick={onCancel} className="text-sm text-text/70">
          Отмена
        </button>
      </div>
    </div>
  );
}

function TrainerCard({
  item,
  onSaved,
}: {
  item: AdminTrainer;
  onSaved: (m: string) => void;
}) {
  const [draft, setDraft] = useState(item);
  const [access, setAccess] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwnerCard = item.admin?.role === "OWNER";

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSaved(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border-gold bg-surface/50 p-5 space-y-3">
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
        rows={3}
      />
      <ImageField
        label="Фото"
        value={draft.photoUrl}
        onChange={(url) => setDraft({ ...draft, photoUrl: url })}
        folder="trainers"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
        />
        Активен (можно назначать на занятия)
      </label>

      <div className="rounded-xl border border-white/10 bg-surface/40 p-4 text-sm">
        {isOwnerCard ? (
          <p className="text-text/70">
            Это ваша карточка главного администратора. Снять её можно отметкой
            «Тренер» в профиле.
          </p>
        ) : item.admin ? (
          <div className="space-y-2">
            <p className="text-text/80">
              Вход в админку:{" "}
              <span className="text-heading">{item.admin.username}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                className="field max-w-xs"
                value={access.password}
                onChange={(e) =>
                  setAccess({ ...access, password: e.target.value })
                }
                placeholder="новый пароль"
              />
              <button
                onClick={() =>
                  run(
                    () => resetTrainerPassword(item.id, access.password),
                    "Пароль сброшен, тренер вошёл заново",
                  ).then(() => setAccess({ username: "", password: "" }))
                }
                disabled={busy || !access.password}
                className="text-text/80 underline underline-offset-4 disabled:opacity-40"
              >
                Сбросить пароль
              </button>
              <button
                onClick={() => {
                  if (!confirm("Закрыть тренеру вход в админку?")) return;
                  run(() => revokeTrainerAccess(item.id), "Вход закрыт");
                }}
                disabled={busy}
                className="text-red-400"
              >
                Закрыть вход
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-text/70">Вход в админку не настроен.</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="field max-w-[12rem]"
                value={access.username}
                onChange={(e) =>
                  setAccess({ ...access, username: e.target.value })
                }
                placeholder="логин"
              />
              <input
                type="text"
                className="field max-w-xs"
                value={access.password}
                onChange={(e) =>
                  setAccess({ ...access, password: e.target.value })
                }
                placeholder="пароль"
              />
              <button
                onClick={() =>
                  run(
                    () =>
                      grantTrainerAccess(item.id, {
                        username: access.username.trim(),
                        password: access.password,
                      }),
                    "Доступ открыт",
                  ).then(() => setAccess({ username: "", password: "" }))
                }
                disabled={busy || !access.username.trim() || !access.password}
                className="text-text/80 underline underline-offset-4 disabled:opacity-40"
              >
                Открыть вход
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => run(() => updateTrainer(item.id, draft), "Сохранено")}
          disabled={busy || !draft.name.trim()}
          className="btn-gold disabled:opacity-40"
        >
          Сохранить
        </button>
        <button
          onClick={() => {
            if (
              !confirm(
                item.admin
                  ? "Удалить тренера вместе с его входом в админку? Созданные им занятия останутся у студии."
                  : "Удалить тренера? Он отвяжется от своих занятий.",
              )
            )
              return;
            run(() => deleteTrainer(item.id), "Удалено");
          }}
          disabled={busy || isOwnerCard}
          className="text-sm text-red-400 disabled:opacity-40"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
