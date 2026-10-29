import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** SMS verification is intentionally disabled in the registration UI until a provider is configured. */
export async function POST() {
  return NextResponse.json(
    { message: "SMS verification is temporarily unavailable. Please choose email verification." },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}
