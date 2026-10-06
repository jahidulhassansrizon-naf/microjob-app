import DashboardClient from "./DashboardClient";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{
    loginSuccess?: string;
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const initialLoginSuccess = params.loginSuccess === "1";

  return (
    <DashboardClient initialLoginSuccess={initialLoginSuccess} />
  );
}
