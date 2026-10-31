# Step 7 — Dual API Contract Connection Diagnostic

Admin → Payment Gateway → Test Connection এখন প্রথমে PipraPay V3+ `POST /api/verify-payment` + `MHS-PIPRAPAY-API-KEY` পরীক্ষা করে। বর্তমান endpoint 401/403 বা request contract চিনতে না পারলে এটি legacy V2 `POST /api/verify-payments` + `mh-piprapay-api-key` দিয়ে read-only dummy verification চেষ্টা করে।

- কোনো checkout, charge বা refund তৈরি হয় না।
- V3+ success হলে `connected` দেখায়।
- V2 success হলে `legacy-api-detected` দেখায় এবং checkout code V2-তে না মেলানো পর্যন্ত payment enable করতে নিষেধ করে।
- উভয় endpoint 401/403 দিলে message-এ key invalid/inactive, permission restriction, IP allow-list বা security policy—সম্ভাব্য কারণ আলাদা করে বলা হয়; শুধু 403 দেখে key-কে নিশ্চিতভাবে invalid বলা হয় না।
- এই test key কখনো browser-এ ফেরত পাঠায় না।

Local server restart করে Admin Panel থেকে Save Settings-এর পর আবার Test Connection চালাতে হবে।
