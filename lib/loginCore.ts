/**
 * Pure login decision logic. It has no framework, database or bcrypt imports so
 * it can be unit-tested directly; the login route injects the real dependencies.
 */

export type LoginUserRecord = {
  _id: unknown;
  password?: unknown;
  role?: unknown;
  [key: string]: unknown;
};

export type LoginDeps<U extends LoginUserRecord> = {
  /** Called with a strictly string-valued filter, never with client objects. */
  findUser: (filter: { $or: [{ phoneNumber: string }, { email: string }] }) => Promise<U | null>;
  comparePassword: (plain: string, hash: string) => Promise<boolean>;
};

export type LoginFailureCategory =
  | "user_not_found"
  | "password_mismatch"
  | "missing_password_hash";

export type LoginOutcome<U extends LoginUserRecord> =
  | { kind: "ok"; user: U }
  | { kind: "bad_request" }
  | { kind: "invalid_credentials"; category: LoginFailureCategory };

export const MAX_IDENTIFIER_LENGTH = 254;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Accepts only strings. Objects such as {"$ne": ""} must never reach a Mongo
 * query, and numbers/arrays are rejected rather than coerced.
 * Email and phone are both trimmed; the lower-cased form matches the User
 * schema's `lowercase: true` email rule (phone numbers contain no letters).
 */
export function normalizeLoginIdentifier(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  if (!value || value.length > MAX_IDENTIFIER_LENGTH) return null;
  return value;
}

/** Picks the first non-empty submitted field; the login form sends `identifier`. */
export function pickSubmittedIdentifier(body: Record<string, unknown>): unknown {
  for (const key of ["identifier", "phoneNumber", "email"]) {
    const candidate = body[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") return candidate;
  }
  return "";
}

export async function authenticateLogin<U extends LoginUserRecord>(
  deps: LoginDeps<U>,
  body: unknown,
): Promise<LoginOutcome<U>> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { kind: "bad_request" };
  const record = body as Record<string, unknown>;

  const identifier = normalizeLoginIdentifier(pickSubmittedIdentifier(record));
  const password = record.password;
  if (
    !identifier ||
    typeof password !== "string" ||
    !password ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return { kind: "bad_request" };
  }

  const user = await deps.findUser({ $or: [{ phoneNumber: identifier }, { email: identifier }] });
  if (!user) return { kind: "invalid_credentials", category: "user_not_found" };

  if (typeof user.password !== "string" || !user.password) {
    return { kind: "invalid_credentials", category: "missing_password_hash" };
  }

  // Exceptions (for example a database fault) propagate to the caller and
  // become a 5xx; they are never converted into "wrong password".
  const matches = await deps.comparePassword(password, user.password);
  if (!matches) return { kind: "invalid_credentials", category: "password_mismatch" };

  return { kind: "ok", user };
}
