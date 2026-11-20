// OPTIONAL one-time migration. Safe by default: it only PRINTS what it would change.
//   Preview : node scripts/mark-existing-users-verified.mjs
//   Apply   : node scripts/mark-existing-users-verified.mjs --apply
// Only users that do NOT have the isEmailVerified field yet are touched, and only
// if they were created on/after --since (default: all). Take a DB backup before --apply.
//   Optional: --since=2025-01-01  (use the date when OTP-at-registration went live)
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const sinceArg = process.argv.find((a) => a.startsWith("--since="));
const since = sinceArg ? new Date(sinceArg.split("=")[1]) : null;
if (since && Number.isNaN(since.getTime())) { console.error("Invalid --since date."); process.exit(1); }
if (!process.env.MONGODB_URI) { console.error("Set MONGODB_URI first."); process.exit(1); }

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.collection("users");
const filter = { isEmailVerified: { $exists: false }, role: { $ne: "admin" }, ...(since ? { createdAt: { $gte: since } } : {}) };
const total = await users.countDocuments(filter);
console.log(`${total} user(s) match.`);
if (apply) {
  const r = await users.updateMany(filter, { $set: { isEmailVerified: true, emailVerifiedAt: new Date() } });
  console.log(`Updated ${r.modifiedCount} user(s).`);
} else {
  console.log("Preview only. Re-run with --apply to write.");
}
await mongoose.disconnect();
