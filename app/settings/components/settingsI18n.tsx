"use client";

import { useSebaLagbeToolsI18n } from "@/app/sohoj-tools/_i18n";
import { useCallback, type ReactNode } from "react";

/**
 * Page-local, hydration-safe English ↔ Bangla translations for Settings.
 * User-entered profile data is not translated; only interface text is.
 */
const SETTINGS_BN: Record<string, string> = {
  "account": "অ্যাকাউন্ট",
  "settings": "সেটিংস",
  "manage your personal information, password, and logged-in devices.": "আপনার ব্যক্তিগত তথ্য, পাসওয়ার্ড এবং লগ-ইন করা ডিভাইস পরিচালনা করুন।",
  "personal information": "ব্যক্তিগত তথ্য",
  "change password": "পাসওয়ার্ড পরিবর্তন",
  "devices login": "লগ-ইন করা ডিভাইস",
  "business information": "ব্যবসার তথ্য",
  "sessions": "সেশন",
  "security": "নিরাপত্তা",
  "account details": "অ্যাকাউন্টের বিবরণ",
  "update the personal details linked to your account.": "আপনার অ্যাকাউন্টের সঙ্গে যুক্ত ব্যক্তিগত তথ্য হালনাগাদ করুন।",
  "change your account password and keep your login secure.": "অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করে লগ-ইন নিরাপদ রাখুন।",
  "review the devices and sessions currently associated with your account.": "আপনার অ্যাকাউন্টে বর্তমানে যুক্ত ডিভাইস ও সেশনগুলো দেখুন।",
  "loading settings...": "সেটিংস লোড হচ্ছে...",
  "refresh": "রিফ্রেশ",
  "edit": "সম্পাদনা",
  "full name": "পূর্ণ নাম",
  "phone number": "ফোন নম্বর",
  "country": "দেশ",
  "bangladesh": "বাংলাদেশ",
  "profession / designation": "পেশা / পদবি",
  "gender": "লিঙ্গ",
  "male": "পুরুষ",
  "female": "নারী",
  "other": "অন্যান্য",
  "date of birth": "জন্মতারিখ",
  "district": "জেলা",
  "thana / upazila": "থানা / উপজেলা",
  "postcode": "পোস্টকোড",
  "address": "ঠিকানা",
  "about": "পরিচিতি",
  "about yourself": "আপনার সম্পর্কে",
  "not provided": "দেওয়া হয়নি",
  "guest user": "অতিথি ব্যবহারকারী",
  "email": "ইমেইল",
  "verified": "যাচাইকৃত",
  "not verified": "যাচাই করা হয়নি",
  "verify your email to earn the bonus": "বোনাস পেতে আপনার ইমেইল যাচাই করুন",
  "sending...": "পাঠানো হচ্ছে...",
  "verify": "যাচাই করুন",
  "edit personal information": "ব্যক্তিগত তথ্য সম্পাদনা",
  "update your information and save it to your account.": "আপনার তথ্য হালনাগাদ করে অ্যাকাউন্টে সংরক্ষণ করুন।",
  "enter full name": "পূর্ণ নাম লিখুন",
  "enter phone number": "ফোন নম্বর লিখুন",
  "e.g. developer": "যেমন: ডেভেলপার",
  "enter district": "জেলার নাম লিখুন",
  "enter thana / upazila": "থানা / উপজেলার নাম লিখুন",
  "enter postcode": "পোস্টকোড লিখুন",
  "enter your address": "আপনার ঠিকানা লিখুন",
  "tell us a little about yourself": "আপনার সম্পর্কে সংক্ষেপে লিখুন",
  "cancel": "বাতিল",
  "saving...": "সংরক্ষণ করা হচ্ছে...",
  "save changes": "পরিবর্তন সংরক্ষণ",
  "current password": "বর্তমান পাসওয়ার্ড",
  "new password": "নতুন পাসওয়ার্ড",
  "confirm new password": "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  "use at least 8 characters for your new password.": "নতুন পাসওয়ার্ডে অন্তত ৮টি অক্ষর ব্যবহার করুন।",
  "updating...": "হালনাগাদ করা হচ্ছে...",
  "update password": "পাসওয়ার্ড হালনাগাদ",
  "loading devices...": "ডিভাইস লোড হচ্ছে...",
  "no device data found": "কোনো ডিভাইসের তথ্য পাওয়া যায়নি",
  "your devices api returned no active sessions.": "ডিভাইস API-তে কোনো সক্রিয় সেশন পাওয়া যায়নি।",
  "unknown device": "অজানা ডিভাইস",
  "current device": "বর্তমান ডিভাইস",
  "device details unavailable": "ডিভাইসের বিবরণ পাওয়া যাচ্ছে না",
  "last active": "সর্বশেষ সক্রিয়",
  "unknown": "অজানা",
  "show password": "পাসওয়ার্ড দেখুন",
  "hide password": "পাসওয়ার্ড লুকান",
  "unable to load your settings.": "সেটিংস লোড করা যায়নি।",
  "unable to load login devices.": "লগ-ইন করা ডিভাইসের তথ্য লোড করা যায়নি।",
  "full name is required.": "পূর্ণ নাম দেওয়া আবশ্যক।",
  "unable to update your personal information.": "ব্যক্তিগত তথ্য হালনাগাদ করা যায়নি।",
  "personal information updated successfully.": "ব্যক্তিগত তথ্য সফলভাবে হালনাগাদ হয়েছে।",
  "no email address is available for verification.": "যাচাই করার জন্য কোনো ইমেইল ঠিকানা পাওয়া যায়নি।",
  "unable to send verification email.": "যাচাইকরণ ইমেইল পাঠানো যায়নি।",
  "verification email sent. please check your inbox.": "যাচাইকরণ ইমেইল পাঠানো হয়েছে। আপনার ইনবক্স দেখুন।",
  "please complete all password fields.": "পাসওয়ার্ডের সব ঘর পূরণ করুন।",
  "new password must be at least 8 characters long.": "নতুন পাসওয়ার্ডে অন্তত ৮টি অক্ষর থাকতে হবে।",
  "new password and confirmation do not match.": "নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।",
  "unable to change your password.": "পাসওয়ার্ড পরিবর্তন করা যায়নি।",
  "password changed successfully.": "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।",
};

function normalizeSettingsText(value: string): string {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function translateSettingsText(
  value: string,
  locale: string | undefined,
  baseL: (value: string) => string,
): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return raw;

  const key = normalizeSettingsText(raw);
  if (!key) return raw;

  const exact = SETTINGS_BN[key];
  if (exact !== undefined) return exact;

  let match = /^select (.+)$/i.exec(key);
  if (match) {
    const label = translateSettingsText(match[1], locale, baseL);
    return `${label} নির্বাচন করুন`;
  }

  const translated = baseL(raw);
  if (translated && translated !== raw) {
    const hasBangla = /[\u0980-\u09FF]/.test(translated);
    const residualEnglish = /[A-Za-z]/.test(
      translated.replace(/\b(?:API|AI|PDF|JPG|PNG|WebP|URL|IP|OTP)\b/g, ""),
    );
    if (hasBangla && !residualEnglish) return translated;
  }
  return raw;
}

export function useSettingsText() {
  const { locale, L: baseL } = useSebaLagbeToolsI18n();
  const t = useCallback(
    (value: string) => translateSettingsText(value, locale, baseL),
    [locale, baseL],
  );
  return { t, locale };
}

export function T({ children }: { children: ReactNode }) {
  const { t } = useSettingsText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}
