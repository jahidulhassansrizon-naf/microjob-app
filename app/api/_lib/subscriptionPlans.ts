import { connectDB } from "@/lib/db";
import SubscriptionPlanConfig from "@/models/SubscriptionPlanConfig";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionDurationUnit,
  type SubscriptionPlan,
} from "@/app/_lib/subscriptionPlans";

const MAX_DAYS = 36_500;
const MAX_PRICE = 10_000_000;
const UNIT_LABELS: Record<SubscriptionDurationUnit, string> = {
  day: "Day", month: "Month", year: "Year",
};

function safeText(value: unknown, max: number, fallback = "") {
  return String(value ?? fallback).trim().replace(/[<>]/g, "").slice(0, max);
}

function durationDays(value: number, unit: SubscriptionDurationUnit) {
  if (unit === "year") return value * 365;
  if (unit === "month") return value * 30;
  return value;
}

function normalizePlan(value: any, index: number): SubscriptionPlan | null {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "").trim().toLowerCase();
  const name = safeText(value.name, 50);
  const durationValue = Number(value.durationValue);
  const durationUnit = value.durationUnit as SubscriptionDurationUnit;
  const price = Number(value.price);
  const regularPrice = Number(value.regularPrice);
  const days = durationDays(durationValue, durationUnit);
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 64 ||
    name.length < 2 || !Number.isInteger(durationValue) || durationValue < 1 ||
    !["day", "month", "year"].includes(durationUnit) ||
    !Number.isInteger(days) || days < 1 || days > MAX_DAYS ||
    !Number.isFinite(price) || !Number.isInteger(price) || price < 1 || price > MAX_PRICE ||
    !Number.isFinite(regularPrice) || !Number.isInteger(regularPrice) || regularPrice < price || regularPrice > MAX_PRICE
  ) return null;

  const months = durationUnit === "year"
    ? durationValue * 12
    : durationUnit === "month"
      ? durationValue
      : Math.max(1, Math.round(days / 30));
  const countLabel = `${durationValue} ${UNIT_LABELS[durationUnit]}${durationValue === 1 ? "" : "s"}`;
  // Preserve the existing day-based labels for the original three plans; all
  // newly created or edited plans receive a label generated from their duration.
  const duration = safeText(value.duration, 36, countLabel) || countLabel;
  return {
    id,
    name,
    duration,
    durationValue,
    durationUnit,
    months,
    days,
    price,
    regularPrice,
    note: safeText(value.note, 120, `Full access to all paid tools for ${countLabel.toLowerCase()}`),
    badge: safeText(value.badge, 40),
    active: value.active !== false,
    sortOrder: Number.isFinite(Number(value.sortOrder)) ? Number(value.sortOrder) : index,
  };
}

export function validateSubscriptionPlans(input: unknown): { plans: SubscriptionPlan[] | null; message?: string } {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) {
    return { plans: null, message: "Add between 1 and 100 subscription plans." };
  }
  const plans = input.map((item: unknown, index: number) => normalizePlan(item, index));
  if (plans.some((item: SubscriptionPlan | null) => !item)) {
    return { plans: null, message: "One or more plans have invalid names, durations, prices, or settings. Check each plan and try again." };
  }
  const validPlans = plans as SubscriptionPlan[];
  if (new Set(validPlans.map((item: SubscriptionPlan) => item.id)).size !== validPlans.length) {
    return { plans: null, message: "Every plan must have a unique plan ID." };
  }
  if (!validPlans.some((item: SubscriptionPlan) => item.active)) {
    return { plans: null, message: "At least one subscription plan must remain active." };
  }
  return { plans: validPlans.sort((a, b) => a.sortOrder - b.sortOrder) };
}

export async function getSubscriptionPlans(options?: { includeInactive?: boolean }): Promise<SubscriptionPlan[]> {
  await connectDB();
  const record = await SubscriptionPlanConfig.findOne({ key: "global" }).lean();
  const rawPlans = Array.isArray(record?.plans) && record.plans.length
    ? record.plans
    : SUBSCRIPTION_PLANS;
  const plans = rawPlans
    .map((item: any, index: number) => normalizePlan(item, index))
    .filter((item: SubscriptionPlan | null): item is SubscriptionPlan => Boolean(item))
    .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sortOrder - b.sortOrder);
  return options?.includeInactive ? plans : plans.filter((item: SubscriptionPlan) => item.active);
}

export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  const plans = await getSubscriptionPlans();
  return plans.find((item: SubscriptionPlan) => item.id === planId) || null;
}

export async function saveSubscriptionPlans(input: unknown, updatedBy: string) {
  const validation = validateSubscriptionPlans(input);
  if (!validation.plans) return validation;
  await connectDB();
  await SubscriptionPlanConfig.findOneAndUpdate(
    { key: "global" },
    { $set: { plans: validation.plans, updatedBy } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { plans: validation.plans };
}

/** Backward-compatibility duration for old pending orders created before plan snapshots existed. */
export function getLegacySubscriptionPlanDays(planId: string): number {
  if (planId === "3-month") return 90;
  const fallback = SUBSCRIPTION_PLANS.find((item: SubscriptionPlan) => item.id === planId);
  return fallback?.days || 0;
}
