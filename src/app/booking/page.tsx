import { Container } from "@/components/Container";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata = { title: "Запись — Триединство" };

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const formatRaw = Array.isArray(sp.format) ? sp.format[0] : sp.format;
  const tabRaw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;

  return (
    <div className="pt-24 pb-14 md:pt-28">
      <Container>
        <h1 className="text-4xl md:text-6xl font-bold">Запись</h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
          Выберите занятие в расписании недели — день, время и тренер указаны на
          карточке.
        </p>
      </Container>

      <div className="mt-8">
        <BookingFlow
          initialFormatId={Number(formatRaw) || null}
          initialDiagnostic={tabRaw === "diagnostic"}
        />
      </div>
    </div>
  );
}
