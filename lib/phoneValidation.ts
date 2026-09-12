export const countryPhoneRules: Record<
  string,
  { code: string; minLen: number; maxLen: number; example: string }
> = {
  Bangladesh: { code: "+880", minLen: 10, maxLen: 11, example: "017XXXXXXXX" },
  India: { code: "+91", minLen: 10, maxLen: 10, example: "9876543210" },
  "United States": {
    code: "+1",
    minLen: 10,
    maxLen: 10,
    example: "2025550143",
  },
  "United Kingdom": {
    code: "+44",
    minLen: 10,
    maxLen: 10,
    example: "7911123456",
  },
};

export const validatePhoneNumber = (
  countryString?: string,
  phoneNumber?: string,
): string | null => {
  if (!phoneNumber) return "Phone number is required!";
  const countryName = countryString ? countryString.split(" (")[0].trim() : "";
  const rule = countryPhoneRules[countryName];
  const cleanNum = phoneNumber.toString().trim();

  if (rule) {
    if (cleanNum.length < rule.minLen || cleanNum.length > rule.maxLen) {
      return `For ${countryName}, phone number must be between ${rule.minLen} and ${rule.maxLen} digits! (e.g. ${rule.example})`;
    }
  } else {
    if (cleanNum.length < 5 || cleanNum.length > 15) {
      return "Please enter a valid phone number!";
    }
  }
  return null;
};
