import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Grid } from "@/components/Container";
import { Placeholder } from "@/components/Placeholder";
import { Reveal } from "@/components/Reveal";
import { BookFormatButton } from "@/components/formats/BookFormatButton";
import { ApiError, getFormat, mediaUrl, type Format } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const f = await getFormat(slug);
    return { title: `Формат ${f.name} — Триединство` };
  } catch {
    return { title: "Формат — Триединство" };
  }
}

export default async function FormatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let format: Format;
  try {
    format = await getFormat(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const heroImg = mediaUrl(format.heroImageUrl);

  return (
    <article>
      <section className="relative min-h-[88vh] w-full overflow-hidden">
        {heroImg ? (
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#5a4632] via-[#3a2d24] to-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bg/85 via-bg/40 to-transparent" />

        <Container className="relative flex min-h-[88vh] flex-col justify-center pt-20">
          <Link
            href="/formats"
            className="absolute right-5 top-24 text-right text-sm text-text/70 hover:text-heading md:right-8"
          >
            Вернуться к выбору
            <br />
            форматов
          </Link>

          <div className="max-w-xl">
            <h1 className="text-5xl md:text-7xl font-bold leading-[0.95]">
              Формат
              <br />
              {format.name}
            </h1>
            {format.subtitle && (
              <p className="mt-4 font-sub text-xl text-heading/90">
                {format.subtitle}
              </p>
            )}
            {format.miniResults.length > 0 && (
              <ul className="mt-5 space-y-1 text-text/90">
                {format.miniResults.map((m) => (
                  <li key={m} className="flex items-center gap-2">
                    <span className="text-accent">•</span> {m}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <BookFormatButton formatId={format.id} />
            </div>

            <p className="mt-5 text-sm text-text/80">
              Цена за занятие — {format.pricePerSession.toLocaleString("ru-RU")}{" "}
              руб. · Курс — {format.priceCourse.toLocaleString("ru-RU")} руб.
            </p>
          </div>
        </Container>
      </section>

      {format.forWhom && format.forWhom.length > 0 && (
        <Reveal>
        <section className="py-16 md:py-20">
          <Container>
            <h2 className="text-3xl md:text-4xl font-bold">
              Для кого этот формат
            </h2>
            <Grid className="mt-8">
              {format.forWhom.map((item) => (
                <div
                  key={item.id}
                  className="col-span-12 md:col-span-4 rounded-2xl border-gold bg-surface/60 p-6"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-accent/70" />
                  <h3 className="mt-4 font-sub text-lg text-heading">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text/85">
                    {item.description}
                  </p>
                </div>
              ))}
            </Grid>
          </Container>
        </section>
        </Reveal>
      )}

      {format.mechanisms && format.mechanisms.length > 0 && (
        <Reveal>
        <section className="pb-20">
          <Container>
            <h2 className="text-2xl md:text-4xl font-bold uppercase">
              Как это работает: {format.mechanisms.length} механизма в{" "}
              {format.name.toLowerCase()}
            </h2>
            <div className="mt-10 space-y-8">
              {format.mechanisms.map((m, i) => (
                <Reveal key={m.id} delay={i * 80}>
                  <Mechanism mechanism={m} flip={i % 2 === 1} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
        </Reveal>
      )}
    </article>
  );
}

function Mechanism({
  mechanism,
  flip,
}: {
  mechanism: NonNullable<Format["mechanisms"]>[number];
  flip?: boolean;
}) {
  const text = (
    <div className="col-span-12 md:col-span-7 flex flex-col justify-center p-6 md:p-8">
      <div className="flex items-start gap-4">
        <span className="text-4xl md:text-5xl font-bold text-accent tabular-nums">
          {String(mechanism.number).padStart(2, "0")}
        </span>
        <h3 className="mt-1 font-sub text-xl text-heading">{mechanism.title}</h3>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm leading-relaxed text-text/85">
        {mechanism.bullets.map((b, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-accent">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  const photo = (
    <div className="col-span-12 md:col-span-5">
      <Placeholder
        src={mechanism.imageUrl}
        label="фото"
        className="h-full min-h-56 w-full"
      />
    </div>
  );

  return (
    <Grid className="overflow-hidden rounded-2xl border-gold bg-surface/40">
      {flip ? (
        <>
          {photo}
          {text}
        </>
      ) : (
        <>
          {text}
          {photo}
        </>
      )}
    </Grid>
  );
}
