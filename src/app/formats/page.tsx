import Link from "next/link";
import { Container, Grid } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { mediaUrl, getFormats, type Format } from "@/lib/api";

export const metadata = { title: "Форматы — Триединство" };

export default async function FormatsPage() {
  let formats: Format[] = [];
  try {
    formats = await getFormats();
  } catch {
  }

  return (
    <div className="pt-28 pb-10">
      <Container>
        <h1 className="text-center text-5xl md:text-7xl font-bold">
          Наши форматы
        </h1>

        <Reveal>
          <Grid className="mt-12 items-stretch">
            {formats.map((f, i) => (
              <FormatCard key={f.id} format={f} highlight={i === 0} />
            ))}
          </Grid>
        </Reveal>

        {formats[0] && (
          <div className="mt-10 flex justify-end">
            <Link href={`/formats/${formats[0].slug}`} className="btn-gold">
              Пройти опрос и подобрать формат
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}

function FormatCard({
  format,
  highlight,
}: {
  format: Format;
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
          <img
            src={img}
            alt={format.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
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
      <div className="mt-4 px-1 text-sm leading-relaxed">
        <p>Цена за занятие — {format.pricePerSession.toLocaleString("ru-RU")} руб.</p>
        <p>Курс — {format.priceCourse.toLocaleString("ru-RU")} руб.</p>
      </div>
    </div>
  );
}
