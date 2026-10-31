# PipraPay Admin Settings Integration — Step 4

## এই ধাপে যা যুক্ত হয়েছে

- Runtime PipraPay Base URL আর `.env` থেকে পড়ে না; Admin → Payment Gateway-এ সংরক্ষিত MongoDB record থেকে পড়ে।
- API Key MongoDB-এর encrypted field থেকে server-side decrypt হয়; browser-এ কখনো ফেরত দেওয়া হয় না।
- Checkout request `/api/checkout/redirect`-এ সংরক্ষিত Base URL ও API Key ব্যবহার করে।
- Payment verification `/api/verify-payment`-এ একই saved settings ব্যবহার করে।
- Webhook authentication এখন Admin Panel-এ সংরক্ষিত API Key দিয়ে হয়।
- Checkout চালু হওয়ার আগে settings record-এর `enabled` flag অবশ্যই true হতে হবে। বর্তমানে settings save করলে `enabled=false` থাকে, তাই এই ধাপে real payment বন্ধই থাকে।
- `PIPRAPAY_ENABLED` environment flag সরানো হয়েছে; পরবর্তী ধাপে Admin-side connection test ও explicit enable control যোগ হবে।
- Base URL/API Key না থাকলে, database settings পড়তে না পারলে বা encryption key দিয়ে decrypt করা না গেলে integration fail-closed থাকবে।

## অপারেশনাল আচরণ

1. Admin Settings-এ Base URL `https://pay.devprobd.top/api` এবং API Key save করুন।
2. Save করলেই payment চালু হবে না।
3. পরবর্তী ধাপে connection test, provider response validation এবং Admin enable control যোগ করা হবে।
4. তারপর sandbox/test payment এবং webhook end-to-end যাচাই করা হবে।

## Security

- API Key কেবল server-side API request header-এ ব্যবহৃত হয়।
- GET settings API শুধু `apiKeyConfigured` boolean দেয়, secret ফেরত দেয় না।
- API Key AES-256-GCM encrypted থাকে। নতুন encryption version 2-এর key আলাদা `PIPRAPAY_ENCRYPTION_KEY` থেকে HKDF-SHA256 দিয়ে derive হয়।
- `PIPRAPAY_ENCRYPTION_KEY` পরিবর্তন হলে version 2-এর saved key decrypt হবে না; Admin-কে নতুন করে API Key save করতে হবে। Step 5-এর version 1 credential-এর জন্য সাময়িক legacy decryption support রাখা হয়েছে।
- Webhook payload নিজে payment proof নয়; webhook notification পাওয়ার পর server provider-এর verify endpoint-এ আবার যাচাই করে।

## যাচাইয়ের সীমাবদ্ধতা

এই environment-এ project dependencies/node_modules নেই, তাই পূর্ণ `npm run build` চালানো যায়নি। পরিবর্তিত TypeScript ফাইলগুলোর syntax transpilation, route-reference scan, এবং ZIP integrity পরীক্ষা করা হয়েছে। Live API request করা হয়নি; ক্লায়েন্টের API Key ব্যবহার করা হয়নি।
