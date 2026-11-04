import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { getSubscriptionPlans, saveSubscriptionPlans } from "@/app/api/_lib/subscriptionPlans";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const plans = await getSubscriptionPlans({ includeInactive: true });
    return NextResponse.json({ success: true, plans }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Admin subscription plans load failed:", error);
    return NextResponse.json({ success: false, message: "Subscription plans could not be loaded." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    const result = await saveSubscriptionPlans(body?.plans, admin?.email || "administrator");
    if (!result.plans) return NextResponse.json({ success: false, message: result.message || "Invalid subscription plans." }, { status: 400 });
    return NextResponse.json(
      { success: true, message: "Subscription plans saved successfully.", plans: result.plans },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Admin subscription plans save failed:", error);
    return NextResponse.json({ success: false, message: "Subscription plans could not be saved. Check the database connection and try again." }, { status: 500 });
  }
}
