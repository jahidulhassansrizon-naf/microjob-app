# SebaLagbe — PipraPay Checkout UI Integration

## এই ZIP-এ যা যোগ/পরিবর্তন করা হয়েছে

1. Subscription page-এ PipraPay online checkout button যুক্ত করা হয়েছে।
2. PipraPay checkout enabled না থাকলে online button দেখানো হবে না; bKash/Nagad Manual Payment আগের মতো available থাকবে।
3. `/api/payment/piprapay-status` শুধু checkout enabled কি না জানায়; কোনো secret browser-এ ফেরত দেয় না।
4. Admin → Payment Gateway-এ Enable/Disable Live Checkout control যুক্ত হয়েছে। Enable করার আগে server-side V3+ verification endpoint-এ read-only dummy-reference probe চলে। এই probe কোনো charge তৈরি করে না।
5. Checkout create, payment return, webhook verification এবং amount/currency/order matching-এর existing server-side flow অপরিবর্তিত রাখা হয়েছে।
6. Subscription feature copy-তে payment verification-এর ভাষা ব্যবহার করা হয়েছে, যাতে automatic PipraPay ও manual approval—দুই flow-ই সঠিকভাবে বোঝায়।

## Local / Vercel-এ প্রয়োগ

- এই ZIP-এর `SebaLagbe/` folder-এর ফাইলগুলো তোমার project root-এ merge/overwrite করো।
- তোমার আগের `.env.local` ফাইলটি overwrite বা GitHub-এ commit করবে না।
- `NEXT_PUBLIC_SITE_URL`-এ public HTTPS site URL থাকতে হবে।
- `PIPRAPAY_ENCRYPTION_KEY` অবশ্যই সেই MongoDB database-এ saved API key encrypt করার সময় ব্যবহৃত একই key হতে হবে।
- Local-এ `npm run build` চালাও; সফল হলে GitHub-এ source commit/push করে Vercel redeploy করো।

## Live checkout চালু করার নিয়ম

1. Admin → Payment Gateway খুলে settings reload করো।
2. Test Connection চালিয়ে V3+ connection confirmation দেখো।
3. যখন সত্যিকারের payment test করার জন্য প্রস্তুত, তখনই **Enable live checkout** চাপো। Server আবার V3+ verification probe করবে।
4. সফল হলে Subscription page-এ PipraPay online checkout button দেখা যাবে। bKash/Nagad Manual Payment backup হিসেবে থাকবে।
5. Checkout-এ গেলে customer PipraPay hosted page-এ যাবে। Return/webhook payload-কে payment proof ধরা হয় না; server PipraPay verification API থেকে status, BDT currency, amount ও order/user match যাচাই করার পরই subscription activate করে।
6. Test শেষে দরকার হলে Admin → Payment Gateway থেকে **Disable live checkout** চাপো।

## সতর্কতা

- এই integration-এ আলাদা sandbox mode নিশ্চিত করা হয়নি। **Enable live checkout** করলে customer-দের জন্য real payment শুরু হতে পারে। প্রথম test-এ নিজের account দিয়ে smallest available plan ব্যবহার করো এবং gateway dashboard-এ transaction মিলিয়ে দেখো।
- শুধু browser redirect বা success page দেখেই payment সফল ধরে নিও না। Success page-এ server-side verification সম্পন্ন হওয়া দরকার।
- API key chat, source code বা GitHub-এ দেবে না। আগে chat-এ প্রকাশিত key-টি revoke করে নতুন key ব্যবহার করো।
- `.env.local` ও production secrets কখনো ZIP/GitHub-এ commit করবে না।

## Validation note

এই ZIP তৈরির সময় পরিবর্তিত TypeScript/TSX ফাইলগুলোর syntax transpilation এবং ZIP integrity পরীক্ষা করা হয়েছে। পূর্ণ `npm run build` বা live PipraPay checkout transaction এই environment-এ চালানো হয়নি।
