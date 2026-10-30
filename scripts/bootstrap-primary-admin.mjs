#!/usr/bin/env node
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { createHash } from "node:crypto";
import { loadEnvConfig } from "@next/env";

function loadProjectEnv() {
  // Match the same environment-file precedence used by Next.js. This avoids
  // provisioning an admin in .env.local while `next dev` reads
  // .env.development.local (or an unexpected production env file).
  const dev = process.env.NODE_ENV !== "production";
  loadEnvConfig(process.cwd(), dev);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function question(prompt) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  return new Promise((resolveQuestion) => rl.question(prompt, (answer) => {
    rl.close();
    resolveQuestion(answer.trim());
  }));
}

function secret(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Password entry requires an interactive terminal so the password is not echoed.");
  }
  return new Promise((resolveSecret, rejectSecret) => {
    stdout.write(prompt);
    let value = "";
    const onData = (buffer) => {
      const input = buffer.toString("utf8");
      for (const char of input) {
        if (char === "\u0003") {
          cleanup();
          stdout.write("\nCancelled.\n");
          rejectSecret(new Error("Cancelled by user"));
          return;
        }
        if (char === "\r" || char === "\n") {
          cleanup();
          stdout.write("\n");
          resolveSecret(value);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
        } else if (char >= " ") {
          value += char;
        }
      }
    };
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

const normalizeEmail = (value) => value.trim().toLowerCase();
const normalizeName = (value) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();

async function main() {
  loadProjectEnv();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required. Put it in .env.local or export it for this command.");

  console.log("\nSebaLagbe one-time Primary Admin setup\n");
  console.log("This creates/promotes exactly one MongoDB user. It does NOT need ADMIN_EMAIL or ADMIN_PASSWORD.\n");
  const email = normalizeEmail(await question("Primary admin email: "));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("Enter a valid email address.");

  await mongoose.connect(uri, { autoIndex: false, bufferCommands: false });
  const schema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    fullNameNormalized: { type: String },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    country: { type: String, default: "Bangladesh" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isPrimaryAdmin: { type: Boolean, default: false },
    password: { type: String, required: true },
    sessionVersion: { type: Number, default: 0 },
    passwordChangedAt: { type: Date, default: null },
  }, { timestamps: true, collection: "users", autoIndex: false, strict: false });
  const User = mongoose.models.User || mongoose.model("User", schema, "users");

  // Make the most important invariants database-enforced before provisioning.
  // If existing data violates uniqueness, stop and require cleanup rather than
  // silently proceeding with a weaker setup.
  await User.collection.createIndex(
    { isPrimaryAdmin: 1 },
    { unique: true, name: "uniq_primary_admin_account", partialFilterExpression: { isPrimaryAdmin: true } },
  );
  await User.collection.createIndex(
    { fullNameNormalized: 1 },
    { unique: true, name: "uniq_users_full_name_normalized", partialFilterExpression: { fullNameNormalized: { $type: "string" } } },
  );

  const existingPrimary = await User.findOne({ isPrimaryAdmin: true }).select("_id email").lean();
  const existingByEmail = await User.findOne({ email }).select("_id fullName phoneNumber email role isPrimaryAdmin fullNameNormalized").lean();
  if (existingPrimary && String(existingPrimary._id) !== String(existingByEmail?._id || "")) {
    throw new Error(`A primary administrator already exists (${existingPrimary.email}). Stop here; do not create a second primary admin.`);
  }
  const emailVariantsBeforeWrite = await User.countDocuments({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });
  if (emailVariantsBeforeWrite > 1) {
    throw new Error(`Multiple accounts match ${email} ignoring case. Resolve duplicate email records before changing any password.`);
  }
  if (existingByEmail && emailVariantsBeforeWrite !== 1) {
    throw new Error("The existing account could not be uniquely identified. No password was changed.");
  }

  let fullName = String(existingByEmail?.fullName || "").trim();
  let phoneNumber = String(existingByEmail?.phoneNumber || "").trim();
  if (!existingByEmail) {
    fullName = (await question("Admin full name: ")).normalize("NFKC").trim().replace(/\s+/gu, " ");
    phoneNumber = (await question("Admin phone number (digits only, 5-15 digits): ")).trim();
    if (!fullName || fullName.length > 100) throw new Error("Full name must be 1-100 characters.");
    if (!/^\d{5,15}$/.test(phoneNumber)) throw new Error("Phone number must contain 5-15 digits.");
    const phoneOwner = await User.findOne({ phoneNumber }).select("_id").lean();
    if (phoneOwner) throw new Error("This phone number is already in use by another account.");
  }

  const normalizedName = normalizeName(fullName);
  const legacyNamePattern = new RegExp(`^\\s*${fullName.trim().split(/\s+/).map(escapeRegex).join("\\s+")}\\s*$`, "i");
  const duplicateNameQuery = {
    _id: existingByEmail ? { $ne: existingByEmail._id } : { $exists: true },
    $or: [
      { fullNameNormalized: normalizedName },
      { fullName: { $regex: legacyNamePattern }, $or: [{ fullNameNormalized: { $exists: false } }, { fullNameNormalized: null }, { fullNameNormalized: "" }] },
    ],
  };
  const duplicateName = await User.findOne(duplicateNameQuery).select("_id").lean();
  if (duplicateName) throw new Error("This name is already in use. Choose a distinct admin name.");

  const password = await secret("Primary admin password (minimum 12 characters): ");
  const passwordAgain = await secret("Repeat password: ");
  if (password.length < 12 || password.length > 128) throw new Error("Admin password must be 12-128 characters long.");
  if (password !== passwordAgain) throw new Error("Passwords do not match.");

  const existingDescription = existingByEmail
    ? `Promote/update the existing account ${email} (${existingByEmail.fullName || "no name"}) as Primary Admin and reset its password?`
    : `Create a new Primary Admin account for ${email}?`;
  console.log(`\n${existingDescription}`);
  const confirmation = await question('Type exactly "MAKE PRIMARY ADMIN" to continue: ');
  if (confirmation !== "MAKE PRIMARY ADMIN") throw new Error("Confirmation text did not match. No account was changed.");

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  if (existingByEmail) {
    await User.updateOne(
      { _id: existingByEmail._id },
      { $set: { role: "admin", isPrimaryAdmin: true, fullNameNormalized: normalizedName, password: passwordHash, passwordChangedAt: now }, $inc: { sessionVersion: 1 } },
      { runValidators: true },
    );
  } else {
    await User.create({
      fullName,
      fullNameNormalized: normalizeName(fullName),
      phoneNumber,
      email,
      role: "admin",
      isPrimaryAdmin: true,
      password: passwordHash,
      sessionVersion: 1,
      passwordChangedAt: now,
      country: "Bangladesh",
    });
  }

  // Read-back verification against the same database the login API will query.
  // This proves the stored hash verifies with bcryptjs (the library the login
  // route uses) and surfaces wrong-database or duplicate-email situations.
  const stored = await User.findOne({ email }).select("password role isPrimaryAdmin").lean();
  const emailVariants = await User.countDocuments({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });
  const hashVerifies = typeof stored?.password === "string" && (await bcrypt.compare(password, stored.password));
  if (!stored || stored.role !== "admin" || stored.isPrimaryAdmin !== true || !hashVerifies) {
    throw new Error("Post-write verification FAILED: the saved account does not verify with the entered password. Do not rely on this setup.");
  }
  if (emailVariants !== 1) {
    console.warn(`WARNING: ${emailVariants} user documents match this email ignoring case. Resolve duplicates before relying on login.`);
  }
  console.log(`\nVerified in database "${mongoose.connection.name}" (host ${mongoose.connection.host}): role=admin, isPrimaryAdmin=true, password hash verifies.`);
  console.log("Run this command separately for each database (local and production) that must accept this login.");
  console.log("\nPrimary Admin setup completed.");
  console.log("- Sign in with this email and the password you just set.");
  console.log("- The password is saved only as a bcrypt hash.");
  console.log("- All previous sessions for an existing account were revoked.");
  console.log("- After testing the new login, remove ADMIN_EMAIL and ADMIN_PASSWORD from local/Vercel env settings.");
  console.log("- Keep MONGODB_URI and a strong JWT_SECRET configured on the server.\n");
  console.log(`Provisioning audit reference: ${createHash("sha256").update(email).digest("hex").slice(0, 12)}`);
}

main()
  .catch((error) => {
    console.error(`\nPrimary Admin setup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
