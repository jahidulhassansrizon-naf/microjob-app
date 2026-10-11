import { cookies } from "next/headers";
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
  // The root layout shows <LoginSuccessOverlay/> when this one-time cookie is present.
  const cookieStore = await cookies();
  const loginOverlayActive =
    cookieStore.get("sohoj_login_success")?.value === "1";

  return (
    <DashboardClient
      initialLoginSuccess={initialLoginSuccess}
      loginOverlayActive={loginOverlayActive}
    />
  );
}
