#!/usr/bin/env node
// Read-only login diagnostic. Writes NOTHING to the database and never prints the
// password, hash or connection string. Use it instead of resetting the password
// repeatedly: it tells you which database you are talking to and whether the
// entered email/password pair would pass the same checks as /api/auth/login.
//
//   npm run diagnose:login                # uses MONGODB_URI from .env.local / .env
//   MONGODB_URI=<production uri> npm run diagnose:login   # check another database
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadEnv() {
  for (const filename of [".env.local", ".env"]) {
    let text = "";
    try { text = await readFile(resolve(process.cwd(), filename), "utf8"); } catch (e) { if (e?.code !== "ENOENT") throw e; continue; }
    for (const raw of text.split(/\r?\n/)) {
      const m = raw.trim().match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m || m[1].startsWith("#") || process.env[m[1]] !== undefined) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      else v = v.replace(/\s+#.*$/, "").trim();
      process.env[m[1]] = v;
    }
  }
}

function ask(prompt, hidden = false) {
  if (!hidden) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    return new Promise((r) => rl.question(prompt, (a) => { rl.close(); r(a); }));
  }
  if (!stdin.isTTY) throw new Error("Interactive terminal required for password entry.");
  return new Promise((resolveSecret, reject) => {
    stdout.write(prompt);
    let value = "";
    const onData = (buf) => {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\u0003") { done(); reject(new Error("Cancelled")); return; }
        if (ch === "\r" || ch === "\n") { done(); stdout.write("\n"); resolveSecret(value); return; }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else if (ch >= " ") value += ch;
      }
    };
    const done = () => { stdin.off("data", onData); stdin.setRawMode(false); stdin.pause(); };
    stdin.setRawMode(true); stdin.resume(); stdin.on("data", onData);
  });
}

async function main() {
  await loadEnv();
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("MONGODB_URI is required.");
  await mongoose.connect(uri, { autoIndex: false, bufferCommands: false });
  console.log(`Connected to database "${mongoose.connection.name}" on host ${mongoose.connection.host}`);
  const users = mongoose.connection.collection("users");

  const identifier = String(await ask("Email or phone you type on the login page: ")).trim().toLowerCase();
  const password = await ask("Password (hidden, never printed): ", true);

  // Same lookup rule as lib/loginCore.ts
  const matches = await users.find({ $or: [{ phoneNumber: identifier }, { email: identifier }] })
    .project({ password: 1, role: 1, isPrimaryAdmin: 1, sessionVersion: 1 }).toArray();
  const looseMatches = await users.countDocuments({ email: { $regex: `^${identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });

  console.log(`\nDocuments matched by the login query: ${matches.length}`);
  console.log(`Documents matching this email ignoring case: ${looseMatches}`);
  if (matches.length === 0) {
    console.log("RESULT: user_not_found -> the live login would return 401 for this identifier in THIS database.");
    return;
  }
  if (matches.length > 1) console.log("WARNING: more than one document matched; login uses the first one returned.");
  const u = matches[0];
  console.log(`role=${u.role} isPrimaryAdmin=${u.isPrimaryAdmin === true} sessionVersion=${Number(u.sessionVersion || 0)}`);
  console.log(`password field is a string: ${typeof u.password === "string"}; looks like bcrypt: ${typeof u.password === "string" && /^\$2[aby]\$\d{2}\$/.test(u.password)}`);
  const ok = typeof u.password === "string" && (await bcrypt.compare(password, u.password));
  console.log(ok
    ? "RESULT: password VERIFIES in this database. If the website still returns 401, the website is using a different database or an older deployment."
    : "RESULT: password_mismatch -> the live login would return 401 for this password in THIS database.");
}

main().catch((e) => { console.error(`Diagnostic failed: ${e instanceof Error ? e.message : "Unknown error"}`); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); });
