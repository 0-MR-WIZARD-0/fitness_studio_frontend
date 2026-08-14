import { Hero } from "@/components/home/Hero";
import { FaqTabs } from "@/components/home/FaqTabs";
import { FormatsSlider } from "@/components/home/FormatsSlider";
import { StepsShowcase } from "@/components/home/StepsShowcase";
import { Announcements } from "@/components/home/Announcements";
import { Reveal } from "@/components/Reveal";
import { Container } from "@/components/Container";
import { CoursePromo } from "@/components/CoursePromo";
import {
  getAnnouncements,
  getFaq,
  getFormats,
  getHero,
  getSettings,
  getSteps,
  type Announcement,
  type HomeFaq,
  type HomeStep,
  type Format,
  type HomeHero,
  type SiteSettings,
} from "@/lib/api";

const FALLBACK_HERO: HomeHero = {
  id: 0,
  title: "ТРИЕДИНСТВО",
  subtitle: "Три сферы. Одна система. Тройной эффект",
  subtitle2: "",
  description: "",
  imageUrl: null,
  faqImageUrl: null,
  spheres: [],
};

export default async function HomePage() {
  let hero = FALLBACK_HERO;
  let faq: HomeFaq[] = [];
  let steps: HomeStep[] = [];
  let formats: Format[] = [];
  let announcements: Announcement[] = [];
  let settings: SiteSettings | null = null;

  try {
    [hero, faq, steps, formats, announcements, settings] = await Promise.all([
      getHero(),
      getFaq(),
      getSteps(),
      getFormats(),
      getAnnouncements(),
      getSettings(),
    ]);
  } catch {
  }

  return (
    <>
      <Hero hero={hero} />
      <Reveal>
        <FaqTabs items={faq} imageUrl={hero.faqImageUrl} />
      </Reveal>
      <Reveal>
        <FormatsSlider formats={formats} />
      </Reveal>
      {settings && formats.length > 0 && (
        <Reveal>
          <Container className="pb-8 md:pb-10">
            <CoursePromo
              threshold={settings.courseThreshold}
              price={settings.pricePerSession}
              coursePrice={settings.priceCourse}
            />
          </Container>
        </Reveal>
      )}
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
