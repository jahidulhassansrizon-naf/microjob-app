# PipraPay সেটআপ — SebaLagbe

বর্তমানে ইউজারদের জন্য **পুরোনো manual bKash/Nagad payment পদ্ধতিই চালু থাকবে**। ইউজার টাকা পাঠিয়ে TrxID ও sender number জমা দেবে; Admin যাচাই করে Approve করলে subscription access চালু হবে। Subscription পেজে PipraPay integration শিগগিরই আসছে—এমন notice দেখানো হবে। PipraPay-এর self-hosted API adapter এবং Admin-stored credential integration প্রস্তুত করা হচ্ছে; Admin Settings-এর `enabled` flag false থাকায় নতুন checkout এখনো বন্ধ থাকবে। Paymently integration ফিরিয়ে আনা হয়নি। পুরোনো subscription/payment history অক্ষত থাকবে।

## প্যাকেজ ও মূল্য অপরিবর্তিত

| প্যাকেজ | মেয়াদ | মূল্য |
|---|---:|---:|
| ১ মাস | ৩০ দিন | ৳৯৯ |
| ৬ মাস | ১৮০ দিন | ৳৪৯৯ |
| ১ বছর | ৩৬৫ দিন | ৳৮৯৯ |

মূল price catalogue: `app/_lib/subscriptionPlans.ts`।

## সার্ভারে Environment Variables

Hosting panel / server environment-এ নিচের মানগুলো বসাতে হবে:

বর্তমান manual payment-এর জন্য bKash/Nagad নম্বর এবং app-এর public URL server environment-এ থাকবে:

```dotenv
BKASH_PAYMENT_NUMBER=01XXXXXXXXX
NAGAD_PAYMENT_NUMBER=01XXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://your-real-domain.com
PIPRAPAY_ENCRYPTION_KEY=PASTE_64_HEX_CHARACTERS_HERE
```

`PIPRAPAY_ENCRYPTION_KEY` তৈরি করতে project root থেকে চালান:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Command-এর output-টি `PIPRAPAY_ENCRYPTION_KEY=`-এর পরে বসান। `.env.local` save করার পর Next.js dev server সম্পূর্ণ বন্ধ করে আবার চালু করুন (`npm run dev`)। এই key GitHub-এ commit করবেন না এবং হারাবেন না; key বদলালে আগে থেকে সংরক্ষিত PipraPay API Key decrypt করা যাবে না।

- `NEXT_PUBLIC_SITE_URL`: এই Next.js app-এর public HTTPS domain।
- `BKASH_PAYMENT_NUMBER` ও `NAGAD_PAYMENT_NUMBER`: এখনকার manual payment page-এ দেখানো merchant/collection নম্বর। এগুলো client-side code-এ hardcode করবেন না।
- `JWT_SECRET`: আগের মতো শুধু application authentication/session-এর জন্য থাকবে। PipraPay encryption-এর জন্য এটি পরিবর্তন বা ব্যবহার করার দরকার নেই।
- `PIPRAPAY_ENCRYPTION_KEY`: PipraPay API Key MongoDB-তে AES-256-GCM দিয়ে encrypt করার জন্য আলাদা ৩২-byte key। নিচের command দিয়ে ৬৪-character hexadecimal key তৈরি করে `.env.local` এবং production server environment-এ সেট করুন। এটি `JWT_SECRET` থেকে আলাদা এবং স্থায়ীভাবে backup রাখুন।
- PipraPay API Key কখনো `.env`, `NEXT_PUBLIC_` variable, GitHub বা frontend source code-এ রাখবেন না। Admin Dashboard → Payment Gateway থেকে encrypted storage-এ save করবেন।
- PipraPay runtime এখন Admin Panel-এর encrypted settings থেকে Base URL ও API Key পড়ে। Save করলেও `enabled=false` থাকে; connection test ও end-to-end payment test শেষ না হওয়া পর্যন্ত payment চালু হবে না।

## বর্তমানে ইউজারদের পেমেন্ট যেভাবে চলবে

১. ইউজার Subscription পেজে ১ মাস/৬ মাস/১ বছরের প্যাকেজ নির্বাচন করে Continue করলে `/payment/manual` পেজে যাবে।
২. সেখানে সার্ভারে সেট করা bKash/Nagad নম্বর দেখাবে। ইউজার ঠিক প্যাকেজের মূল্য Send Money করে TrxID এবং নিজের প্রেরক নম্বর জমা দেবে।
৩. `POST /api/payment/manual-submit` একটি pending manual payment record তৈরি করবে। একই ইউজারের আরেকটি pending manual payment থাকলে নতুন submission আটকাবে এবং duplicate TrxID গ্রহণ করবে না।
৪. Admin Dashboard → Subscriptions → Pending থেকে ইউজারের নাম, প্যাকেজ, পরিমাণ, wallet method, sender number ও TrxID যাচাই করবে। তারপর Approve অথবা Reject করবে।
৫. Approve হলেই নির্বাচিত প্যাকেজের মেয়াদ অনুযায়ী `COMPLETED` payment ও `ACTIVE` access তৈরি হবে। আগেই active subscription থাকলে নতুন মেয়াদ বর্তমান expiry থেকে যোগ হবে।

Admin-এর manual approval endpoint কেবল pending bKash/Nagad manual payment এবং TrxID থাকলে অনুমোদন করবে। PipraPay order এই route দিয়ে approve করা যাবে না। এই অস্থায়ী manual payment path PipraPay পুরোপুরি test করে চালু না করা পর্যন্ত থাকবে।

## PipraPay API Contract — ক্লায়েন্টের Self-hosted Server

ক্লায়েন্টের API Settings screenshot থেকে পাওয়া তথ্য:

- Base URL: `https://pay.devprobd.top/api`
- Gateway Checkout page: `https://pay.devprobd.top/checkout`
- Verify Payment: `POST /api/verify-payment`
- Refund Payment: `POST /api/refund-payment` (এই subscription checkout step-এ ব্যবহার করা হচ্ছে না)

Official current Redirect Checkout documentation অনুযায়ী checkout session তৈরি করতে:

- Method: `POST /api/checkout/redirect`
- Header: `MHS-PIPRAPAY-API-KEY`
- Body fields: `full_name`, `email_address`, `mobile_number`, `amount`, `currency`, `metadata`, `return_url`, `webhook_url`
- `metadata` JSON string হিসেবে পাঠানো হবে।
- Response-এর hosted checkout URL-এ user-কে redirect করতে হবে। `pp_id` থাকলে সেটি order-এর সঙ্গে সংরক্ষণ করতে হবে।

Payment verification:

- Method: `POST /api/verify-payment`
- Header: `MHS-PIPRAPAY-API-KEY`
- Body: `{ "pp_id": "..." }`
- কেবল verified status `completed`, BDT currency এবং subscription-এর expected amount মিললে Premium Access চালু হবে। Browser return বা webhook payload একা payment proof নয়।

এই project-এর server-side API adapter এখন নতুন Redirect Checkout contract-এর field ও endpoint ব্যবহার করে। তবে client API key এবং live server response sample এখনো পাওয়া যায়নি; তাই বাস্তব checkout response-এর field match ও sandbox transaction এখনো বাকি। API key না পাওয়া পর্যন্ত production checkout enable করবেন না।

## ক্লায়েন্টের কাছ থেকে যা নিতে হবে

১. PipraPay API Key — ক্লায়েন্টের কাছ থেকে পাওয়া যাবে; Admin Payment Gateway panel runtime config-এর সঙ্গে যুক্ত হওয়ার পরে সেখানে নিরাপদে save করবে। public chat, screenshot, GitHub বা source code-এ রাখবে না।

২. Client-এর dashboard/API Settings থেকে পাওয়া Create Checkout এবং Verify Payment-এর successful JSON response sample। API key পাওয়ার আগে real request পাঠানো যাবে না।

৩. Sandbox mode বা test payment method আছে কি না, এবং test transaction কীভাবে করা যাবে।

৪. Redirect Checkout (`POST /api/checkout/redirect`)-এর একটি successful JSON response—যাতে checkout URL এবং `pp_id`-এর exact field name নিশ্চিত করা যায়।

৫. Verify Payment (`POST /api/verify-payment`)-এর successful/completed, pending এবং failed response-এর JSON sample। বিশেষ করে payment ID, `status`, `amount`, `currency`, `metadata` field-এর exact name জানতে হবে।

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
২. `POST /api/checkout/redirect` দিয়ে hosted checkout session তৈরি করে response-এর HTTPS checkout URL-এ user-কে পাঠানো হয়।
৩. Return অথবা webhook-এ পাওয়া reference দিয়ে server PipraPay Verify API-তে payment পুনরায় যাচাই করে।
৪. provider status `completed`, BDT currency, সঠিক amount এবং subscription/order metadata মিলে গেলেই `COMPLETED` + `ACTIVE` হয় এবং Premium access cookie set হয়।
৫. duplicate callback এলে একই order দ্বিতীয়বার মেয়াদ বাড়ায় না। PipraPay order Admin manual approve/reject দিয়ে সক্রিয় করা যাবে না। Admin-এর আলাদা access deactivate/delete tools রাখা হয়েছে।

Manual bKash/Nagad payment submission এবং Admin review route এখন চালু আছে। Paymently integration ফিরিয়ে আনা হয়নি। PipraPay feature flag বন্ধ থাকায় আপাতত UI থেকে PipraPay checkout শুরু হবে না।

## Go-live Checklist

- [ ] ক্লায়েন্টের exact API request/response sample নিশ্চিত হয়েছে।
- [ ] API key নিরাপদে server environment-এ বসানো হয়েছে।
- [ ] `NEXT_PUBLIC_SITE_URL` production domain-এ সেট করা হয়েছে।
- [ ] Webhook URL provider panel-এ register/allow করা হয়েছে।
- [ ] Success, cancel, pending, failed এবং duplicate callback test করা হয়েছে।
- [ ] Verified amount ও currency plan-এর সঙ্গে মিলে গেছে।
- [ ] সব test pass করার পর Live key ও Live base URL বসানো হয়েছে।

**দ্রষ্টব্য:** এই ZIP-এ client-এর real API key নেই, তাই live payment transaction চালিয়ে পরীক্ষা করা সম্ভব হয়নি। Syntax check হয়েছে; পূর্ণ Next.js build/type-check dependency install timeout হওয়ায় চালানো যায়নি।

## Admin Panel থেকে PipraPay তথ্য সংরক্ষণ

- Admin Dashboard-এর নতুন **Payment Gateway** ট্যাবে Base URL ও dedicated API Key দেওয়ার UI তৈরি করা হয়েছে। Base URL-এর default value ক্লায়েন্টের দেওয়া `https://pay.devprobd.top/api`।
- এই ধাপে Panel-এর authenticated GET/PUT API এবং encrypted database storage তৈরি হয়েছে। API Key browser-এ ফেরত পাঠানো হয় না; MongoDB-তে AES-256-GCM encryption করে রাখা হয়। Encryption key `PIPRAPAY_ENCRYPTION_KEY` থেকে HKDF-SHA256 দিয়ে derive করা হয়; এটি `JWT_SECRET` থেকে সম্পূর্ণ আলাদা। নতুন encryption version 2 এই dedicated key ব্যবহার করে। আগের Step 5-এর version 1 ciphertext থাকলে legacy reader পুরোনো `JWT_SECRET` দিয়ে সেটি পড়তে পারে; API Key পুনরায় Save করলে নতুন dedicated key দিয়ে version 2-তে migrate হবে।
- **গুরুত্বপূর্ণ:** Checkout, verification ও webhook runtime এখন এই encrypted database settings পড়ে। Admin settings save করলেও `enabled=false` থাকে, তাই connection test ও end-to-end test না হওয়া পর্যন্ত PipraPay checkout বন্ধ থাকবে।
- এই settings save করলেই payment চালু হয় না। Checkout/runtime config, payment verification এবং webhook end-to-end test সম্পন্ন না হওয়া পর্যন্ত PipraPay payment disabled থাকবে।
- API Key কখনো GitHub, frontend environment variable বা public site settings-এ রাখা যাবে না।


## Admin Panel থেকে PipraPay credentials

বর্তমান integration-এ `PIPRAPAY_API_KEY` বা `PIPRAPAY_BASE_URL` environment variable ব্যবহার করা হয় না। Admin Dashboard → Payment Gateway থেকে Base URL এবং API Key save করতে হবে। API Key MongoDB-তে AES-256-GCM encrypted অবস্থায় সংরক্ষিত হয় এবং API response-এ কখনো প্রকাশ করা হয় না।

ক্লায়েন্টের self-hosted Base URL: `https://pay.devprobd.top/api`। Save করলেই payment চালু হবে না; `enabled` flag false থাকবে যতক্ষণ না connection test ও payment testing শেষে Admin থেকে enable করা হয়।


## Admin Settings থেকে Runtime Configuration — সম্পন্ন

Checkout, payment verification এবং webhook authentication এখন Admin Dashboard → Payment Gateway-এ সংরক্ষিত encrypted credentials ব্যবহার করে। Runtime আর `PIPRAPAY_API_KEY`, `PIPRAPAY_BASE_URL` বা `PIPRAPAY_ENABLED` environment variable পড়ে না। Settings `enabled=false` থাকলে checkout fail-closed থাকে; পরবর্তী ধাপে connection test ও explicit enable control যুক্ত করতে হবে।

## Admin Panel-এ Connection Test — Step 5

১. Admin Dashboard → Payment Gateway খুলুন।
২. Base URL হিসেবে `https://pay.devprobd.top/api` দিন।
৩. ক্লায়েন্টের API Key পেস্ট করে **Save settings** চাপুন। Save সফল হলে API Key input খালি হবে; এটি স্বাভাবিক, কারণ নিরাপত্তার জন্য আসল key browser-এ ফেরত পাঠানো হয় না।
৪. **Test connection** চাপুন। Test একটি read-only `POST /api/verify-payment` request-এ ইচ্ছাকৃতভাবে ভুয়া `pp_id` পাঠায়। এতে কোনো real checkout/payment/refund তৈরি হয় না।
৫. যদি `PipraPay connection confirmed` দেখা যায়, server endpoint ও credentials দিয়ে verification request গ্রহণ হয়েছে। API key ভুল হলে authentication error দেখাবে; endpoint/path mismatch হলে endpoint error দেখাবে।
৬. Connection test সফল হলেও live checkout enable করবেন না। প্রথমে client-এর dashboard/API version, checkout response sample, webhook header behavior এবং test payment end-to-end যাচাই করতে হবে।

**Connection test কখনো payment test-এর বিকল্প নয়।** এটি শুধু API access/verify endpoint-এর সংযোগ পরীক্ষা করে।


## PipraPay Encryption Key — JWT থেকে আলাদা

নতুন কোডে PipraPay credentials encrypt করার জন্য আলাদা `PIPRAPAY_ENCRYPTION_KEY` ব্যবহার করা হয়। `JWT_SECRET` আগের মতো authentication/session-এর জন্য থাকবে এবং সেটি পরিবর্তন করতে হবে না।

Local development-এর `.env.local`-এ যোগ করুন:

```dotenv
PIPRAPAY_ENCRYPTION_KEY=PASTE_64_HEX_CHARACTERS_HERE
```

নতুন key তৈরির command (project root):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

এটি ৩২ random byte-এর ৬৪ hexadecimal character তৈরি করবে। Output-টি `.env.local`-এ বসিয়ে dev server restart করুন। Production-এ একই environment variable hosting provider-এর server-side Environment Variables-এ যোগ করতে হবে; source code বা GitHub-এ নয়। Key স্থায়ীভাবে নিরাপদে backup রাখুন। Key বদলালে PipraPay API Key Admin Panel-এ আবার save করতে হবে।

আগের Step 5 code দিয়ে encrypted করা version 1 credential legacy `JWT_SECRET` reader দিয়ে পড়া যাবে। Admin Panel-এ API Key পুনরায় save করলে সেটি নতুন dedicated key দিয়ে version 2-তে re-encrypt হবে।
