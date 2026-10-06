import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { FormatTabs } from "@/components/formats/FormatTabs";
import { CoursePromo } from "@/components/CoursePromo";
import {
  getFormats,
  getSettings,
  type Format,
  type SiteSettings,
} from "@/lib/api";

export const metadata = {
  title: "Форматы занятий",
  description:
    "Направления студии «Триединство»: для кого подходит каждый формат, как проходит занятие и сколько длится.",
  alternates: { canonical: "/formats" },
};

export default async function FormatsPage() {
  let formats: Format[] = [];
  let settings: SiteSettings | null = null;
  try {
    [formats, settings] = await Promise.all([getFormats(), getSettings()]);
  } catch {}
  const price = settings?.pricePerSession ?? 0;

  return (
    <div className="pt-32 pb-10">
      <Container>
        <h1 className="text-center text-5xl md:text-7xl font-bold">
          Наши форматы
        </h1>

        <Reveal>
          <FormatTabs
            main={formats.filter((f) => !f.isExtra)}
            extra={formats.filter((f) => f.isExtra)}
            price={price}
          />
        </Reveal>

        {settings && (
          <CoursePromo
            className="mt-12"
            threshold={settings.courseThreshold}
            price={settings.pricePerSession}
          />
        )}

        <div className="mt-10 flex justify-center md:justify-end">
          <Link href="/survey" className="btn-gold">
            Пройти опрос и подобрать формат
          </Link>
        </div>
      </Container>
    </div>
  );
}
