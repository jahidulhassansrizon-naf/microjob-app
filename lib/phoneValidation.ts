export const countryPhoneRules: Record<
  string,
  { code: string; minLen: number; maxLen: number; example: string }
> = {
  Bangladesh: { code: "+880", minLen: 11, maxLen: 11, example: "017XXXXXXXX" },
  India: { code: "+91", minLen: 10, maxLen: 10, example: "9876543210" },
  "United States": { code: "+1", minLen: 10, maxLen: 10, example: "2025550143" },
  "United Kingdom": { code: "+44", minLen: 10, maxLen: 10, example: "7911123456" },
};

const BD_MOBILE_PATTERN = /^01[3-9]\d{8}$/;
const PHONE_INPUT_PATTERN = /^[+\d\s().-]+$/;

function countryNameFromValue(countryString?: string): string {
  return countryString ? countryString.split(" (")[0].trim() : "";
}

function digitsFromPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !PHONE_INPUT_PATTERN.test(trimmed)) return null;
  return trimmed.replace(/\D/g, "");
}

/** Convert Bangladesh local or international notation to canonical 01XXXXXXXXX. */
export function normalizeBangladeshPhoneNumber(value: string): string | null {
  let digits = digitsFromPhone(value);
  if (!digits) return null;

  if (digits.startsWith("00880")) digits = digits.slice(2);
  if (digits.startsWith("880")) digits = digits.slice(3);

  if (digits.length === 10 && /^1[3-9]\d{8}$/.test(digits)) {
    digits = `0${digits}`;
  }

  return BD_MOBILE_PATTERN.test(digits) ? digits : null;
}

/**
 * Normalizes a phone number for storage based on its selected country. For
 * Bangladesh this always returns the canonical local 11-digit form.
 */
export function normalizePhoneNumber(countryString?: string, phoneNumber?: string): string | null {
  if (typeof phoneNumber !== "string") return null;
  const countryName = countryNameFromValue(countryString);

  if (countryName === "Bangladesh") return normalizeBangladeshPhoneNumber(phoneNumber);

  const digits = digitsFromPhone(phoneNumber);
  if (!digits) return null;
  const rule = countryPhoneRules[countryName];
  if (rule) {
    if (digits.length < rule.minLen || digits.length > rule.maxLen) return null;
  } else if (digits.length < 5 || digits.length > 15) {
    return null;
  }
  return digits;
}

/** Legacy aliases allow sign-in without migrating existing phoneNumber values. */
export function getPhoneLookupVariants(value: string): string[] {
  const normalized = normalizeBangladeshPhoneNumber(value);
  if (normalized) {
    const nationalWithoutZero = normalized.slice(1);
    return Array.from(new Set([
      normalized,
      nationalWithoutZero,
      `880${nationalWithoutZero}`,
      `+880${nationalWithoutZero}`,
      `00880${nationalWithoutZero}`,
    ]));
  }

  const digits = digitsFromPhone(value);
  return digits && digits.length >= 5 && digits.length <= 15 ? Array.from(new Set([digits, value.trim()])) : [];
}

/** Stable account-key identity for login throttling across BD number formats. */
export function normalizePhoneRateLimitIdentity(value: string): string {
  return normalizeBangladeshPhoneNumber(value) || value.trim().toLowerCase();
}

export const validatePhoneNumber = (
  countryString?: string,
  phoneNumber?: string,
): string | null => {
  if (typeof phoneNumber !== "string" || !phoneNumber.trim()) return "Phone number is required!";
  const countryName = countryNameFromValue(countryString);
  const rule = countryPhoneRules[countryName];
  const normalized = normalizePhoneNumber(countryString, phoneNumber);

  if (!normalized) {
    if (countryName === "Bangladesh") {
      return "For Bangladesh, enter a valid mobile number starting with 013–019 (11 digits), or use the +880 country-code format.";
    }
    if (rule) {
      return `For ${countryName}, phone number must contain ${rule.minLen} to ${rule.maxLen} digits (e.g. ${rule.example})!`;
    }
    return "Please enter a valid phone number!";
  }
  return null;
};
