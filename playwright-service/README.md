# EI neo bot v2 — Google লগইন ছাড়া

আগের বট Gemini ওয়েবসাইটে Google কুকি দিয়ে ঢুকত, তাই বারবার লগআউট হত।
এই ভার্সন কোনো লগইন/কুকি/Playwright ছাড়াই সরাসরি ইমেজ API ডাকে।
রুট আগের মতোই (/edit-image, /template-edit, /edit-image-dual, /health ...), তাই ওয়েবসাইট বদলাতে হবে না।

## ১) ফ্রি Cloudflare কী বানান (৫ মিনিট)
1. https://dash.cloudflare.com এ ফ্রি অ্যাকাউন্ট খুলুন।
2. ডানদিকে/Overview পেজে **Account ID** কপি করুন।
3. My Profile → API Tokens → Create Token → "Workers AI" টেমপ্লেট (বা Workers AI: Read+Edit পারমিশন) → টোকেন কপি করুন।

## ২) GitHub Secrets (Settings → Secrets and variables → Actions)
| Secret | মান |
|---|---|
| CF_ACCOUNT_ID | Cloudflare Account ID |
| CF_API_TOKEN | উপরের টোকেন |
| GEMINI_API_KEY | (ঐচ্ছিক) AI Studio key — ফ্রি টিয়ারে ইমেজ নাও চলতে পারে |

আগের ASK_KEY, BOT_ALERT_KEY, VERCEL_API_TOKEN, EDGE_CONFIG_ID ঠিক যেমন ছিল তেমনই থাকবে।
GEMINI_SESSION_JSON_* আর লাগবে না — মুছে ফেলতে পারেন।

## ৩) ফাইল বদলান
আপনার repo-র `playwright-service/` ফোল্ডারে `server.js` আর `package.json` বদলে দিন,
আর `.github/workflows/gemini-playwright-bot.yml` বদলে দিন। (record.js আর লাগবে না।)
তারপর Actions থেকে "Gemini Playwright Bot" রান করুন।

## টেস্ট (ইন্টারনেট ছাড়াই)
    npm install && npm run selftest

## জেনে রাখুন
- Cloudflare ফ্রি: দিনে ১০,০০০ neurons। এই কোডের হিসাবে ছবি প্রতি আনুমানিক ১২০–১৬০ neurons, মানে দিনে প্রায় ৬০–৮০টি ছবি।
  লিমিট শেষ হলে (UTC ০০:০০ তে রিসেট) বট নিজে Gemini key (থাকলে) চেষ্টা করে, না থাকলে ইউজারকে "busy" দেখায়।
- CF_ACCOUNT_ID_2 + CF_API_TOKEN_2 ... (_10 পর্যন্ত) দিলে বট সবগুলো ঘুরিয়ে ব্যবহার করে।
- Cloudflare মডেল ইনপুট ছবি 512px-এর নিচে নেয়, তাই চেহারা Gemini-র মতো নিখুঁত মিলবে না — আগে কয়েকটা ছবি দিয়ে দেখে নিন।
- মডেল বদলাতে: CF_IMAGE_MODEL / GEMINI_IMAGE_MODEL এনভায়রনমেন্ট ভ্যারিয়েবল।
