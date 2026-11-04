import { NextResponse } from "next/server";
import { getSubscriptionPlans } from "@/app/api/_lib/subscriptionPlans";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const plans = await getSubscriptionPlans();
    return NextResponse.json({ success: true, plans }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Public subscription plans load failed:", error);
    return NextResponse.json({ success: false, message: "Subscription plans could not be loaded." }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
