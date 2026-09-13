import { Container } from "@/components/Container";
import { AccountDashboard } from "@/components/account/AccountDashboard";

export const metadata = { title: "Мои записи — Триединство" };

export default function AccountPage() {
  return (
    <div className="pt-28 pb-14 md:pt-32">
      <Container>
        <h1 className="text-4xl md:text-6xl font-bold">Личный кабинет</h1>
        <AccountDashboard />
      </Container>
    </div>
  );
}
