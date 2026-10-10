import { Container } from "@/components/Container";
import { RentFlow } from "@/components/rent/RentFlow";
import { StudioGallery } from "@/components/rent/StudioGallery";
import { ServiceOrder } from "@/components/services/ServiceOrder";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { HallPrices } from "@/components/services/HallPrices";
import {
  getHalls,
  getServices,
  getStudioPhotos,
  type Hall,
  type Service,
  type StudioPhoto,
} from "@/lib/api";

export const metadata = {
  title: "Дополнительные услуги и аренда зала",
  description:
    "Услуги студии «Триединство» и аренда зала: что входит, сколько стоит и как забронировать время.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [photos, services, halls] = await Promise.all([
    getStudioPhotos().catch((): StudioPhoto[] => []),
    getServices().catch((): Service[] => []),
    getHalls().catch((): Hall[] => []),
  ]);

  const withoutTime = services.filter((s) => !s.durationMin);

  const servicesTab = (
    <Container>
      <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
        Составление индивидуального плана питания под ваши запросы и
        потребности.
      </p>

      {withoutTime.length > 0 ? (
        <div className="mt-8">
          <h2 className="font-sub text-2xl text-heading">
            Услуги без записи по времени
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-text/70">
            Оставьте заявку — студия свяжется с вами и договорится о деталях.
          </p>
          <ServiceOrder services={withoutTime} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-text/60">Услуги пока не добавлены.</p>
      )}
    </Container>
  );

  const hallsTab = (
    <>
      <Container>
        <div className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
          <p>Доступ к залу и оборудованию по часам.</p>
          <ol className="mt-1 list-decimal space-y-1 pl-6 marker:text-accent">
            <li>
              Выбираете удобное время в расписании или приложенной к залу
              ссылке.
            </li>
            <li>Бронируете слот.</li>
            <li>Проводите свою тренировку или мероприятие.</li>
            <li>Оплачиваете услугу по тарифу.</li>
          </ol>
        </div>
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

      {halls.some((h) => h.autoSchedule) && (
        <div className="mt-12">
          <Container>
            <h2 className="font-sub text-2xl text-heading">
              Расписание по часам
            </h2>
          </Container>
          <div className="mt-4">
            <RentFlow />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="pt-28 pb-14 md:pt-32">
      <Container>
        <h1 className="text-4xl md:text-6xl font-bold">
          Дополнительные услуги
        </h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
          Помимо групповых занятий, студия предлагает:
        </p>
      </Container>

      <ServicesTabs services={servicesTab} halls={hallsTab} />
    </div>
  );
}
