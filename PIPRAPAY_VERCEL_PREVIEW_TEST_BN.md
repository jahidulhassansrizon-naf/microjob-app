# SebaLagbe PipraPay — Vercel Preview Deployment Guide

এই ধাপটি শুধু Vercel-এ server-to-server API connection পরীক্ষা করার জন্য। **এখনো কোনো real payment চালু করবেন না।** Admin settings-এ PipraPay `enabled=false` থাকবে।

## 1) কোন code deploy করবেন

এই ZIP-এর সম্পূর্ণ project GitHub-এর সেই branch-এ push করুন যেটি Vercel project-এর সঙ্গে যুক্ত। প্রথমে **Preview Deployment** ব্যবহার করুন; সরাসরি Production-এ পরীক্ষা করবেন না।

## 2) Vercel Environment Variables

Vercel → Project → Settings → Environment Variables-এ `.env.local` থেকে এই অ্যাপের প্রয়োজনীয় server-side variables যোগ করুন। অন্তত PipraPay test-এর জন্য নিচেরগুলো যাচাই করুন:

- `MONGODB_URI` — একই MongoDB database/cluster-এ যেতে হবে, যেখানে Admin Panel থেকে PipraPay settings save করেছেন।
- `JWT_SECRET` — অ্যাপের বর্তমান login/session secret; local-এর একই value দিন। এটি পরিবর্তন বা rotate করবেন না শুধু PipraPay-এর জন্য।
- `PIPRAPAY_ENCRYPTION_KEY` — ৬৪ hexadecimal character (৩২ random bytes)। **Local ও Vercel-এ হুবহু একই value দিন**, যদি একই MongoDB record ব্যবহার করেন। এই key বদলালে আগের encrypted PipraPay API key decrypt করা যাবে না।
- `NEXT_PUBLIC_SITE_URL` — Preview deployment-এর সম্পূর্ণ HTTPS URL, যেমন `https://your-preview-domain.vercel.app`।
- `NEXT_PUBLIC_APP_URL` এবং `APP_URL` — project-এর local configuration-এ ব্যবহৃত থাকলে একই Preview HTTPS URL দিন।
- `AUTH_RATE_LIMIT_SECRET`, `OTP_HASH_SECRET` এবং অ্যাপের অন্য যে server-side variables local `.env.local`-এ প্রয়োজন, সেগুলোও Vercel-এ যোগ করুন।

`PIPRAPAY_ENCRYPTION_KEY`, `JWT_SECRET`, `MONGODB_URI` বা API key কখনো `NEXT_PUBLIC_` নামে তৈরি করবেন না। কোনো secret GitHub-এ commit করবেন না।

## 3) Database ও encrypted credential সতর্কতা

Vercel যদি local-এর একই MongoDB database ব্যবহার করে, local-এ save করা encrypted API key পড়তে Vercel-এ একই `PIPRAPAY_ENCRYPTION_KEY` আবশ্যক। Vercel-এ আলাদা MongoDB database ব্যবহার করলে সেখানে Admin Panel থেকে Base URL ও API key আবার save করতে হবে। API key source code-এ hardcode করবেন না।

## 4) Deploy ও পরীক্ষা

1. Preview Environment Variables save করুন।
2. নতুন Preview Deployment তৈরি করুন।
3. Preview site-এ Admin হিসেবে login করুন।
4. Admin → Payment Gateway-এ গিয়ে saved Base URL `https://pay.devprobd.top/api` এবং API key configured দেখাচ্ছে কি না যাচাই করুন। আসল key কখনো UI/log-এ প্রকাশ করবেন না।
5. `Test Connection` চাপুন। এই test dummy `pp_id` দিয়ে verification endpoint পরীক্ষা করে; checkout, charge বা refund তৈরি করে না।
6. ফলাফলের status, HTTP code এবং message নোট করুন; API key বা secret শেয়ার করবেন না।

## 5) ফলাফল বুঝবেন যেভাবে

- **Vercel connected, Localhost 401/403:** self-hosted PipraPay server-এর IP allow-list/firewall-এ local network-এর outgoing IP সীমাবদ্ধ থাকতে পারে।
- **Localhost ও Vercel দুটোতেই 401/403:** key active/permission, API header/contract, অথবা PipraPay server-এর API access policy যাচাই করতে হবে।
- **Vercel-এ settings/decryption error:** `MONGODB_URI` বা `PIPRAPAY_ENCRYPTION_KEY` local-এর সঙ্গে সঠিকভাবে মিলেছে কি না পরীক্ষা করুন।
- **404:** Base URL-এ `/api` একবারই আছে কি না এবং installed PipraPay version-এর endpoint মিলছে কি না পরীক্ষা করুন।

## 6) এই ধাপে যা করবেন না

- Admin থেকে PipraPay Payments enable করবেন না।
- Real checkout/charge/refund চালাবেন না।
- API key বা encryption secret ChatGPT, GitHub issue, screenshot বা public log-এ দেবেন না।
- Chat-এ আগে প্রকাশিত API key revoke করে নতুন dedicated key ব্যবহার করুন; নতুন key শুধু Admin Settings-এ secure channel দিয়ে save করুন।

Connection test সফল হলেও real payment চালুর আগে sandbox/test transaction, webhook verification, amount/currency matching, duplicate callback/idempotency এবং full production build পরীক্ষা করতে হবে।
