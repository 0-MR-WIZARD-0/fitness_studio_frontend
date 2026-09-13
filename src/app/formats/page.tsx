import Image from "next/image";
import Link from "next/link";
import { Container, Grid } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { FormatsCarousel } from "@/components/formats/FormatsCarousel";
import { CoursePromo } from "@/components/CoursePromo";
import {
  mediaUrl,
  getFormats,
  getSettings,
  type Format,
  type SiteSettings,
} from "@/lib/api";

export const metadata = { title: "Форматы — Триединство" };

export default async function FormatsPage() {
  let formats: Format[] = [];
  let settings: SiteSettings | null = null;
  try {
    [formats, settings] = await Promise.all([getFormats(), getSettings()]);
  } catch {
  }
  const price = settings?.pricePerSession ?? 0;

  return (
    <div className="pt-32 pb-10">
      <Container>
        <h1 className="text-center text-5xl md:text-7xl font-bold">
          Наши форматы
        </h1>

        <Reveal>
          <FormatsCarousel
            formats={formats}
            price={price}
            className="mt-10 md:hidden"
          />

          <Grid className="mt-12 hidden items-stretch md:grid">
            {formats.map((f, i) => (
              <FormatCard
                key={f.id}
                format={f}
                price={price}
                highlight={i === 0}
              />
            ))}
          </Grid>
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

function FormatCard({
  format,
  price,
  highlight,
}: {
  format: Format;
  price: number;
  highlight?: boolean;
}) {
  const img = mediaUrl(format.heroImageUrl);
  return (
    <div className="col-span-12 md:col-span-4 flex flex-col">
      <Link
        href={`/formats/${format.slug}`}
        className="group relative h-72 overflow-hidden rounded-2xl border-gold bg-surface"
      >
        {img ? (
          <Image
            src={img}
            alt={format.name}
            fill
            sizes="(max-width: 768px) 72vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          highlight && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#4a3826] to-[#2a2122]" />
          )
        )}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 grid place-items-center p-4">
          <span className="font-sub text-2xl text-heading text-center">
            {format.name}
          </span>
        </div>
      </Link>
      <div className="mt-4 px-1 text-center text-sm leading-relaxed">
        <p>
          Цена за занятие — {price.toLocaleString("ru-RU")} руб.
        </p>
        <p className="text-text/60">{format.durationMin} мин</p>
      </div>
    </div>
  );
}
