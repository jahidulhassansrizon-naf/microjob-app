# GitHub Actions Gemini Bot — test

This package adds:
.github/workflows/gemini-playwright-bot.yml

It runs the existing playwright-service/server.js, restores the existing
Gemini Playwright storage state from a GitHub Secret, starts Chromium, and
exposes port 4000 through a temporary Cloudflare Quick Tunnel.

Required GitHub Secret:
GEMINI_SESSION_JSON = the exact contents of your existing gemini-session.json

Optional GitHub Secret:
ASK_KEY = your current server ASK_KEY, if you use it

Do NOT commit gemini-session.json.

Run:
GitHub -> Actions -> Gemini Playwright Bot -> Run workflow.

The temporary trycloudflare.com URL appears in the workflow Summary.
Use it temporarily as Vercel's GEMINI_RENDER_URL.

After the test succeeds, switch to a named Cloudflare Tunnel for a stable
backend URL.
