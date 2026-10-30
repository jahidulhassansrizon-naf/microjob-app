# Diagnostic packet manifest

Purpose: investigate Primary Admin login returning HTTP 401 for one device/user while the same account reportedly works on another device.

Sources:
- Application source: SebaLagbe-App-Smooth-Navigation.zip (latest available integrated App archive in this workspace).
- Models/libs/config/bootstrap: SebaLagbe-Second-Database-Admin.zip.
- The separately supplied SebaLagbe-Login-Route-Fix.zip login route was byte-for-byte identical to the login route included from the latest App archive: YES.

Included source files: 70

No .env/.env.local, database URI, password, password hash, OTP, cookies, session tokens, JWT secrets, or deployment secrets were intentionally included.

Important: this is a focused diagnostic packet, not a complete application ZIP. It includes auth APIs, relevant UI, user/admin authorization routes, all lib/model source from the supplied second ZIP, bootstrap script and project config.

Source archive provenance per file is listed in SOURCE_FILE_MANIFEST.tsv.
