# PipraPay Step 5 — Connection Test

## Added
- Added admin-only `POST /api/admin/payment-gateway-settings/test` endpoint.
- The test loads decrypted credentials from the server-side MongoDB settings record; the API key is never returned to the client.
- Performs a read-only `POST /api/verify-payment` request with a deliberately fake `pp_id` sentinel.
- Detects common invalid-key responses (401/403 and explicit auth error messages), missing endpoint (404), provider errors, timeouts, and ambiguous responses.
- Added a Test connection button and status feedback to the Admin Payment Gateway panel.
- The Test connection button is disabled until credentials are saved and the current form has no unsaved URL/key changes.
- No payment checkout or refund is created by the connection test.

## Safety
- PipraPay remains disabled for user checkout.
- Connection test does not change the `enabled` setting.
- Do not treat a successful connection test as proof that payment checkout, webhook delivery, or subscription activation are production-ready.
