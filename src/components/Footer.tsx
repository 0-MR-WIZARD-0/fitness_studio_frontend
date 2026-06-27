import { Container, Grid } from "./Container";
import type { SiteSettings } from "@/lib/api";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-white/10 py-10 mt-20">
      <Container>
        <Grid className="items-start gap-y-8">
          <div className="col-span-12 md:col-span-4">
            <iframe
              src={`https://yandex.ru/map-widget/v1/?mode=search&text=${encodeURIComponent(
                settings.address,
              )}&z=17`}
              className="h-56 w-full rounded-xl border-gold"
              loading="lazy"
              title="Карта"
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <p className="font-sub text-heading">Адрес:</p>
            <p>{settings.address}</p>
            <p className="font-sub text-heading mt-4">Телефон:</p>
            <p>{settings.phone}</p>
          </div>

          <div className="col-span-12 md:col-span-4">
            <p className="font-sub text-heading">Email: {settings.email}</p>
            <p className="mt-6 text-sm text-text/50">
              © {new Date().getFullYear()} Триединство
            </p>
          </div>
        </Grid>
      </Container>
    </footer>
  );
}
