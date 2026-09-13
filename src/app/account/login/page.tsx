import { Container } from "@/components/Container";
import { AccountAuthForm } from "@/components/account/AccountAuthForm";

export const metadata = { title: "Личный кабинет — Триединство" };

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (key: string) => {
    const raw = sp[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  return (
    <div className="pt-28 pb-14 md:pt-32">
      <Container>
        <h1 className="text-4xl md:text-6xl font-bold">Личный кабинет</h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base leading-relaxed">
          Здесь собраны ваши записи, промокоды и перенос занятий. Запись на
          занятия и аренду возможна только после входа.
        </p>
        <AccountAuthForm
          initialMode={pick("mode") === "register" ? "register" : "login"}
          next={pick("next") ?? "/account"}
        />
      </Container>
    </div>
  );
}
