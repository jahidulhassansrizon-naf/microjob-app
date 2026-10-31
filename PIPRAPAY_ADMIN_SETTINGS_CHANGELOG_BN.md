# PipraPay Admin Settings — ধাপের পরিবর্তন

## এই ধাপে যা যুক্ত হয়েছে

- Admin Dashboard navigation-এ নতুন **Payment Gateway** tab।
- Self-hosted PipraPay API Base URL input; default: `https://pay.devprobd.top/api`।
- Dedicated API Key password field এবং show/hide control।
- Authenticated admin-only GET/PUT API: `/api/admin/payment-gateway-settings`।
- MongoDB-তে আলাদা `PipraPaySettings` record।
- API Key AES-256-GCM দিয়ে encrypt করে storage; GET response-এ secret ফেরত পাঠানো হয় না।
- Base URL validation: HTTPS, public domain, `/api` বা root path; local/IP-literal URL block।
- Settings save করলেও `enabled=false`; payment চালু হয় না।

## Security

নতুন encryption key আলাদা `PIPRAPAY_ENCRYPTION_KEY` থেকে HKDF-SHA256 দিয়ে derive হয়; এটি application authentication-এর `JWT_SECRET`-এর সঙ্গে সম্পর্কিত নয়। Step 5-এর পুরোনো version 1 encrypted data legacy reader দিয়ে এখনো পড়া যায়; API Key পুনরায় Save করলে version 2 dedicated key দিয়ে encrypt হবে।

## এখনো বাকি

পরবর্তী ধাপে PipraPay runtime helper-কে environment variables-এর পরিবর্তে encrypted Admin settings থেকে Base URL ও API Key পড়তে যুক্ত করতে হবে। তারপর checkout/verify/webhook test করা হবে। এই ধাপ শেষ হওয়ার আগে API key panel-এ বসানো বা `PIPRAPAY_ENABLED=true` করা যাবে না।

## যাচাই

- Changed TypeScript/TSX files: TypeScript transpile syntax validation passed.
- AES-256-GCM encrypt/decrypt round-trip: passed.
- Client Base URL HTTPS validation: passed.
- HTTP and IP-literal URL rejection: passed.
- Full Next.js production build: not run in this environment because project dependencies are not installed here.


## Step 4 — Runtime সংযোগ সম্পন্ন

- `app/api/payment/_lib/piprapay.ts` এখন Admin Panel-এর `PipraPaySettings` record থেকে Base URL ও API Key পড়ে।
- Encrypted API Key শুধু server-side decrypt হয়।
- Checkout, verify এবং webhook একই saved credentials ব্যবহার করে।
- Checkout শুধুমাত্র `enabled=true` হলে শুরু হয়; Save API সর্বদা `enabled=false` করে রাখে।
- `PIPRAPAY_API_KEY`, `PIPRAPAY_BASE_URL` ও `PIPRAPAY_ENABLED` env dependency সরানো হয়েছে।
- পরবর্তী ধাপে connection test ও Admin-side enable action করতে হবে।
