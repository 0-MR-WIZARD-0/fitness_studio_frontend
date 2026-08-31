import { Container } from "@/components/Container";
import { RentFlow } from "@/components/rent/RentFlow";

export const metadata = { title: "Аренда студии — Триединство" };

export default function RentPage() {
  return (
    <div className="pt-28 pb-14 md:pt-32">
      <Container>
        <h1 className="text-4xl md:text-6xl font-bold">Аренда студии</h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
          Забронируйте зал на свободные часы — для личных занятий, съёмок или
          собственной группы.
        </p>
      </Container>

      <div className="mt-8">
        <RentFlow />
      </div>
    </div>
  );
}
