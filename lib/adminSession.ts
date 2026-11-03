import { connectDB } from "@/lib/db";
import AdminSessionState from "@/models/AdminSessionState";

const KEY = "env-admin";

/** Called on every Main Admin login. Returns the new version to put in the token. */
export async function bumpEnvAdminSession(): Promise<number> {
  await connectDB();
  const doc = await AdminSessionState.findOneAndUpdate(
    { key: KEY },
    { $inc: { sessionVersion: 1 }, $setOnInsert: { key: KEY } },
    { upsert: true, new: true },
  ).lean<{ sessionVersion?: number }>();
  return Number(doc?.sessionVersion || 1);
}

/** True only while this token belongs to the most recent Main Admin login. */
export async function isEnvAdminSessionCurrent(claims: { adminSessionVersion?: number }): Promise<boolean> {
  try {
    await connectDB();
    const doc = await AdminSessionState.findOne({ key: KEY }).select("sessionVersion").lean<{ sessionVersion?: number }>();
    return Number(claims.adminSessionVersion || 0) === Number(doc?.sessionVersion || 0);
  } catch (error) {
    console.error("Main Admin session check failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
