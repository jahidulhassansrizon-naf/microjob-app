// app/login/page.tsx
//
// Server gate: a visitor who is already signed in is detected on the server, so the
// sign-in form is never sent to (or painted in) the browser. The site's full-screen page
// loader stays up while the dashboard (or admin area) opens.
import { cookies } from "next/headers";
import { getVerifiedRequestSession } from "@/lib/serverAuth";
import LoginClient from "./LoginClient";
import SessionRedirect from "./_components/SessionRedirect";
import { resolvePostLoginPath } from "./_lib/resolvePostLoginPath";

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Params>;
}) {
  const params = (await searchParams) ?? {};
  const requestedTarget = (first(params.callbackUrl) || first(params.redirect)).trim();

  const token = (await cookies()).get("token")?.value;
  let destination: string | null = null;

  if (token) {
    try {
      const session = await getVerifiedRequestSession(
        new Request("http://localhost/login", {
          headers: { cookie: `token=${token}` },
        }),
      );
      if (session) destination = resolvePostLoginPath(session.role, requestedTarget);
    } catch {
      // A transient auth/DB failure: fall back to the normal form (the client re-checks).
    }
  }

  // Signed in: no form at all. SessionRedirect keeps the site loader up and opens the destination.
  if (destination) return <SessionRedirect to={destination} />;

  return <LoginClient />;
}
