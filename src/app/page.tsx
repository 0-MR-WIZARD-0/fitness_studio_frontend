import { Hero } from "@/components/home/Hero";
import { FaqTabs } from "@/components/home/FaqTabs";
import { FormatsSlider } from "@/components/home/FormatsSlider";
import { StepsShowcase } from "@/components/home/StepsShowcase";
import { Announcements } from "@/components/home/Announcements";
import { Reveal } from "@/components/Reveal";
import {
  getAnnouncements,
  getFaq,
  getFormats,
  getHero,
  getSteps,
  type Announcement,
  type HomeFaq,
  type HomeStep,
  type Format,
  type HomeHero,
} from "@/lib/api";

const FALLBACK_HERO: HomeHero = {
  id: 0,
  title: "ТРИЕДИНСТВО",
  subtitle: "Три сферы. Одна система. Тройной эффект",
  description: "",
  imageUrl: null,
  spheres: [],
};

export default async function HomePage() {
  let hero = FALLBACK_HERO;
  let faq: HomeFaq[] = [];
  let steps: HomeStep[] = [];
  let formats: Format[] = [];
  let announcements: Announcement[] = [];

  try {
    [hero, faq, steps, formats, announcements] = await Promise.all([
      getHero(),
      getFaq(),
      getSteps(),
      getFormats(),
      getAnnouncements(),
    ]);
  } catch {
  }

  return (
    <>
      <Hero hero={hero} />
      <Reveal>
        <FaqTabs items={faq} />
      </Reveal>
      <Reveal>
        <FormatsSlider formats={formats} />
      </Reveal>
      {announcements.length > 0 && (
        <Reveal>
          <Announcements items={announcements} />
        </Reveal>
      )}
      <Reveal>
        <StepsShowcase steps={steps} />
      </Reveal>
    </>
  );
}
