# "Sign in with GitHub" — 5-minute setup

The app can do a real one-click **Sign in with GitHub** (OAuth **device flow**). It needs no client secret and no full backend — just one tiny free CORS proxy (a Cloudflare Worker). Once set up, any user who visits the app can sign in and their training data saves to **their own** private GitHub repo (`<their-login>/foundation-protocol-data`).

You only do this once. Then send me two values and I'll flip them on.

## Step 1 — Register a GitHub OAuth App (≈2 min)
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name:** `Foundation Protocol`
   - **Homepage URL:** `https://barknard.github.io/foundation-protocol-web/`
   - **Authorization callback URL:** `https://barknard.github.io/foundation-protocol-web/` (device flow doesn't use it, but the field is required)
3. Create it. On the app page, **check "Enable Device Flow"** and Save.
4. Copy the **Client ID** (looks like `Ov23li...`). It's public — safe to share/embed. ➜ **send me this.**

## Step 2 — Deploy the CORS proxy (≈3 min, free)
The Worker code is in `oauth-worker/`. Using Cloudflare (free tier):
```bash
cd oauth-worker
npm install -g wrangler
wrangler login          # opens browser, authorize
wrangler deploy
```
It prints a URL like `https://foundation-oauth.<you>.workers.dev`. ➜ **send me this URL.**

(Prefer not to use the CLI? In the Cloudflare dashboard: Workers & Pages → Create Worker → paste `oauth-worker/worker.js` → Deploy.)

## Step 3 — I flip it on
Send me the **Client ID** + **Worker URL**. I set two constants at the top of `index.html`:
```js
const GH_CLIENT_ID  = 'Ov23li...';
const GH_OAUTH_PROXY = 'https://foundation-oauth.<you>.workers.dev';
```
Deploy, and the **"Sign in with GitHub"** button goes live in Settings and on the first onboarding screen. The pasted-token path stays as a fallback.

## How it works / security
- Device flow: the app POSTs to GitHub (via the proxy) for a code, you authorize on github.com, the app polls for the token. **No client secret anywhere.**
- The Worker only relays those two POSTs and adds CORS headers — it stores nothing and holds no secret. An open relay is fine here because device flow needs only the public client_id.
- The token is stored in the browser (same place as a pasted token), scoped to `repo` so the app can create + write the user's private data repo.
