// Usage (inside the playwright-service folder):  node check-sessions.js        (emails partly hidden)
//                                                node check-sessions.js --full  (full emails)
// Checks which Google account each gemini-session-N.json belongs to,
// and tells you if two sessions are the SAME account.
// It only reads the session files. It does not change anything and does not print cookies.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// Add --full to show the whole email (only on your own screen).
const showFull = process.argv.includes("--full");
const mask = (email) =>
  showFull ? email : email.replace(/^(.{2})[^@]*(@.*)$/, "$1***$2");

async function readEmail(page) {
  return page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("[aria-label]")).map(
      (el) => el.getAttribute("aria-label") || "",
    );
    const hit =
      labels.find((l) => /Google Account/i.test(l) && /@/.test(l)) ||
      labels.find((l) => /@/.test(l)) ||
      "";
    const m = hit.match(/[\w.+-]+@[\w.-]+\.\w+/);
    return {
      email: m ? m[0] : "",
      signIn: /Sign in/i.test(document.body.innerText),
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const owners = {}; // email -> [slots]
  const rows = [];

  for (let n = 1; n <= 10; n++) {
    const file = path.join(__dirname, `gemini-session-${n}.json`);
    if (!fs.existsSync(file)) continue;

    const context = await browser.newContext({
      storageState: file,
      locale: "en-US",
    });
    const page = await context.newPage();

    try {
      await page.goto("https://gemini.google.com/app", {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(6000);

      let info = await readEmail(page);

      if (!info.email) {
        await page.goto("https://myaccount.google.com/", {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });
        await page.waitForTimeout(4000);
        info = await readEmail(page);
      }

      if (info.email) {
        const key = info.email.toLowerCase();
        (owners[key] = owners[key] || []).push(n);
        rows.push(`Session ${n}: ${mask(info.email)}`);
      } else if (info.signIn) {
        rows.push(`Session ${n}: NOT LOGGED IN (save this session again)`);
      } else {
        const shot = path.join(__dirname, `check-session-${n}.png`);
        await page.screenshot({ path: shot }).catch(() => {});
        rows.push(
          `Session ${n}: email not found (page: ${page.url()}) - screenshot saved: ${shot}`,
        );
      }
    } catch (error) {
      rows.push(`Session ${n}: error - ${error.message.split("\n")[0]}`);
    }

    await context.close();
  }

  await browser.close();

  console.log("\n--- Result ---");
  rows.forEach((r) => console.log(r));

  const dupes = Object.values(owners).filter((slots) => slots.length > 1);
  console.log("");
  if (dupes.length) {
    dupes.forEach((slots) =>
      console.log(
        `SAME ACCOUNT: sessions ${slots.join(" and ")} are the same Google account.`,
      ),
    );
  } else {
    console.log("All checked sessions are different accounts.");
  }
})();
