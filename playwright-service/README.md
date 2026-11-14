# EI neo v3 — Google AI Mode + Cloudflare ব্যাকআপ

বট এখন প্রথমে google.com এর AI Mode (udm=50) দিয়ে ছবি বানাতে চেষ্টা করে (সেভ করা Google সেশন দিয়ে),
ব্যর্থ হলে বা সেশন না থাকলে নিজে Cloudflare FLUX.2 তে চলে যায়। তাই সাইট কখনো পুরো বন্ধ হবে না।

## বসানো
1. repo-র playwright-service/ তে এই ফোল্ডারের সব ফাইল বদলান (server.js, aimode.js, package.json), আর workflow ফাইলটাও।
2. Secrets: আগের CF_ACCOUNT_ID, CF_API_TOKEN থাকবে। নতুন করে সেভ করা Google সেশন GEMINI_SESSION_JSON_1..N নামে বসান
   (নামটা আগের মতোই, ভিতরের কাজ এখন AI Mode)।
3. বট চালান। লগে দেখুন: "Provider slot 1: Google AI Mode #1".

## ফেল করলে
লগে "[aimode] debug(...)" লাইন আসবে (পেজের বাটন/ইনপুটের তালিকা)। আর Actions রানের নিচে Artifacts এ
"aimode-debug" নামে স্ক্রিনশট থাকবে। সেটা আর লগের লাইনগুলো পাঠালে selector ঠিক করা যাবে।

## টেস্ট
    npm install
    npm run selftest            # সার্ভার + Cloudflare/Gemini (নকল সার্ভার)
    node selftest-aimode.js     # AI Mode এর ক্লিকের যুক্তি (নকল পেজে, আসল Google না)
