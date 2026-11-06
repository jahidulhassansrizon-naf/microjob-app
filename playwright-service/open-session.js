// open-session.js
// Opens a VISIBLE browser that is already logged in with Gemini session N,
// so you can click things by hand (for example "Agree" on a dialog).
// When you press Enter in the terminal, the session file is saved again
// (the old file is kept as gemini-session-N.backup.json).
//
// Put this file in the playwright-service folder (next to server.js).
// Run:   node open-session.js 4
//
// Steps:
//   1. A browser window opens on Gemini (logged in).
//   2. Do what you need (click +, Create image, Agree, ...).
//   3. Come back to the terminal and press Enter. DO NOT close the browser first.

const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const slot = Number(process.argv[2]);

if (!slot) {
  console.log("Usage: node open-session.js <session number>   (example: node open-session.js 4)");
  process.exit(1);
}

let file = path.join(__dirname, `gemini-session-${slot}.json`);

if (!fs.existsSync(file) && slot === 1) {
  const old = path.join(__dirname, "gemini-session.json");
  if (fs.existsSync(old)) file = old;
}

if (!fs.existsSync(file)) {
  console.error(`Session file not found: ${file}`);
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS === "1",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    storageState: file,
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (error) {
    console.log("Could not open Gemini automatically:", error.message);
    console.log("Type gemini.google.com/app in the browser address bar yourself.");
  }

  console.log("\n=======================================================");
  console.log(` Session ${slot} is open in the browser window.`);
  console.log(" 1. Check the account picture (top right) is the right account.");
  console.log(" 2. Click +, then Create image. If a box with Agree/Cancel appears, read it and choose.");
  console.log(" 3. Come back HERE and press Enter to save. Do not close the browser first.");
  console.log("=======================================================\n");

  let closedByUser = false;
  browser.on("disconnected", () => {
    closedByUser = true;
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  await new Promise((resolve) => rl.question("Press Enter to SAVE the session (or Ctrl+C to cancel)... ", resolve));
  rl.close();

  if (closedByUser) {
    console.log("The browser was already closed, so nothing was saved. Run the command again.");
    process.exit(1);
  }

  const backup = file.replace(/\.json$/, ".backup.json");
  fs.copyFileSync(file, backup);

  await context.storageState({ path: file });
  console.log(`Saved: ${file}`);
  console.log(`Old file kept as: ${backup}`);

  await browser.close().catch(() => {});
})();
