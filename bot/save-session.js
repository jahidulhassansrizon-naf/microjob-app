const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const out = path.join(__dirname, "gemini-session.json");
  await context.storageState({ path: out });
  console.log("Session saved:", out);
  process.exit(0);
})();
