// Usage:  node save-facebook-session.js
//
// 1. Start Chrome with remote debugging (the same way you do for save-session.js)
//    and log in to the SEPARATE "bot" Facebook account (NOT your own main account).
// 2. Run this script. It saves the login cookies as facebook-session.json.
// 3. Paste the WHOLE content of facebook-session.json into the GitHub secret
//    FB_SESSION_JSON. Never commit this file or share it: it is a login.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
  const context = browser.contexts()[0];
  const out = path.join(__dirname, "facebook-session.json");

  const state = await context.storageState();

  // Only the cookies are needed. Dropping local storage keeps the file small
  // (a GitHub secret can hold at most 48 KB).
  const small = {
    cookies: state.cookies.filter((c) => /facebook\.com|messenger\.com/i.test(c.domain)),
    origins: [],
  };

  fs.writeFileSync(out, JSON.stringify(small));

  const bytes = fs.statSync(out).size;
  console.log(`Saved ${small.cookies.length} cookies to ${out} (${bytes} bytes).`);

  const who = small.cookies.find((c) => c.name === "c_user");

  if (!who) {
    console.log("WARNING: no 'c_user' cookie found. Are you logged in to Facebook in that Chrome?");
  } else {
    // c_user is just the public Facebook id of the logged-in account. Check that it is
    // the NEW bot account (open facebook.com/profile.php?id=THIS_NUMBER to see whose it is).
    console.log(`Logged in as Facebook id: ${who.value}`);
  }
  if (bytes > 48000) {
    console.log("WARNING: file is larger than 48 KB, GitHub will not accept it as a secret.");
  }

  process.exit(0);
})();
