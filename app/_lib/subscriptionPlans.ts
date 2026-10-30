/**
 * Single source of truth for subscription pricing.
 * Shared plan catalogue for subscription UI, manual payments, PipraPay checkout, and admin records.
 */
export const SUBSCRIPTION_PLAN_BY_ID = {
  "1-month": {
    id: "1-month",
    name: "1 Month",
    duration: "30 Days",
    months: 1,
    days: 30,
    price: 99,
    regularPrice: 350,
    note: "Full access to all paid tools for 1 month",
    badge: "Monthly plan",
  },
  "6-month": {
    id: "6-month",
    name: "6 Months",
    duration: "180 Days",
    months: 6,
    days: 180,
    price: 499,
    regularPrice: 2100,
    note: "Full access to all paid tools for 6 months",
    badge: "Most popular",
  },
  "1-year": {
    id: "1-year",
    name: "1 Year",
    duration: "365 Days",
    months: 12,
    days: 365,
    price: 899,
    regularPrice: 4200,
    note: "Full access to all paid tools for 1 year",
    badge: "Best value",
  },
} as const;

export const SUBSCRIPTION_PLANS = Object.values(SUBSCRIPTION_PLAN_BY_ID);

export const SUBSCRIPTION_PLAN_FEATURES = [
  "Access to all available paid tools",
  "AI Editor, AI Template, and Bulk Photo Edit are included",
  "Use the same account across supported tools",
  "Manage your subscription status from this page",
  "Admin reviews the payment before subscription access is activated",
] as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLAN_BY_ID;
