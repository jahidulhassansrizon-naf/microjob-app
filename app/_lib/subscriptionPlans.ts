/**
 * Default subscription catalogue. The persisted catalogue is loaded server-side
 * from MongoDB; these values are the safe first-install / database fallback.
 */
export type SubscriptionDurationUnit = "day" | "month" | "year";

export type SubscriptionPlan = {
  id: string;
  name: string;
  duration: string;
  durationValue: number;
  durationUnit: SubscriptionDurationUnit;
  months: number;
  days: number;
  price: number;
  regularPrice: number;
  note: string;
  badge: string;
  active: boolean;
  sortOrder: number;
};

export const SUBSCRIPTION_PLAN_BY_ID: Record<string, SubscriptionPlan> = {
  "1-month": {
    id: "1-month", name: "1 Month", duration: "30 Days", durationValue: 1,
    durationUnit: "month", months: 1, days: 30, price: 99, regularPrice: 350,
    note: "Full access to all paid tools for 1 month", badge: "Monthly plan",
    active: true, sortOrder: 0,
  },
  "6-month": {
    id: "6-month", name: "6 Months", duration: "180 Days", durationValue: 6,
    durationUnit: "month", months: 6, days: 180, price: 499, regularPrice: 2100,
    note: "Full access to all paid tools for 6 months", badge: "Most popular",
    active: true, sortOrder: 1,
  },
  "1-year": {
    id: "1-year", name: "1 Year", duration: "365 Days", durationValue: 1,
    durationUnit: "year", months: 12, days: 365, price: 899, regularPrice: 4200,
    note: "Full access to all paid tools for 1 year", badge: "Best value",
    active: true, sortOrder: 2,
  },
};

export const SUBSCRIPTION_PLANS = Object.values(SUBSCRIPTION_PLAN_BY_ID);
export const SUBSCRIPTION_PLAN_FEATURES = [
  "Access to all available paid tools",
  "AI Editor, AI Template, and Bulk Photo Edit are included",
  "Use the same account across supported tools",
  "Manage your subscription status from this page",
  "Payment is verified before subscription access is activated",
] as const;

// IDs are now admin-managed, so this is intentionally not a fixed union.
export type SubscriptionPlanId = string;
