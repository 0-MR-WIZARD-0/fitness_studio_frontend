import { Container } from "@/components/Container";
import { SurveyForm } from "@/components/survey/SurveyForm";
import {
  getConditions,
  getFormats,
  getSettings,
  type Condition,
  type Format,
  type SiteSettings,
} from "@/lib/api";

export const metadata = { title: "Подбор формата — Триединство" };

const FALLBACK_SETTINGS: SiteSettings = {
  id: 1,
  address: "",
  phone: "",
  email: "",
  courseThreshold: 3,
  userAgreementUrl: "",
  telegramUrl: "",
  maxUrl: "",
};

export default async function SurveyPage() {
  let conditions: Condition[] = [];
  let formats: Format[] = [];
  let settings = FALLBACK_SETTINGS;

  try {
    [conditions, formats, settings] = await Promise.all([
      getConditions(),
      getFormats(),
      getSettings(),
    ]);
  } catch {
  }

  return (
    <div className="pt-24 pb-14 md:pt-28">
      <Container>
        <h1 className="text-4xl md:text-6xl font-bold">Подбор формата</h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
          Отметьте состояния, которые у вас есть. Мы подскажем, какие форматы
          подойдут, а с какими стоит быть осторожнее.
        </p>

        <SurveyForm
          conditions={conditions}
          formats={formats}
          phone={settings.phone}
          email={settings.email}
        />
      </Container>
    </div>
  );
}
