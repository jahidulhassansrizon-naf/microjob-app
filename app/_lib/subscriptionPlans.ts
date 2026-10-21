/**
 * Single source of truth for subscription pricing.
 * Update this catalogue to change the displayed price and server-side checkout amount together.
 */
export const SUBSCRIPTION_PLAN_BY_ID = {
  "1-month": {
    id: "1-month",
    name: "1 Month",
    duration: "30 Days",
    months: 1,
    days: 30,
    price: 100,
    regularPrice: 350,
    note: "Full access to all paid tools for 30 days",
    badge: "Limited-time launch offer",
  },
} as const;

export const SUBSCRIPTION_PLANS = Object.values(SUBSCRIPTION_PLAN_BY_ID);

export const SUBSCRIPTION_PLAN_FEATURES = [
  "Access to all available paid tools",
  "AI Editor, AI Template, and Bulk Photo Edit are included",
  "Use the same account across supported tools",
  "Manage your subscription status from this page",
  "Payment verification and subscription access are handled automatically",
] as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLAN_BY_ID;
