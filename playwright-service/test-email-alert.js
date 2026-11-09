// Usage (PowerShell), in the playwright-service folder:
//   $env:ALERT_WEBHOOK_URL="https://YOUR-WEBSITE/api/bot-alert"
//   $env:BOT_ALERT_KEY="the-same-secret-as-on-Vercel"
//   node test-email-alert.js
//
// Sends ONE test alert. It should arrive in the email set in BOT_ALERT_EMAIL (on Vercel).
const { sendEmailTest } = require("./notifier");

sendEmailTest("✅ টেস্ট বার্তা: বট থেকে ইমেইলে খবর আসছে।\nএটা একটা পরীক্ষা।")
  .then(() => {
    console.log("OK: the website accepted the alert. Check your email.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("FAILED:", error && error.message);
    process.exit(1);
  });
