import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import mongoose from "mongoose";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_URI?.trim();
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!uri) throw new Error("MONGODB_URI is required. Set it in .env.local or the target environment.");
if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) throw new Error("A valid ADMIN_EMAIL is required before restoring ENV Main Admin mode.");
if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD is required before restoring ENV Main Admin mode.");

const rl = createInterface({ input, output });
try {
  console.log("\nSebaLagbe ENV Main Admin migration");
  await mongoose.connect(uri, { bufferCommands: false });
  const users = mongoose.connection.collection("users");
  const matching = await users.findOne({ email: adminEmail }, { projection: { _id: 1, email: 1, role: 1, isPrimaryAdmin: 1 } });
  const legacyPrimaryCount = await users.countDocuments({ isPrimaryAdmin: true });
  console.log(`Target database: ${mongoose.connection.name}`);
  console.log(`Configured Main Admin email: ${adminEmail}`);
  console.log(`Legacy primary-admin records: ${legacyPrimaryCount}`);
  console.log(`Matching DB account: ${matching ? `found (current role: ${matching.role || "user"})` : "not found"}`);
  console.log("\nThis migration does not delete users or change any password.");
  console.log("It clears legacy isPrimaryAdmin flags, revokes affected sessions, and demotes the DB record matching ADMIN_EMAIL to role=user.");
  console.log("Other role=admin accounts remain admins and become sub-admins.");
  const confirm = (await rl.question(`Type exactly RESTORE ENV ADMIN ${adminEmail} to continue: `)).trim();
  if (confirm !== `RESTORE ENV ADMIN ${adminEmail}`) {
    console.log("Cancelled. No database changes were made.");
    process.exitCode = 1;
  } else {
    const targets = await users.find({ $or: [{ isPrimaryAdmin: true }, { email: adminEmail }] }, { projection: { _id: 1, email: 1 } }).toArray();
    const operations = targets.map((doc) => {
      const isConfiguredAdminRecord = String(doc.email || "").trim().toLowerCase() === adminEmail;
      const set = { isPrimaryAdmin: false };
      if (isConfiguredAdminRecord) set.role = "user";
      return { updateOne: { filter: { _id: doc._id }, update: { $set: set, $inc: { sessionVersion: 1 } } } };
    });
    if (operations.length) await users.bulkWrite(operations, { ordered: true });
    const remaining = await users.countDocuments({ isPrimaryAdmin: true });
    const reserved = await users.findOne({ email: adminEmail }, { projection: { role: 1, isPrimaryAdmin: 1 } });
    if (remaining !== 0 || (reserved && (reserved.role === "admin" || reserved.isPrimaryAdmin === true))) {
      throw new Error("Migration verification failed. Review the DB records before deploying.");
    }
    console.log("\nENV Main Admin migration completed.");
    console.log(`Legacy primary flags remaining: ${remaining}`);
    console.log(`Configured ENV email DB role: ${reserved?.role || "no DB user"}`);
    console.log("The ENV Main Admin will authenticate only with ADMIN_EMAIL + ADMIN_PASSWORD.");
  }
} finally {
  await rl.close();
  await mongoose.disconnect().catch(() => undefined);
}
