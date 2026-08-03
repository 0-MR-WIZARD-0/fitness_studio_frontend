import { Container, Grid } from "./Container";
import { MaxIcon, TelegramIcon } from "./SocialIcons";
import type { SiteSettings } from "@/lib/api";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mt-0 border-t border-white/10 py-10 md:mt-20">
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

            {(settings.telegramUrl || settings.maxUrl) && (
              <div className="mt-4 space-y-2">
                {settings.telegramUrl && (
                  <a
                    href={settings.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm transition hover:text-accent"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/50 text-accent">
                      <TelegramIcon className="h-4 w-4" />
                    </span>
                    Telegram-канал
                  </a>
                )}
                {settings.maxUrl && (
                  <a
                    href={settings.maxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm transition hover:text-accent"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/50 text-accent">
                      <MaxIcon className="h-4 w-4" />
                    </span>
                    Канал в MAX
                  </a>
                )}
              </div>
            )}

            <p className="mt-6 text-sm text-text/50">
              © {new Date().getFullYear()} Триединство
            </p>
          </div>
        </Grid>
      </Container>
    </footer>
  );
}
