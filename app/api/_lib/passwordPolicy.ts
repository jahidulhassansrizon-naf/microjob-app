const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "0123456789",
  "87654321",
  "654321",
  "11111111",
  "00000000",
  "password",
  "password1",
  "password123",
  "passw0rd",
  "qwerty",
  "qwerty12",
  "qwerty123",
  "qwertyuiop",
  "asdfghjk",
  "abc12345",
  "letmein",
  "welcome1",
  "admin123",
  "iloveyou",
]);

export const BCRYPT_MAX_PASSWORD_BYTES = 72;

// bcryptjs is pure JS, so every cost step doubles Active CPU. 10 is the OWASP-accepted minimum;
// existing hashes (cost 12) keep verifying because the cost is stored inside each hash.
export const BCRYPT_COST = 10;

export type NewPasswordValidation =
  | { valid: true }
  | { valid: false; reason: "too_short" | "too_long" | "common" };

/** Validate new passwords before bcrypt hashing; login deliberately has no 72-byte cap. */
export function validateNewPassword(password: string): NewPasswordValidation {
  if (password.length < 8) return { valid: false, reason: "too_short" };
  if (Buffer.byteLength(password, "utf8") > BCRYPT_MAX_PASSWORD_BYTES) {
    return { valid: false, reason: "too_long" };
  }

  const normalized = password.trim().toLowerCase();
  if (
    COMMON_PASSWORDS.has(normalized) ||
    /^([0-9])\1{7,}$/.test(normalized) ||
    /^(?:1234567890|0123456789|9876543210)$/.test(normalized)
  ) {
    return { valid: false, reason: "common" };
  }

  return { valid: true };
}

export function newPasswordErrorMessage(validation: Exclude<NewPasswordValidation, { valid: true }>): string {
  switch (validation.reason) {
    case "too_short": return "Password must be at least 8 characters long.";
    case "too_long": return "Password must not exceed 72 UTF-8 bytes.";
    case "common": return "Choose a stronger password that is not commonly used.";
  }
}
