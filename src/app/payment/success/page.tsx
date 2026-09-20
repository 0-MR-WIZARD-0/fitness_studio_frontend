"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";
import { paymentStatus, type PaymentStatus } from "@/lib/api";

const fullDay = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  });
const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccess />
    </Suspense>
  );
}

function PaymentSuccess() {
  const router = useRouter();
  const bookingId = Number(useSearchParams().get("booking"));
  const [state, setState] = useState<PaymentStatus | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!bookingId) return;
    let stop = false;
    paymentStatus(bookingId)
      .then((res) => {
        if (stop) return;
        setState(res);
        if (!res.paid && tries < 5)
          setTimeout(() => setTries((t) => t + 1), 2000);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [bookingId, tries]);

  return (
    <div className="pt-28 pb-14 md:pt-32">
      <Container>
        <div className="mx-auto max-w-lg rounded-2xl border-gold bg-surface/60 p-8 text-center">
          {!bookingId ? (
            <p className="text-2xl text-heading">Запись не найдена</p>
          ) : state?.paid ? (
            <>
              <p className="text-2xl text-heading">Запись прошла успешно</p>

              {state.items.length > 0 && (
                <div className="mt-4 space-y-1 text-sm">
                  {state.items.map((it, i) => (
                    <p key={`${it.startsAt}-${i}`}>
                      {it.startsAt && (
                        <>
                          <span className="text-heading">
                            {fullDay(it.startsAt)}
                          </span>
                          , {timeOf(it.startsAt)} ·{" "}
                        </>
                      )}
                      {it.title}
                      {it.durationMin ? ` · ${it.durationMin} мин` : ""}
                    </p>
                  ))}
                </div>
              )}

              <p className="mt-4 text-sm">
                Стоимость:{" "}
                <span className="text-accent">
                  {state.total.toLocaleString("ru-RU")} ₽
                </span>{" "}
                оплачено
              </p>
              <p className="mt-4 text-sm">Ждём вас!</p>
            </>
          ) : (
            <>
              <p className="text-2xl text-heading">Проверяем оплату…</p>
              <p className="mt-4 text-sm text-text/70">
                Банк подтверждает платёж в течение нескольких секунд. Если
                страница не обновится, загляните в личный кабинет: оплаченная
                запись появится там.
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => router.push("/")} className="btn-gold">
              На главную
            </button>
            <button
              onClick={() => router.push("/account")}
              className="text-sm text-text/70 underline underline-offset-4"
            >
              Мои записи
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
