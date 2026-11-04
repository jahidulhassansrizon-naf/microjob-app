// Usage:  node save-session.js 1   (any number from 1 to 10)
// Saves the currently logged-in Chrome (port 9222) as gemini-session-<N>.json
const { chromium } = require("playwright");
const path = require("path");

const slot = Number(process.argv[2] || 1);

if (!Number.isInteger(slot) || slot < 1 || slot > 10) {
  console.error(
    "Slot must be a number from 1 to 10.  Example: node save-session.js 4",
  );
  process.exit(1);
}

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const out = path.join(__dirname, `gemini-session-${slot}.json`);
  await context.storageState({ path: out });
  console.log(`Session ${slot} saved:`, out);
  process.exit(0);
})();
