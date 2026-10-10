import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { FormatTabs } from "@/components/formats/FormatTabs";
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
            threshold={settings?.courseThreshold ?? 3}
          />
        </Reveal>
      </Container>
    </div>
  );
}
