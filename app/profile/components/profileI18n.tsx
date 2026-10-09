"use client";

import { useSohozI18n } from "@/app/sohoj-tools/_i18n";
import { useCallback, type ReactNode } from "react";

/**
 * Profile-page-local, hydration-safe English ↔ Bangla UI translations.
 * User-entered profile values and device data are intentionally left unchanged.
 */
const PROFILE_BN: Record<string, string> = {
  "my profile": "আমার প্রোফাইল",
  "your profile and subscription overview.": "আপনার প্রোফাইল ও সাবস্ক্রিপশনের সারসংক্ষেপ।",
  "profile": "প্রোফাইল",
  "user account": "ব্যবহারকারীর অ্যাকাউন্ট",
  "user": "ব্যবহারকারী",
  "guest user": "অতিথি ব্যবহারকারী",
  "subscription": "সাবস্ক্রিপশন",
  "no active plan": "কোনো সক্রিয় প্ল্যান নেই",
  "view plans": "প্ল্যান দেখুন",
  "active": "সক্রিয়",
  "expired": "মেয়াদ শেষ",
  "not available": "পাওয়া যাচ্ছে না",
  "current plan": "বর্তমান প্ল্যান",
  "subscription end date is not available": "সাবস্ক্রিপশনের মেয়াদ শেষ হওয়ার তারিখ পাওয়া যায়নি",
  "your subscription expiry field is not present in the supplied profile data yet.": "আপনার দেওয়া প্রোফাইল তথ্যে এখনো সাবস্ক্রিপশনের মেয়াদ শেষ হওয়ার তথ্য নেই।",
  "your subscription has expired.": "আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে।",
  "time remaining on your current subscription.": "আপনার বর্তমান সাবস্ক্রিপশনের অবশিষ্ট সময়।",
  "your plan": "আপনার প্ল্যান",
  "started": "শুরু হয়েছে",
  "expires": "মেয়াদ শেষ হবে",
  "amount paid": "পরিশোধিত অর্থ",
  "renew before": "নবায়ন করুন",
  "no active subscription": "কোনো সক্রিয় সাবস্ক্রিপশন নেই",
  "profile complete": "প্রোফাইল সম্পূর্ণ",
  "profile info incomplete": "প্রোফাইলের তথ্য অসম্পূর্ণ",
  "18 credit bonus": "১৮ ক্রেডিট বোনাস",
  "your profile information is complete.": "আপনার প্রোফাইলের তথ্য সম্পূর্ণ।",
  "everything is filled in.": "সব তথ্য পূরণ করা হয়েছে।",
  "personal information": "ব্যক্তিগত তথ্য",
  "devices login": "লগইন করা ডিভাইস",
  "edit personal information": "ব্যক্তিগত তথ্য সম্পাদনা করুন",
  "update your information and save it to your account.": "আপনার তথ্য হালনাগাদ করে অ্যাকাউন্টে সংরক্ষণ করুন।",
  "enter full name": "পূর্ণ নাম লিখুন",
  "enter phone number": "ফোন নম্বর লিখুন",
  "bangladesh": "বাংলাদেশ",
  "e.g. developer": "যেমন: ডেভেলপার",
  "profession": "পেশা",
  "designation": "পদবি",
  "male": "পুরুষ",
  "female": "নারী",
  "other": "অন্যান্য",
  "enter district": "জেলার নাম লিখুন",
  "enter thana / upazila": "থানা / উপজেলার নাম লিখুন",
  "postcode": "পোস্টকোড",
  "enter postcode": "পোস্টকোড লিখুন",
  "enter your address": "আপনার ঠিকানা লিখুন",
  "about": "আপনার সম্পর্কে",
  "tell us a little about yourself": "নিজের সম্পর্কে সংক্ষেপে লিখুন",
  "cancel": "বাতিল",
  "save changes": "পরিবর্তন সংরক্ষণ করুন",
  "saving...": "সংরক্ষণ করা হচ্ছে...",
  "save": "সংরক্ষণ করুন",
  "saved": "সংরক্ষিত হয়েছে",
  "shop / business information": "দোকান / ব্যবসার তথ্য",
  "business name": "ব্যবসার নাম",
  "enter business name": "ব্যবসার নাম লিখুন",
  "business type": "ব্যবসার ধরন",
  "e.g. retail, agency, shop": "যেমন: খুচরা বিক্রয়, এজেন্সি, দোকান",
  "trade license": "ট্রেড লাইসেন্স",
  "enter trade license number": "ট্রেড লাইসেন্স নম্বর লিখুন",
  "business phone": "ব্যবসার ফোন নম্বর",
  "enter business phone": "ব্যবসার ফোন নম্বর লিখুন",
  "website": "ওয়েবসাইট",
  "business address": "ব্যবসার ঠিকানা",
  "enter complete business address": "ব্যবসার সম্পূর্ণ ঠিকানা লিখুন",
  "business information is empty right now. add your shop/business details above.": "ব্যবসার তথ্য এখনো দেওয়া হয়নি। উপরে আপনার দোকান বা ব্যবসার তথ্য যোগ করুন।",
  "change password": "পাসওয়ার্ড পরিবর্তন করুন",
  "use at least 8 characters for your new password.": "নতুন পাসওয়ার্ডে অন্তত ৮টি অক্ষর ব্যবহার করুন।",
  "current password": "বর্তমান পাসওয়ার্ড",
  "new password": "নতুন পাসওয়ার্ড",
  "confirm new password": "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  "updating...": "হালনাগাদ করা হচ্ছে...",
  "update password": "পাসওয়ার্ড হালনাগাদ করুন",
  "show password": "পাসওয়ার্ড দেখুন",
  "hide password": "পাসওয়ার্ড লুকান",
  "your credit is running low!": "আপনার ক্রেডিট প্রায় শেষ!",
  "click here to buy credit": "ক্রেডিট কিনতে এখানে ক্লিক করুন",
  "credit": "ক্রেডিট",
  "credits": "ক্রেডিট",
  "left.": "বাকি।",
  "review the devices currently associated with your account.": "আপনার অ্যাকাউন্টে বর্তমানে যুক্ত ডিভাইসগুলো দেখুন।",
  "refresh": "রিফ্রেশ",
  "loading devices...": "ডিভাইসের তথ্য লোড হচ্ছে...",
  "no device data found": "কোনো ডিভাইসের তথ্য পাওয়া যায়নি",
  "your devices api returned no active sessions.": "ডিভাইস API-তে কোনো সক্রিয় সেশন পাওয়া যায়নি।",
  "unknown device": "অজানা ডিভাইস",
  "current device": "বর্তমান ডিভাইস",
  "device details unavailable": "ডিভাইসের বিবরণ পাওয়া যাচ্ছে না",
  "last active": "সর্বশেষ সক্রিয়",
  "unknown": "অজানা",
  "not provided": "দেওয়া হয়নি",
  "edit": "সম্পাদনা",
  "email": "ইমেইল",
  "verified": "যাচাইকৃত",
  "not verified": "যাচাই করা হয়নি",
  "verify your email to earn the bonus": "বোনাস পেতে আপনার ইমেইল যাচাই করুন",
  "sending...": "পাঠানো হচ্ছে...",
  "verify": "যাচাই করুন",
  "full name": "পূর্ণ নাম",
  "phone number": "ফোন নম্বর",
  "country": "দেশ",
  "profession / designation": "পেশা / পদবি",
  "gender": "লিঙ্গ",
  "date of birth": "জন্মতারিখ",
  "address": "ঠিকানা",
  "district": "জেলা",
  "thana / upazila": "থানা / উপজেলা",
  "about yourself": "আপনার সম্পর্কে",
  "profile photo": "প্রোফাইল ছবি",
  "change profile photo": "প্রোফাইল ছবি পরিবর্তন করুন",
  "upload or change profile photo": "প্রোফাইল ছবি আপলোড বা পরিবর্তন করুন",
  "upload or change photo": "ছবি আপলোড বা পরিবর্তন করুন",
  "delete profile photo": "প্রোফাইল ছবি মুছে দিন",
  "are you sure you want to delete your profile photo?": "আপনি কি নিশ্চিত যে প্রোফাইল ছবিটি মুছে ফেলতে চান?",
  "uploading your photo to cloudinary...": "আপনার ছবি আপলোড করা হচ্ছে...",
  "deleting your profile photo...": "প্রোফাইল ছবি মুছে ফেলা হচ্ছে...",
  "click your photo to change it, or use the red button to delete it.": "ছবি পরিবর্তন করতে সেটিতে ক্লিক করুন, অথবা লাল বোতামে ক্লিক করে মুছে দিন।",
  "click your photo to upload a profile picture.": "প্রোফাইল ছবি আপলোড করতে আপনার ছবিতে ক্লিক করুন।",
  "profile image must be 5 mb or smaller.": "প্রোফাইল ছবির আকার সর্বোচ্চ ৫ MB হতে হবে।",
  "profile photo upload failed.": "প্রোফাইল ছবি আপলোড করা যায়নি।",
  "profile photo upload failed. please try again.": "প্রোফাইল ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।",
  "profile photo delete failed.": "প্রোফাইল ছবি মুছে ফেলা যায়নি।",
  "profile photo delete failed. please try again.": "প্রোফাইল ছবি মুছে ফেলা যায়নি। আবার চেষ্টা করুন।",
  "jpg, png, webp or gif image select.": "JPG, PNG, WebP অথবা GIF ফরম্যাটের ছবি নির্বাচন করুন।",
  "unable to load your profile.": "আপনার প্রোফাইল লোড করা যায়নি।",
  "failed to fetch": "সার্ভার থেকে তথ্য আনা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
  "network request failed": "নেটওয়ার্কের সমস্যার কারণে অনুরোধ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
  "authentication required": "প্রথমে আপনার অ্যাকাউন্টে প্রবেশ করুন।",
  "subscription status": "সাবস্ক্রিপশনের অবস্থা",
  "unable to load subscription status.": "সাবস্ক্রিপশনের অবস্থা লোড করা যায়নি।",
  "subscription time used": "ব্যবহৃত সাবস্ক্রিপশনের সময়",
  "pick a plan to unlock all the editing tools.": "সব সম্পাদনা-টুল ব্যবহার করতে একটি প্ল্যান বেছে নিন।",
  "renew plan": "প্ল্যান নবায়ন করুন",
  "manage subscription": "সাবস্ক্রিপশন পরিচালনা করুন",
  "your access is active": "আপনার অ্যাক্সেস চালু আছে",
  "try again": "আবার চেষ্টা করুন",
};

function normalizeProfileText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function translateProfileText(value: string, locale: string | undefined): string {
  const raw = String(value ?? "");
  if (!locale || !String(locale).toLowerCase().startsWith("bn")) return raw;

  const key = normalizeProfileText(raw);
  if (!key) return raw;

  const exact = PROFILE_BN[key];
  if (exact !== undefined) return exact;

  let match = /^your profile is (\d+)% complete\. complete the remaining information to improve your profile\.?$/i.exec(key);
  if (match) return `আপনার প্রোফাইল ${match[1]}% সম্পূর্ণ। প্রোফাইল আরও উন্নত করতে বাকি তথ্য পূরণ করুন।`;

  match = /^(\d+)% of your profile is still incomplete\.?$/i.exec(key);
  if (match) return `আপনার প্রোফাইলের ${match[1]}% তথ্য এখনো অসম্পূর্ণ।`;

  match = /^currently you have only (\d+) credits? left\.?$/i.exec(key);
  if (match) return `আপনার কাছে বর্তমানে মাত্র ${match[1]} ক্রেডিট বাকি আছে।`;

  match = /^renew before (.+) to keep your access\.?$/i.exec(raw.replace(/\s+/g, " ").trim());
  if (match) return `অ্যাক্সেস চালু রাখতে ${match[1]}-এর আগে নবায়ন করুন।`;

  match = /^your plan ended on (.+?)\.?$/i.exec(raw.replace(/\s+/g, " ").trim());
  if (match) return `আপনার প্ল্যানের মেয়াদ ${match[1]} তারিখে শেষ হয়েছে।`;

  match = /^ends (.+)$/i.exec(raw.replace(/\s+/g, " ").trim());
  if (match) return `মেয়াদ শেষ হবে: ${match[1]}`;

  match = /^(\d+)\s+days?$/i.exec(key);
  if (match) return `${match[1]} দিন`;

  match = /^(\d+)d\s+(\d+)h\s+(\d+)m$/i.exec(key);
  if (match) return `${match[1]} দিন ${match[2]} ঘণ্টা ${match[3]} মিনিট`;

  match = /^(\d+)h\s+(\d+)m\s+(\d+)s$/i.exec(key);
  if (match) return `${match[1]} ঘণ্টা ${match[2]} মিনিট ${match[3]} সেকেন্ড`;

  match = /^(\d+)h\s+(\d+)m$/i.exec(key);
  if (match) return `${match[1]} ঘণ্টা ${match[2]} মিনিট`;

  match = /^(\d+)m\s+(\d+)s$/i.exec(key);
  if (match) return `${match[1]} মিনিট ${match[2]} সেকেন্ড`;

  match = /^(\d+)m remaining$/i.exec(key);
  if (match) return `${match[1]} মিনিট বাকি`;

  match = /^(\d+)h\s+(\d+)m remaining$/i.exec(key);
  if (match) return `${match[1]} ঘণ্টা ${match[2]} মিনিট বাকি`;

  match = /^select (.+)$/i.exec(key);
  if (match) return `${translateProfileText(match[1], locale)} নির্বাচন করুন`;

  return raw;
}

export function useProfileText() {
  const { locale } = useSohozI18n();
  const t = useCallback((value: string) => translateProfileText(value, locale), [locale]);
  return { t, locale };
}

export function T({ children }: { children: ReactNode }) {
  const { t } = useProfileText();
  if (typeof children !== "string") return <>{children}</>;
  return <>{t(children)}</>;
}
