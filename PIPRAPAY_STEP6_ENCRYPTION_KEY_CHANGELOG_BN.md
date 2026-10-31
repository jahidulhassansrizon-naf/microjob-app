# Step 6 — PipraPay Encryption Key আলাদা করা

- `JWT_SECRET` আর PipraPay credential encryption-এর জন্য ব্যবহৃত হয় না। এটি application authentication/session-এর জন্য অপরিবর্তিত থাকে।
- নতুন `PIPRAPAY_ENCRYPTION_KEY` environment variable থেকে ৩২-byte key (৬৪ hexadecimal character) গ্রহণ করা হয়।
- নতুন API Key AES-256-GCM + HKDF-SHA256 দিয়ে encrypted version 2 হিসেবে MongoDB-তে সংরক্ষিত হয়।
- Step 5-এর পুরোনো version 1 ciphertext legacy `JWT_SECRET` দিয়ে decrypt করা যায়, যাতে বিদ্যমান saved credential হঠাৎ অচল না হয়। API Key আবার Save করলে version 2-তে migrate হয়।
- Missing/invalid dedicated key হলে settings API স্পষ্ট configuration error এবং HTTP 503 দেয়; authentication secret পরিবর্তনের নির্দেশ দেয় না।

## Local setup

Project root থেকে চালান:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Output `.env.local`-এ যোগ করুন:

```dotenv
PIPRAPAY_ENCRYPTION_KEY=PASTE_64_HEX_CHARACTERS_HERE
```

এরপর Next.js dev server সম্পূর্ণ restart করুন। Secret GitHub-এ commit করবেন না; production server environment-এ একই variable আলাদাভাবে সেট করতে হবে।
