import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
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
  const token = cookieStore.get("token")?.value;

  // Never render the regular user dashboard for an authenticated admin. This
  // also handles users promoted after their browser cached role="user".
  if (token) {
    let verifiedSession: Awaited<ReturnType<typeof getVerifiedRequestSession>> = null;
    try {
      verifiedSession = await getVerifiedRequestSession(
        new Request("http://localhost/dashboard", {
          headers: { cookie: `token=${token}` },
        }),
      );
    } catch {
      // A transient DB/auth check failure should not crash the public dashboard.
    }
    if (verifiedSession?.role === "admin") redirect("/admin");
  }

  const loginOverlayActive =
    cookieStore.get("sohoj_login_success")?.value === "1";

  return (
    <DashboardClient
      initialLoginSuccess={initialLoginSuccess}
      loginOverlayActive={loginOverlayActive}
    />
  );
}
