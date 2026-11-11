// new-session.js  (usage: node new-session.js 2)
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const readline = require("readline");
const os = require("os");
const path = require("path");

const n = process.argv[2];
if (!n) {
  console.log("Use: node new-session.js <number>");
  process.exit(1);
}
const file = `gemini-session-${n}.json`;

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = path.join(os.tmpdir(), `gemini-login-profile-${n}`);

(async () => {
  // Normal Chrome, automation flag chara, alada fresh profile e
  const chrome = spawn(
    chromePath,
    [
      "--remote-debugging-port=9222",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "https://gemini.google.com/app",
    ],
    { stdio: "ignore", detached: true },
  );
  chrome.unref();

  console.log("Chrome khulse. Notun account diye login koro.");
  console.log("Gemini chat box dekha gele ekhane Enter chaap.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  await new Promise((r) => rl.question("", r));
  rl.close();

  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const ctx = browser.contexts()[0];
  await ctx.storageState({ path: file });
  console.log(`Saved: ${file}`);
  await browser.close();
  process.exit(0);
})();
