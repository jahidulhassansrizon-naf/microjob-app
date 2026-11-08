// Usage (PowerShell), on your own computer, in the playwright-service folder:
//   $env:FB_RECIPIENT="your-profile-id-or-username"
//   node test-notify.js            (invisible browser)
//   $env:HEADED="1"; node test-notify.js     (shows the browser so you can watch)
//
// Sends ONE test message from the bot account (facebook-session.json) to you.
const { sendTest } = require("./notifier");

sendTest("✅ টেস্ট বার্তা: বট থেকে Messenger-এ বার্তা আসছে।", process.env.HEADED === "1")
  .then(() => {
    console.log("OK: the test message was sent. Check your Messenger.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("FAILED:", error && error.message);
    process.exit(1);
  });
