"use strict";
// Use:  node save-session.js 1      (1 = slot number, creates gemini-session-1.json)
// A real browser window opens. Log in to Google, open Gemini, then come back
// to this terminal and press Enter. Do NOT sign out of Google afterwards.
const { chromium } = require("playwright");
const readline = require("node:readline");
const path = require("node:path");

const slot = process.argv[2] || "1";
const outFile = path.join(__dirname, `gemini-session-${slot}.json`);

// Same identity the bot uses on GitHub, so Google sees one steady browser.
const LOCALE = process.env.BROWSER_LOCALE || "en-US";
const TIMEZONE = process.env.BROWSER_TIMEZONE || "Asia/Dhaka";

function waitForEnter(text) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(text, () => {
      rl.close();
      resolve();
    }),
  );
}

(async () => {
  let browser;
  try {
    // Prefer the real Google Chrome installed on this PC (Google trusts it more).
    browser = await chromium.launch({
      channel: "chrome",
      headless: false,
      ignoreDefaultArgs: ["--enable-automation"],
      args: ["--disable-blink-features=AutomationControlled"],
    });
    console.log("Using Google Chrome.");
  } catch {
    console.log("Google Chrome not found, using Playwright Chromium.");
    browser = await chromium.launch({
      headless: false,
      ignoreDefaultArgs: ["--enable-automation"],
      args: ["--disable-blink-features=AutomationControlled"],
    });
  }

  const context = await browser.newContext({
    locale: LOCALE,
    timezoneId: TIMEZONE,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("https://gemini.google.com/app");

  console.log("\n1) Log in to your Google account in the window.");
  console.log(
    "2) Make sure the Gemini chat page is open and you can type in it.",
  );
  console.log("3) Do NOT sign out.\n");
  await waitForEnter(
    "When Gemini is open and logged in, press ENTER here to save... ",
  );

  await context.storageState({ path: outFile });
  console.log(`\nSaved: ${outFile}`);
  await browser.close();
  process.exit(0);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
