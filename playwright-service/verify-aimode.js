const { chromium } = require("playwright");
const file = process.argv[2];
(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ storageState: file });
  const page = await ctx.newPage();
  await page.goto("https://www.google.com/search?udm=50");
  console.log("AI Mode খুলেছে। দেখুন লগইন আছে কিনা, তারপর ব্রাউজার বন্ধ করুন।");
})();
