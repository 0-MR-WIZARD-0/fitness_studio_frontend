import { Container } from "@/components/Container";
import { RentFlow } from "@/components/rent/RentFlow";
import { StudioGallery } from "@/components/rent/StudioGallery";
import { ServiceOrder } from "@/components/services/ServiceOrder";
import { HallPrices } from "@/components/services/HallPrices";
import {
  getHalls,
  getServices,
  getStudioPhotos,
  type Hall,
  type Service,
  type StudioPhoto,
} from "@/lib/api";

export const metadata = { title: "Дополнительные услуги — Триединство" };

export default async function ServicesPage() {
  const [photos, services, halls] = await Promise.all([
    getStudioPhotos().catch((): StudioPhoto[] => []),
    getServices().catch((): Service[] => []),
    getHalls().catch((): Hall[] => []),
  ]);

  const withoutTime = services.filter((s) => !s.durationMin);

  return (
    <div className="pt-28 pb-14 md:pt-32">
      <Container>
        <h1 className="text-4xl md:text-6xl font-bold">
          Дополнительные услуги
        </h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
          Аренда зала на свободные часы и услуги студии: разбор питания,
          сопровождение и другие форматы вне расписания занятий.
        </p>
      </Container>

      {photos.length > 0 && (
        <div className="mt-8">
          <Container>
            <StudioGallery photos={photos} />
          </Container>
        </div>
      )}

      {halls.length > 0 && (
        <div className="mt-10">
          <Container>
            <h2 className="font-sub text-2xl text-heading">Залы и цены</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {halls.map((h) => (
                <HallPrices key={h.id} hall={h} />
              ))}
            </div>
          </Container>
        </div>
      )}

      {withoutTime.length > 0 && (
        <div className="mt-10">
          <Container>
            <h2 className="font-sub text-2xl text-heading">Услуги без записи по времени</h2>
            <p className="mt-2 max-w-2xl text-sm text-text/70">
              Оставьте заявку — студия свяжется с вами и договорится о деталях.
            </p>
            <ServiceOrder services={withoutTime} />
          </Container>
        </div>
      )}

      <div className="mt-12">
        <Container>
          <h2 className="font-sub text-2xl text-heading">Расписание по часам</h2>
        </Container>
        <div className="mt-4">
          <RentFlow />
        </div>
      </div>
    </div>
  );
}
