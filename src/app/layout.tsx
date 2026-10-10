import type { Metadata } from "next";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { BookingProvider } from "@/components/BookingProvider";
import { AccountProvider } from "@/components/account/AccountProvider";
import { PublicChrome } from "@/components/PublicChrome";
import { SocialDock } from "@/components/SocialDock";
import { StructuredData } from "@/components/StructuredData";
import { getSettings, type SiteSettings } from "@/lib/api";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const montserratAlt = Montserrat_Alternates({
  variable: "--font-montserrat-alt",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — фитнес-студия для женщин`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  verification: { yandex: "873bd6b9cba34746" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
  },
};

const FALLBACK_SETTINGS: SiteSettings = {
  id: 1,
  address: "Малая Никитская ул., 8/1, Москва",
  phone: "8-888-888-88-88",
  email: "test@mail.ru",
  courseThreshold: 3,
  userAgreementUrl: "",
  telegramUrl: "",
  maxUrl: "",
  rentPricePerHour: 0,
  rentDayStart: "09:00",
  rentDayEnd: "17:30",
  rentBufferMin: 30,
  bookingEditHours: 4,
  courseCancelHours: 12,
  mapLat: null,
  mapLng: null,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let settings = FALLBACK_SETTINGS;
  try {
    settings = await getSettings();
  } catch {}

  return (
    <html
      lang="ru"
      className={`${montserrat.variable} ${montserratAlt.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <StructuredData settings={settings} />
        <AccountProvider>
          <BookingProvider>
            <PublicChrome footer={<Footer settings={settings} />}>
              {children}
            </PublicChrome>
            <SocialDock
              telegramUrl={settings.telegramUrl}
              maxUrl={settings.maxUrl}
            />
          </BookingProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
