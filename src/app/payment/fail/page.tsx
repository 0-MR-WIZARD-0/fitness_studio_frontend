"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";

export default function PaymentFailPage() {
  return (
    <Suspense fallback={null}>
      <PaymentFail />
    </Suspense>
  );
}

function PaymentFail() {
  const router = useRouter();
  const bookingId = useSearchParams().get("booking");

  return (
    <div className="pt-28 pb-14 md:pt-32">
      <Container>
        <div className="mx-auto max-w-lg rounded-2xl border-gold bg-surface/60 p-8 text-center">
          <p className="text-2xl text-heading">Оплата не прошла</p>
          <p className="mt-4 text-sm text-text/80">
            Деньги не списаны. Место за вами не закреплено: выберите занятие
            заново и попробуйте оплатить ещё раз.
          </p>
          {bookingId && (
            <p className="mt-2 text-xs text-text/50">Заявка № {bookingId}</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push("/booking")}
              className="btn-gold"
            >
              Вернуться к записи
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-sm text-text/70 underline underline-offset-4"
            >
              На главную
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
