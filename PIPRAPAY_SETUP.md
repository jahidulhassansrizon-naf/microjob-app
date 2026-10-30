# PipraPay payment integration setup

For now, users continue to pay through the existing manual bKash/Nagad flow: send money, submit the TrxID and sender number, then wait for an admin to verify and approve the payment. The subscription page displays a PipraPay-coming-soon notice. PipraPay server code is retained but checkout is disabled until `PIPRAPAY_ENABLED=true` is deliberately set after the client's API version, credentials, and sandbox tests are confirmed. Paymently has not been restored.

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

Keep PipraPay disabled until client details and sandbox checks are complete:

```dotenv
PIPRAPAY_ENABLED=false
PIPRAPAY_API_KEY=replace_with_client_server_api_key
PIPRAPAY_BASE_URL=https://sandbox.piprapay.com
NEXT_PUBLIC_SITE_URL=https://your-public-domain.example
```

- For sandbox, use `https://sandbox.piprapay.com`.
- For production, set `PIPRAPAY_BASE_URL` to the client's live PipraPay installation/API origin. Self-hosted PipraPay commonly uses the client's own HTTPS domain. The integration appends `/api` unless the configured value already ends in `/api`.
- Production checkouts deliberately fail closed unless `PIPRAPAY_BASE_URL` is explicitly configured, to avoid sending live customers to the sandbox by accident.
- `NEXT_PUBLIC_SITE_URL` must be the public HTTPS URL of this Next.js app. The app constructs these callback URLs:
  - Return: `https://your-domain/api/payment/return?subscription_id=...`
  - Webhook: `https://your-domain/api/payment/webhook`
- `BKASH_PAYMENT_NUMBER` / `NAGAD_PAYMENT_NUMBER` are displayed on the temporary manual payment page; keep them server-side.
- Set `PIPRAPAY_ENABLED=true` only after the correct client API version is wired and sandbox checkout, verification, webhook and return tests all pass.
- Keep the project's existing `JWT_SECRET`, database configuration, and auth environment variables as they are.

## API contract currently wired

The implementation currently targets the documented PipraPay V2 REST payload:

- Create: `POST /api/create-charge`
- Verify: `POST /api/verify-payments` with `{ "pp_id": "..." }`
- API auth header: `mh-piprapay-api-key`
- Create charge fields: `full_name`, `email_mobile`, `amount`, `metadata`, `redirect_url`, `return_type`, `cancel_url`, `webhook_url`, `currency`.

The return route accepts GET or POST provider callbacks and forwards `pp_id` to the success page. The webhook accepts JSON or form-encoded callbacks, validates the API-key header, then re-verifies the payment directly through PipraPay before granting access. The browser callback does not itself count as proof of payment.

**Important:** PipraPay's newer V3+ contract has different required customer fields (separate email and mobile values) and its account-specific base URL/configuration may differ. Before going live, ask the client to confirm whether their panel/API is V2 or V3+, and provide the matching current API request/response examples. Do not change `PIPRAPAY_API_KEY` or the app's API version by guessing.

## Ask the client for these items

1. **PipraPay panel/API version:** V2 or V3+ (and a link to the exact API docs/version they have enabled).
2. **Sandbox API base URL** and **live/production API base URL**. For self-hosted, ask for the public HTTPS origin where their PipraPay instance is installed.
3. **Sandbox API key** and **live API key**, if separate. Send credentials through a password manager or other secure channel—not in source code, screenshots, or a public chat.
4. **Create-charge sample:** a working request and a successful JSON response, including the checkout URL and whether `pp_id` / `invoice_id` is returned immediately.
5. **Verify-payment sample:** a successful completed-payment JSON response, plus one pending/failed example. We need the exact `status`, `amount`, `currency`, `metadata`, and payment-ID fields the panel returns.
6. **Webhook details:** confirm the webhook must be configured to send `mh-piprapay-api-key`, and confirm whether the client can register the provided webhook URL. The application endpoint is `/api/payment/webhook`.
7. **Enabled payment channels:** confirm which customer-facing methods (such as bKash, Nagad, Rocket, cards, etc.) are enabled in their PipraPay dashboard. Those payment channels are controlled by PipraPay, not hard-coded as separate app methods.
8. **Sandbox test access:** ask for a test account/instructions or a way to perform a low-value test payment and refund/void it.

## Activation and safety behavior

- A new order is stored as `PENDING` before contacting PipraPay.
- A payment is activated only after PipraPay's server-side verify endpoint reports `completed`, the returned payment ID maps to the order, the metadata/owner/plan match, the verified response explicitly reports BDT, and the amount exactly matches the selected plan.
- Duplicate callbacks are idempotent; they do not add the subscription term twice.
- On success, the order becomes `COMPLETED` + `ACTIVE`, and its review state is automatically `APPROVED`.
- If the customer returns before the webhook arrives, the success page polls the order status; it does not grant access while the order is pending.
- Current manual wallet payment submissions create `PENDING` rows via `/api/payment/manual-submit`. Admin Dashboard → Subscriptions allows Approve/Reject for pending bKash/Nagad submissions with a TrxID; approval activates the selected plan duration. This manual review endpoint explicitly refuses PipraPay orders.

## Go-live checklist

1. Add the client's API key and live base URL to the hosting environment.
2. Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS domain.
3. Ask the client to allow/register `https://your-domain/api/payment/webhook` in their PipraPay configuration.
4. Run sandbox tests for success, cancel, pending, failed, and duplicate webhook/callback events.
5. Confirm the actual verification response currency and amount are BDT and match the plan amount before enabling live payments.
6. Switch to the live API key/base URL only after all sandbox checks pass.
