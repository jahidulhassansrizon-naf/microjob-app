# SebaLagbe — UddoktaPay Setup (বাংলা)

এই integration-এ UddoktaPay নতুন আলাদা payment gateway। PipraPay এবং Manual bKash/Nagad flow অপরিবর্তিত থাকে।

## ১. Hosted Domain

স্ক্রিনশটের Product Details-এ `test-app.paymently.io` domain দেখা গেছে। Admin → Payment Gateway → UddoktaPay API connection অংশে default হিসেবে `https://test-app.paymently.io` দেওয়া আছে। Product Details-এ domain অন্য হলে সেটি বসাতে হবে। এখানে `/api` যোগ করবেন না।

## ২. API Key তৈরি

UddoktaPay hosted panel-এ login করে **Brand Settings → API Settings → New API Key** খুলুন। Key-র নাম দিন `SebaLagbe Production`। অন্তত `payment:checkout` এবং `payment:verify` abilities enable করুন। Refund integration ব্যবহার না করা পর্যন্ত `payment:refund` প্রয়োজন নেই। API key তৈরি হওয়ার পর একবারই পুরো key দেখায়—সঙ্গে সঙ্গে নিরাপদে copy করুন। Chat, GitHub বা source code-এ key দেবেন না।

## ৩. SebaLagbe Admin-এ সংরক্ষণ

Admin Dashboard → Payment Gateway → UddoktaPay API connection। Hosted Domain ও API Key দিয়ে Save Settings করুন। Key database-এ AES-256-GCM দিয়ে encrypt করে রাখা হয়; browser-এ ফেরত পাঠানো হয় না। Encryption master key হিসেবে existing `PIPRAPAY_ENCRYPTION_KEY` ব্যবহার হয়, তাই নতুন কোনো environment variable দরকার নেই। Local এবং Vercel deployment-এ একই database ব্যবহার করলে দুই জায়গাতেই একই `PIPRAPAY_ENCRYPTION_KEY` রাখতে হবে।

Save করার পর UddoktaPay checkout disabled থাকবে। **Test Connection** চাপুন। এটি একটি dummy invoice দিয়ে read-only Verify API call করে; কোনো charge বা real payment তৈরি করে না। Test successful হলে **Enable live checkout** চাপুন।

## ৪. Customer flow

Subscription page-এ PipraPay, UddoktaPay এবং Manual bKash/Nagad আলাদা অপশন থাকবে। UddoktaPay checkout create endpoint: `POST {HOSTED_DOMAIN}/api/checkout-v2`; verify endpoint: `POST {HOSTED_DOMAIN}/api/verify-payment`। Auth header: `RT-UDDOKTAPAY-API-KEY`। Callback-এ পাওয়া `invoice_id` শুধু reference; server UddoktaPay Verify API call করে `status=COMPLETED`, amount, owner, subscription id ও plan id যাচাই না করা পর্যন্ত access চালু করে না।

Webhook URL (প্রতি checkout-এ পাঠানো হয়): `/api/uddoktapay/webhook`। Webhook header যাচাইয়ের পরও payload trust করা হয় না; invoice server-to-server verify করা হয়। Duplicate callback idempotently handle করা হয়।

## ৫. প্রথম Test

1. প্রথমে test/smallest permitted amount-এর একটি subscription checkout তৈরি করুন।
2. Hosted Payment Page খুলছে কি না যাচাই করুন।
3. Gateway-এ test payment complete করুন (যদি UddoktaPay panel-এর test mode থাকে)।
4. Return page-এ subscription active হয়েছে কি না যাচাই করুন।
5. একই return URL reload করুন এবং webhook retry/duplicate করুন—একই subscription দ্বিতীয়বার extend হওয়া যাবে না।
6. Cancelled/pending/amount mismatch invoice হলে access active হওয়া যাবে না।

Live payment চালুর আগে hosted panel-এর default admin login credentials অবশ্যই পরিবর্তন করে unique strong password ব্যবহার করুন।

## Official contract

- Checkout: https://uddoktapay.readme.io/reference/create-charge
- Verify: https://uddoktapay.readme.io/reference/verify-payment-api-guideline
- Webhook auth/payload: https://uddoktapay.readme.io/reference/validate-webhook
- API key abilities: https://docs.uddoktapay.com/brand-settings/api
