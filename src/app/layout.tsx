import type { Metadata } from "next";
import { Montserrat, Montserrat_Alternates } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { BookingProvider } from "@/components/BookingProvider";
import { PublicChrome } from "@/components/PublicChrome";
import { getSettings, type SiteSettings } from "@/lib/api";

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
  title: "Триединство — фитнес-студия",
  description: "Фитнес, здоровье и уход в одной системе. Студия для женщин.",
};

const FALLBACK_SETTINGS: SiteSettings = {
  id: 1,
  address: "Малая Никитская ул., 8/1, Москва",
  phone: "8-888-888-88-88",
  email: "test@mail.ru",
  courseThreshold: 3,
  userAgreementUrl: "",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let settings = FALLBACK_SETTINGS;
  try {
    settings = await getSettings();
  } catch {
  }

  return (
    <html
      lang="ru"
      className={`${montserrat.variable} ${montserratAlt.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <BookingProvider>
          <PublicChrome footer={<Footer settings={settings} />}>
            {children}
          </PublicChrome>
        </BookingProvider>
      </body>
    </html>
  );
}
