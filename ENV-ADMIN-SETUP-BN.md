# SebaLagbe: ENV Main Admin + Database Sub-admin সেটআপ

## 1. `.env.local` (লোকালহোস্ট)

নিচের variable names ব্যবহার করুন; বাস্তব password/secret source code বা Git-এ commit করবেন না:

```dotenv
ADMIN_EMAIL="আপনার-মেইন-অ্যাডমিন-ইমেইল"
ADMIN_PASSWORD="কমপক্ষে-১৬-অক্ষরের-দীর্ঘ-অনন্য-পাসওয়ার্ড"
ADMIN_NAME="Administrator"
JWT_SECRET="দীর্ঘ-এবং-র‌্যান্ডম-JWT-secret"
MONGODB_URI="আপনার-MongoDB-connection-string"
AUTH_RATE_LIMIT_SECRET="আলাদা-দীর্ঘ-র‌্যান্ডম-rate-limit-secret"
```

`ADMIN_NAME` ঐচ্ছিক; না দিলে `Administrator` দেখাবে। `AUTH_RATE_LIMIT_SECRET` ঐচ্ছিক, না থাকলে rate limiter `JWT_SECRET` ব্যবহার করবে।

র‌্যান্ডম secret তৈরি করতে PowerShell-এ চালাতে পারেন:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

প্রতিটি secret আলাদা করে তৈরি করুন। `JWT_SECRET` বা `ADMIN_PASSWORD` কখনো চ্যাট, screenshot, Git বা ZIP-এ দেবেন না।

## 2. Vercel

Vercel → Project → Settings → Environment Variables-এ Production (এবং দরকার হলে Preview/Development)-এর জন্য একই নাম যোগ করুন:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME` (optional)
- `JWT_SECRET`
- `MONGODB_URI`
- `AUTH_RATE_LIMIT_SECRET` (recommended)

Variable পরিবর্তনের পরে নতুন deployment প্রয়োজন। `.env.local` Vercel-এ upload করবেন না।

## 3. পুরোনো DB Primary Admin flag পরিষ্কার করা

এই সংস্করণে Main Admin MongoDB User record নয়; সে শুধু `ADMIN_EMAIL` + `ADMIN_PASSWORD` দিয়ে server-side authenticate হয়। Existing sub-admin-রা MongoDB User record-এ `role: "admin"` দিয়ে আগের account/password ব্যবহার করবে।

যদি আগের Bootstrap Script দিয়ে কোনো DB account-কে `isPrimaryAdmin: true` করা হয়ে থাকে, একবার চালান:

```powershell
npm run restore:env-admin
```

টার্মিনাল আগে target database name/host দেখাবে। Confirmation চাইলে exact text মিলিয়ে তারপর দিন। Script:
- কোনো user বা password delete করে না;
- legacy `isPrimaryAdmin` flag clear করে এবং affected session revoke করে;
- `ADMIN_EMAIL`-এর সঙ্গে মেলা পুরোনো DB account-কে `role: "user"` করে, যাতে সেই account-এর phone-login দিয়ে sub-admin access পাওয়া না যায়;
- অন্য `role: "admin"` account-গুলো sub-admin হিসেবেই রাখে।

প্রতিটি আলাদা database-এ আলাদাভাবে চালাতে হবে। আগে MongoDB backup রাখুন।

## 4. Login আচরণ

- Main Admin: `ADMIN_EMAIL` + `ADMIN_PASSWORD`; database user record/Bootstrap লাগবে না। এই email login-এ ভুল ENV password দিলে DB password-এ fallback করা হবে না। পুরোনো একই-email DB record থাকলে সেটি migration script দিয়ে সাধারণ login থেকে বাদ দেওয়া হবে।
- Sub-admin: Admin Panel থেকে `role: "admin"` দেওয়া existing user তার নিজের email/phone ও database password দিয়ে login করবে।
- Root-only কাজ (যেমন কাউকে admin role দেওয়া/সরানো বা অন্য sub-admin account পরিচালনা) শুধু ENV Main Admin করতে পারবে। Sub-admin সাধারণ admin কাজ করতে পারবে, কিন্তু নিজের চেয়ে উপরের authority পাবে না।
- Main Admin-এর password change করতে `ADMIN_PASSWORD` server environment-এ পরিবর্তন করে নতুন deployment দিন। Website-এর Forgot Password দিয়ে ENV password পরিবর্তন করা যাবে না।

## 5. পুরোনো command

`npm run bootstrap:admin` এবং `npm run diagnose:login` এই সংস্করণে আর নেই। Main Admin credential update `.env.local`/Vercel environment settings থেকে করতে হবে।
