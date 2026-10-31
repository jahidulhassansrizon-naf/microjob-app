# PipraPay payment integration setup

For now, users continue to pay through the existing manual bKash/Nagad flow: send money, submit the TrxID and sender number, then wait for an admin to verify and approve the payment. The subscription page displays a PipraPay-coming-soon notice. The self-hosted redirect-checkout API adapter now reads the Base URL and encrypted API key from Admin → Payment Gateway. Checkout remains disabled while the stored Admin setting `enabled` flag is false; keep it disabled until connection, response mapping, sandbox and webhook tests pass. Paymently has not been restored.

## Subscription plans (unchanged)

- 1 Month — BDT 99 (30 days)
- 6 Months — BDT 499 (180 days)
- 1 Year — BDT 899 (365 days)

The canonical plan catalogue is `app/_lib/subscriptionPlans.ts`.

## Server environment variables

Set these on the server/hosting provider. **Do not use `NEXT_PUBLIC_` for the API key and do not put the key in client-side code.**

Configure the current manual wallet numbers:

```dotenv
BKASH_PAYMENT_NUMBER=01XXXXXXXXX
NAGAD_PAYMENT_NUMBER=01XXXXXXXXX
```

Keep the PipraPay Admin setting disabled until connection and sandbox checks are complete. The runtime uses database-backed settings, not PipraPay environment variables:

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-public-domain.example
```

- The client provided the self-hosted API base URL `https://pay.devprobd.top/api`.
- The dashboard's customer-facing Gateway Checkout URL is `https://pay.devprobd.top/checkout`. The app should not hardcode this as an API request; it creates a session through `POST /api/checkout/redirect` and redirects to the HTTPS checkout URL returned by the API.
- The Admin Dashboard now has a **Payment Gateway** tab for saving the API Base URL and API Key. The runtime checkout, verification and webhook handlers now load this encrypted MongoDB configuration server-side. The key is never returned to the browser.
- PipraPay API keys are encrypted with AES-256-GCM using a dedicated `PIPRAPAY_ENCRYPTION_KEY`, independent from `JWT_SECRET`. Keep the two secrets separate; do not change `JWT_SECRET` to fix payment credential encryption.
- The settings UI/storage and server-side runtime connection are complete. Real payment remains disabled until the next step adds an explicit connection test/enable action and end-to-end testing. Do not enable real payment yet.
- `NEXT_PUBLIC_SITE_URL` must be the public HTTPS URL of this Next.js app. The app constructs these callback URLs:
  - Return: `https://your-domain/api/payment/return?subscription_id=...`
  - Webhook: `https://your-domain/api/payment/webhook`
- `BKASH_PAYMENT_NUMBER` / `NAGAD_PAYMENT_NUMBER` are displayed on the temporary manual payment page; keep them server-side.
- Keep the Admin `enabled` flag false until connection test and checkout, verification, webhook and return tests all pass.
- Keep the project's existing `JWT_SECRET`, database configuration, and auth environment variables as they are. Add a separate `PIPRAPAY_ENCRYPTION_KEY` as documented below.

## API contract currently wired

The client supplied a self-hosted PipraPay API settings page with these URLs:

- API Base URL: `https://pay.devprobd.top/api`
- Customer-facing Gateway Checkout URL: `https://pay.devprobd.top/checkout`
- Verify Payment: `POST /api/verify-payment`
- Refund Payment: `POST /api/refund-payment` (not needed for normal subscription checkout)

The current official Redirect Checkout API reference documents:

- Create checkout: `POST /api/checkout/redirect`
- Verify payment: `POST /api/verify-payment` with `{ "pp_id": "..." }`
- Authentication header: `MHS-PIPRAPAY-API-KEY`
- Checkout fields: `full_name`, `email_address`, `mobile_number`, `amount`, `currency`, `metadata`, `return_url`, `webhook_url`.
- The current docs describe `metadata` as a JSON string.

The server-side API client and `/api/checkout` route have been updated to use this contract. The app expects a secure HTTPS checkout URL in the provider response and stores the returned `pp_id` when available. The verify helper now calls the client's singular `/api/verify-payment` path.

The client has confirmed an API key is available. It should be entered only in Admin → Payment Gateway; checkout, verification and webhook now read the encrypted saved settings at runtime. A sandbox request and precise response fields must still be confirmed before production payments are enabled.

The return route accepts GET or POST callbacks and forwards the `pp_id` to the success page. The webhook validates the API-key header and then re-verifies the payment directly with PipraPay before granting access. Browser callback parameters and webhook payloads are not treated as proof of payment.

## Ask the client for these items

1. **API key:** obtain the server API key over a secure private channel. Do not put it in source code, screenshots, GitHub, or public chat.
2. **Successful checkout response:** get one real JSON response from `POST /api/checkout/redirect`, with secrets redacted, so the exact checkout URL and `pp_id` fields can be confirmed.
3. **Verification response samples:** get completed, pending, and failed JSON examples from `POST /api/verify-payment`, with `status`, `amount`, `currency`, `metadata`, payment ID, and transaction ID fields visible.
4. **Webhook setup:** confirm whether the instance sends the API-key header to the configured webhook URL and register `https://your-domain/api/payment/webhook` if required.
5. **Test method:** confirm whether the client's instance has a sandbox/test mode or provide a safe low-value test procedure.
6. **Enabled payment channels:** confirm which customer-facing methods are enabled in the PipraPay dashboard. These are controlled by PipraPay, not hard-coded as separate app methods.

## Activation and safety behavior

- A new order is stored as `PENDING` before contacting PipraPay.
- A payment is activated only after PipraPay's server-side `/api/verify-payment` endpoint reports `completed`, the returned payment ID maps to the order, the metadata/owner/plan match, the verified response explicitly reports BDT, and the amount exactly matches the selected plan.
- Duplicate callbacks are idempotent; they do not add the subscription term twice.
- On success, the order becomes `COMPLETED` + `ACTIVE`, and its review state is automatically `APPROVED`.
- If the customer returns before the webhook arrives, the success page polls the order status; it does not grant access while the order is pending.
- Current manual wallet payment submissions create `PENDING` rows via `/api/payment/manual-submit`. Admin Dashboard → Subscriptions allows Approve/Reject for pending bKash/Nagad submissions with a TrxID; approval activates the selected plan duration. This manual review endpoint explicitly refuses PipraPay orders.

## Go-live checklist

1. Save the client's API key and base URL in Admin → Payment Gateway. The runtime will consume these encrypted settings server-side.
2. Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS domain.
3. Ask the client to allow/register `https://your-domain/api/payment/webhook` in their PipraPay configuration.
4. Run sandbox tests for success, cancel, pending, failed, and duplicate webhook/callback events.
5. Confirm the actual verification response currency and amount are BDT and match the plan amount before enabling live payments.
6. Switch to the live API key/base URL only after all sandbox checks pass.

## Admin connection test

After saving the Base URL and API Key in Admin Dashboard → Payment Gateway, use **Test connection**. The server sends a read-only `POST /api/verify-payment` request with a deliberately invalid sentinel `pp_id`; it must not create a charge or refund. An authentication rejection is reported as an invalid key; endpoint/path mismatches are reported separately. A successful connection test does not replace end-to-end checkout, webhook, amount/currency, or subscription activation testing. Do not enable live checkout based on this test alone.


## Dedicated PipraPay encryption key

New PipraPay API credentials are encrypted with AES-256-GCM using a dedicated 32-byte key. This key is independent from `JWT_SECRET`, so payment credential encryption does not depend on application login/session secrets.

Generate a key from the project root:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the 64-character hexadecimal output into `.env.local` (local development) and the server-side environment configuration in production:

```dotenv
PIPRAPAY_ENCRYPTION_KEY=PASTE_64_HEX_CHARACTERS_HERE
```

Restart the local Next.js server after editing `.env.local`. Do not commit this value, expose it through a `NEXT_PUBLIC_` variable, or send it in chat. Keep a secure backup: changing this key makes version 2 credentials already stored in MongoDB undecryptable until the API key is re-entered and saved with the new key.

For backward compatibility, the code can still read version 1 credentials encrypted by the previous Step 5 implementation using `JWT_SECRET`. Re-saving the API key in Admin → Payment Gateway encrypts it as version 2 with `PIPRAPAY_ENCRYPTION_KEY`.
