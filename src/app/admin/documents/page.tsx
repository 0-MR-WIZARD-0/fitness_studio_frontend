"use client";

import { useEffect, useState } from "react";
import {
  adminDocuments,
  createDocument,
  deleteDocument,
  updateDocument,
  uploadDocumentFile,
} from "@/lib/admin";
import { mediaUrl, type StudioDocument } from "@/lib/api";
import { PageTitle, Toast } from "@/components/admin/ui";

export default function AdminDocuments() {
  const [items, setItems] = useState<StudioDocument[]>([]);
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = () => adminDocuments().then(setItems);
  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  async function pickFile(file?: File) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const res = await uploadDocumentFile(file);
      setFileUrl(res.url);
      setFileName(file.name);
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    setError(null);
    try {
      await createDocument({
        title: title.trim(),
        fileUrl,
        order: items.length + 1,
        isActive: true,
      });
      setTitle("");
      setFileUrl("");
      setFileName("");
      reload();
      flash("Документ добавлен");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    }
  }

  return (
    <div className="max-w-3xl">
      <PageTitle>Документы студии</PageTitle>

      <div className="mb-8 rounded-2xl border-gold bg-surface/50 p-5">
        <p className="mb-1 font-sub text-heading">Добавить документ</p>
        <p className="mb-4 text-xs text-text/50">
          Каждый документ клиент отмечает галочкой при записи на занятие или
          аренду. Принимаются PDF, DOC/DOCX и картинки.
        </p>

        <div className="grid items-start gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block h-5 text-text/80">Название</span>
            <input
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Пользовательское соглашение"
            />
          </label>
          <div className="text-sm">
            <span className="mb-1 block h-5 text-text/80">Файл</span>
            <label className="inline-flex cursor-pointer items-center rounded-lg border-gold bg-surface-2 px-4 py-2 text-sm text-heading hover:bg-surface">
              {busy ? "Загрузка…" : fileUrl ? "Заменить файл" : "Выбрать файл"}
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>
            {fileUrl && (
              <p className="mt-2 text-xs text-text/60">
                {fileName || "файл загружен"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={add}
            disabled={!title.trim() || !fileUrl || busy}
            className="btn-gold disabled:opacity-40"
          >
            Добавить
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-text/60">Документов пока нет.</p>
        )}
        {items.map((doc) => (
          <DocumentRow
            key={doc.id}
            doc={doc}
            onChanged={(m) => {
              reload();
              flash(m);
            }}
          />
        ))}
      </div>

      <Toast message={toast} />
    </div>
  );
}

function DocumentRow({
  doc,
  onChanged,
}: {
  doc: StudioDocument;
  onChanged: (message: string) => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [busy, setBusy] = useState(false);

  return (
    <div className="rounded-2xl border-gold bg-surface/40 p-4">
      <div className="grid items-center gap-3 md:grid-cols-[1fr_auto]">
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <a
            href={mediaUrl(doc.fileUrl) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-4"
          >
            Открыть
          </a>
          <label className="flex items-center gap-2 text-text/80">
            <input
              type="checkbox"
              checked={doc.isActive}
              onChange={async (e) => {
                await updateDocument(doc.id, {
                  title: doc.title,
                  fileUrl: doc.fileUrl,
                  order: doc.order,
                  isActive: e.target.checked,
                });
                onChanged(
                  e.target.checked
                    ? "Документ показывается при записи"
                    : "Документ скрыт",
                );
              }}
            />
            Показывать
          </label>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await updateDocument(doc.id, {
                  title: title.trim(),
                  fileUrl: doc.fileUrl,
                  order: doc.order,
                  isActive: doc.isActive,
                });
                onChanged("Название сохранено");
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy || title.trim() === doc.title || !title.trim()}
            className="text-text/80 underline underline-offset-4 disabled:opacity-40"
          >
            Сохранить
          </button>
          <button
            onClick={async () => {
              if (!confirm(`Удалить документ «${doc.title}»?`)) return;
              await deleteDocument(doc.id);
              onChanged("Документ удалён");
            }}
            className="text-red-400"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
