# PipraPay সেটআপ — SebaLagbe

বর্তমানে ইউজারদের জন্য **পুরোনো manual bKash/Nagad payment পদ্ধতিই চালু থাকবে**। ইউজার টাকা পাঠিয়ে TrxID ও sender number জমা দেবে; Admin যাচাই করে Approve করলে subscription access চালু হবে। Subscription পেজে PipraPay integration শিগগিরই আসছে—এমন notice দেখানো হবে। PipraPay-এর API code প্রস্তুতির জন্য রাখা আছে, কিন্তু `PIPRAPAY_ENABLED=true` না করা পর্যন্ত নতুন PipraPay checkout বন্ধ থাকবে। Paymently integration ফিরিয়ে আনা হয়নি। পুরোনো subscription/payment history অক্ষত থাকবে।

## প্যাকেজ ও মূল্য অপরিবর্তিত

| প্যাকেজ | মেয়াদ | মূল্য |
|---|---:|---:|
| ১ মাস | ৩০ দিন | ৳৯৯ |
| ৬ মাস | ১৮০ দিন | ৳৪৯৯ |
| ১ বছর | ৩৬৫ দিন | ৳৮৯৯ |

মূল price catalogue: `app/_lib/subscriptionPlans.ts`।

## সার্ভারে Environment Variables

Hosting panel / server environment-এ নিচের মানগুলো বসাতে হবে:

এখনকার manual payment চালাতে bKash/Nagad collection number সেট করুন:

```dotenv
BKASH_PAYMENT_NUMBER=01XXXXXXXXX
NAGAD_PAYMENT_NUMBER=01XXXXXXXXX
```

PipraPay sandbox পরীক্ষা শুরু না করা পর্যন্ত নিচের flag `false` বা unset রাখুন:

```dotenv
PIPRAPAY_ENABLED=false
PIPRAPAY_API_KEY=CLIENT_PROVIDED_SERVER_API_KEY
PIPRAPAY_BASE_URL=https://sandbox.piprapay.com
NEXT_PUBLIC_SITE_URL=https://your-real-domain.com
```

- `PIPRAPAY_API_KEY`: ক্লায়েন্টের server-side API key। এটি `NEXT_PUBLIC_` variable হবে না এবং browser/client code-এ রাখা যাবে না।
- `PIPRAPAY_BASE_URL`: sandbox বা live PipraPay server origin। Self-hosted হলে ক্লায়েন্টের প্রকৃত HTTPS domain লাগবে। কোড প্রয়োজনে শেষে `/api` যোগ করে। Production-এ explicit base URL না থাকলে checkout বন্ধ থাকবে, যাতে live user ভুল করে sandbox-এ না যায়।
- `NEXT_PUBLIC_SITE_URL`: এই Next.js app-এর public HTTPS domain।
- `BKASH_PAYMENT_NUMBER` ও `NAGAD_PAYMENT_NUMBER`: এখনকার manual payment page-এ দেখানো merchant/collection নম্বর। এগুলো client-side code-এ hardcode করবেন না।
- `PIPRAPAY_ENABLED`: শুধুমাত্র client-এর version/credentials নিশ্চিত, sandbox transaction সফল এবং webhook test শেষ হলে `true` করবেন। বর্তমানে `false` থাকবে।
- আগের `JWT_SECRET`, MongoDB এবং অন্যান্য authentication environment variables অপরিবর্তিত রাখুন।

## বর্তমানে ইউজারদের পেমেন্ট যেভাবে চলবে

১. ইউজার Subscription পেজে ১ মাস/৬ মাস/১ বছরের প্যাকেজ নির্বাচন করে Continue করলে `/payment/manual` পেজে যাবে।
২. সেখানে সার্ভারে সেট করা bKash/Nagad নম্বর দেখাবে। ইউজার ঠিক প্যাকেজের মূল্য Send Money করে TrxID এবং নিজের প্রেরক নম্বর জমা দেবে।
৩. `POST /api/payment/manual-submit` একটি pending manual payment record তৈরি করবে। একই ইউজারের আরেকটি pending manual payment থাকলে নতুন submission আটকাবে এবং duplicate TrxID গ্রহণ করবে না।
৪. Admin Dashboard → Subscriptions → Pending থেকে ইউজারের নাম, প্যাকেজ, পরিমাণ, wallet method, sender number ও TrxID যাচাই করবে। তারপর Approve অথবা Reject করবে।
৫. Approve হলেই নির্বাচিত প্যাকেজের মেয়াদ অনুযায়ী `COMPLETED` payment ও `ACTIVE` access তৈরি হবে। আগেই active subscription থাকলে নতুন মেয়াদ বর্তমান expiry থেকে যোগ হবে।

Admin-এর manual approval endpoint কেবল pending bKash/Nagad manual payment এবং TrxID থাকলে অনুমোদন করবে। PipraPay order এই route দিয়ে approve করা যাবে না। এই অস্থায়ী manual payment path PipraPay পুরোপুরি test করে চালু না করা পর্যন্ত থাকবে।

## PipraPay API Version

এই integration বর্তমানে PipraPay-এর V2 REST contract ধরে লেখা:

- Create charge: `POST /api/create-charge`
- Verify payment: `POST /api/verify-payments` — body `{ "pp_id": "..." }`
- API header: `mh-piprapay-api-key`
- Create fields: `full_name`, `email_mobile`, `amount`, `metadata`, `redirect_url`, `return_type`, `cancel_url`, `webhook_url`, `currency`

**Live করার আগে ক্লায়েন্টের কাছ থেকে নিশ্চিত হতে হবে তাদের panel/API V2 নাকি V3+।** V3+ এ customer field আলাদা (email এবং mobile পৃথক হতে পারে) এবং endpoint/response contract-ও আলাদা হতে পারে। version নিশ্চিত না করে API request field পরিবর্তন করবেন না।

## ক্লায়েন্টের কাছ থেকে যা নিতে হবে

১. PipraPay panel/API-এর সঠিক version (V2 অথবা V3+) এবং সেই version-এর official API documentation URL।

২. Sandbox API base URL এবং Production/Live API base URL। Self-hosted হলে public HTTPS origin।

৩. Sandbox API key এবং Live API key (দুটি আলাদা হলে দুটিই)। এগুলো password manager বা নিরাপদ private channel-এ নেবেন; public chat, screenshot বা source code-এ রাখবেন না।

৪. Create-charge-এর একটি working request এবং successful JSON response—যাতে checkout URL (`pp_url` বা সমতুল্য), `pp_id`, `invoice_id` কোনগুলো ফেরত আসে তা দেখা যায়।

৫. Verify-payment-এর সফল/completed, pending এবং failed response-এর JSON sample। বিশেষ করে payment ID, `status`/`payment_status`, `amount`, `currency`, `metadata` field-এর আসল নাম জানতে হবে।

৬. Webhook URL register/enable করার পদ্ধতি এবং webhook request-এ `mh-piprapay-api-key` header পাঠানো হবে কি না—এটি নিশ্চিত করতে হবে। আমাদের callback endpoint:
   `https://YOUR-DOMAIN/api/payment/webhook`

৭. PipraPay dashboard-এ কোন কোন payment channel enabled (bKash, Nagad, Rocket, card ইত্যাদি)—ক্লায়েন্টকে confirm করতে হবে। এগুলো app-এ আলাদা gateway হিসেবে নয়, PipraPay checkout-এর ভেতরে নির্বাচিত হবে।

৮. Sandbox test credentials/steps এবং low-value test payment করে refund/void করার ব্যবস্থা।

## Callback URL

Checkout create করার সময় app নিজেই এই URLs পাঠায়:

- Return: `https://YOUR-DOMAIN/api/payment/return?subscription_id=...`
- Webhook: `https://YOUR-DOMAIN/api/payment/webhook`

ক্লায়েন্টকে webhook URL allow/register করতে বলবেন। Browser return route `pp_id`/invoice তথ্য success page-এ দেয়; access দেওয়ার আগে server-side Verify API কল করা হয়।

## Payment সফল হলে কী হবে

১. Server-এ নির্বাচিত plan ID থেকে amount নির্ধারণ করে `PENDING` subscription order তৈরি হয়। Browser থেকে পাঠানো price বিশ্বাস করা হয় না।
২. PipraPay checkout URL-এ user-কে পাঠানো হয়।
৩. Return অথবা webhook-এ পাওয়া reference দিয়ে server PipraPay Verify API-তে payment পুনরায় যাচাই করে।
৪. provider status `completed`, BDT currency, সঠিক amount এবং subscription/order metadata মিলে গেলেই `COMPLETED` + `ACTIVE` হয় এবং Premium access cookie set হয়।
৫. duplicate callback এলে একই order দ্বিতীয়বার মেয়াদ বাড়ায় না। PipraPay order Admin manual approve/reject দিয়ে সক্রিয় করা যাবে না। Admin-এর আলাদা access deactivate/delete tools রাখা হয়েছে।

Manual bKash/Nagad payment submission এবং Admin review route এখন চালু আছে। Paymently integration ফিরিয়ে আনা হয়নি। PipraPay feature flag বন্ধ থাকায় আপাতত UI থেকে PipraPay checkout শুরু হবে না।

## Go-live Checklist

- [ ] ক্লায়েন্ট API version ও request/response sample নিশ্চিত করেছে।
- [ ] Sandbox API key ও base URL server environment-এ বসানো হয়েছে।
- [ ] `NEXT_PUBLIC_SITE_URL` production domain-এ সেট করা হয়েছে।
- [ ] Webhook URL provider panel-এ register/allow করা হয়েছে।
- [ ] Success, cancel, pending, failed এবং duplicate callback test করা হয়েছে।
- [ ] Verified amount ও currency plan-এর সঙ্গে মিলে গেছে।
- [ ] সব test pass করার পর Live key ও Live base URL বসানো হয়েছে।

**দ্রষ্টব্য:** এই ZIP-এ client-এর real API key নেই, তাই live payment transaction চালিয়ে পরীক্ষা করা সম্ভব হয়নি। Syntax check হয়েছে; পূর্ণ Next.js build/type-check dependency install timeout হওয়ায় চালানো যায়নি।
