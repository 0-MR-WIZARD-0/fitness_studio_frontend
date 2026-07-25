"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBooking } from "../BookingProvider";
import { clsx } from "@/lib/clsx";
import { evaluateSurvey, RISK_META, summaryText } from "@/lib/survey";
import type { Condition, Format } from "@/lib/api";

export function SurveyForm({
  conditions,
  formats,
  phone,
  email,
}: {
  conditions: Condition[];
  formats: Format[];
  phone: string;
  email: string;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const { open } = useBooking();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conditions;
    return conditions.filter((c) => c.name.toLowerCase().includes(q));
  }, [conditions, query]);

  const verdicts = useMemo(
    () => evaluateSurvey(formats, conditions, selected),
    [formats, conditions, selected],
  );
  const summary = useMemo(
    () => summaryText(verdicts, selected.length),
    [verdicts, selected.length],
  );

  function toggle(id: number) {
    setShown(false);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function show() {
    setShown(true);
    setTimeout(
      () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  }

  if (!conditions.length || !formats.length) {
    return (
      <div className="mt-10 rounded-2xl border-gold bg-surface/50 p-6">
        <p className="text-sm leading-relaxed">
          Опрос пока не заполнен. Свяжитесь с нами — подберём формат вручную.
        </p>
        <Contacts phone={phone} email={email} />
      </div>
    );
  }

  return (
    <>
      <div className="mt-10 max-w-3xl">
        <input
          className="field"
          placeholder="Поиск по списку…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="mt-4 space-y-2">
          {visible.map((c) => {
            const on = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                aria-pressed={on}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                  on
                    ? "border-accent bg-accent/15 text-heading"
                    : "border-[color-mix(in_srgb,var(--color-border)_45%,transparent)] bg-surface/40 hover:bg-surface",
                )}
              >
                <span
                  className={clsx(
                    "grid h-5 w-5 shrink-0 place-items-center rounded border text-xs",
                    on ? "border-accent bg-accent text-bg" : "border-accent/60",
                  )}
                >
                  {on ? "✓" : ""}
                </span>
                <span className="text-sm md:text-base">{c.name}</span>
              </button>
            );
          })}
          {!visible.length && (
            <p className="py-4 text-sm text-text/60">
              Ничего не найдено по запросу «{query}».
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button onClick={show} className="btn-gold">
            Показать результат
          </button>
          {selected.length > 0 && (
            <button
              onClick={() => {
                setSelected([]);
                setShown(false);
              }}
              className="text-sm text-text/70 underline underline-offset-4"
            >
              Сбросить ({selected.length})
            </button>
          )}
        </div>
      </div>

      {shown && (
        <div ref={resultRef} className="mt-12 max-w-3xl scroll-mt-24">
          <h2 className="text-2xl md:text-3xl font-bold">Что вам подходит</h2>

          <div className="mt-5 space-y-3">
            {summary.map((line, i) => (
              <p
                key={i}
                className={clsx(
                  "text-sm leading-relaxed",
                  i === summary.length - 1 ? "text-text/60" : "text-text/90",
                )}
              >
                {line}
              </p>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {verdicts.map((v) => {
              const meta = RISK_META[v.risk];
              return (
                <div
                  key={v.format.id}
                  className="rounded-2xl border-gold bg-surface/50 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/formats/${v.format.slug}`}
                      className="font-sub text-lg text-heading hover:text-accent"
                    >
                      {v.format.name}
                    </Link>
                    <span
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                        meta.badge,
                      )}
                    >
                      <span className={clsx("h-2 w-2 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </div>

                  {v.notes.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {v.notes.map((n, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed">
                          <span
                            className={clsx(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              RISK_META[n.risk].dot,
                            )}
                          />
                          <span>
                            <span className="text-heading/90">{n.condition}</span>
                            {" — "}
                            {n.note || RISK_META[n.risk].short}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {v.risk !== "FORBIDDEN" && (
                    <button
                      onClick={() => open(v.format.id)}
                      className="btn-gold mt-5"
                    >
                      Записаться
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <Contacts phone={phone} email={email} />
        </div>
      )}
    </>
  );
}

function Contacts({ phone, email }: { phone: string; email: string }) {
  if (!phone && !email) return null;
  return (
    <div className="mt-8 rounded-2xl border border-accent/40 bg-surface/40 p-5">
      <p className="font-sub text-heading">Не нашли своё состояние в списке?</p>
      <p className="mt-2 text-sm leading-relaxed">
        Напишите или позвоните нам — уточним детали и подберём формат вместе с
        тренером.
      </p>
      <div className="mt-3 space-y-1 text-sm">
        {phone && (
          <p>
            Телефон:{" "}
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-accent">
              {phone}
            </a>
          </p>
        )}
        {email && (
          <p>
            Email:{" "}
            <a href={`mailto:${email}`} className="text-accent">
              {email}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
