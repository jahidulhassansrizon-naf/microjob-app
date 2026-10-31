# PipraPay Integration — Step 1 পরিবর্তন

ক্লায়েন্টের দেওয়া self-hosted API settings অনুযায়ী server-side integration layer আপডেট করা হয়েছে।

## API configuration

- `PIPRAPAY_BASE_URL=https://pay.devprobd.top/api`
- Checkout session: `POST /api/checkout/redirect`
- Verify payment: `POST /api/verify-payment`
- Authentication: `MHS-PIPRAPAY-API-KEY`

## পরিবর্তিত ফাইল

1. `app/api/payment/_lib/piprapay.ts`
   - নতুন redirect-checkout request helper যোগ করা হয়েছে।
   - customer-এর email ও mobile আলাদা পাঠানো হয়।
   - metadata JSON string হিসেবে পাঠানো হয়।
   - provider থেকে HTTPS checkout URL ছাড়া redirect অনুমোদন করা হয় না।
   - verification endpoint plural `verify-payments` থেকে singular `verify-payment` করা হয়েছে।
   - নতুন response-এর `trx_id` transaction reference হিসেবেও পড়া হয়।

2. `app/api/checkout/route.ts`
   - পুরোনো V2 `create-charge` request সরানো হয়েছে।
   - নতুন `/checkout/redirect` API helper ব্যবহার করা হয়েছে।
   - ইউজারের server-side plan price-ই পাঠানো হয়; browser-এর price বিশ্বাস করা হয় না।
   - email বা mobile profile-এ না থাকলে checkout শুরু হয় না।

3. `app/api/payment/verify/route.ts`
   - verification response-এর `trx_id` alias frontend response-এ প্রকাশ করা হয়।

4. `PIPRAPAY_SETUP.md` এবং `PIPRAPAY_SETUP_BN.md`
   - client-এর self-hosted URL ও নতুন API contract অনুযায়ী update করা হয়েছে।

## এখনো বাকি

- Client API key নিরাপদ server environment-এ যোগ করা।
- Client instance-এর real checkout response ও verify response sample-এর সঙ্গে field mapping নিশ্চিত করা।
- Sandbox/test transaction ও webhook test করা।
- UI থেকে PipraPay checkout শুরু করার flow পরবর্তী ধাপে সংযুক্ত করা।

`PIPRAPAY_ENABLED=false` রাখুন। এই Step-এ কোনো live payment চালু করা হয়নি।


## পরবর্তী Step-এর update

পরবর্তী Admin Settings integration step-এ Base URL ও API Key `.env` থেকে নয়, MongoDB-তে encrypted Admin settings থেকে পড়ার ব্যবস্থা করা হয়েছে। তাই উপরের environment variable উদাহরণটি ঐতিহাসিক Step 1 reference; বর্তমান runtime-এ PipraPay credentials Admin → Payment Gateway থেকে পড়া হয়। Payment enable করার আগে connection ও end-to-end tests আবশ্যক।
