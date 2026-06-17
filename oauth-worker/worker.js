/* Foundation Protocol — GitHub OAuth device-flow CORS proxy.
 *
 * GitHub's device-flow endpoints don't send CORS headers, so a static
 * browser app can't call them directly. This Worker just relays the two
 * POSTs and adds CORS. It holds NO secret (device flow uses only a public
 * client_id) and stores nothing.
 *
 * Deploy (free): see docs/SETUP-OAUTH.md.
 *   npm i -g wrangler && wrangler login && wrangler deploy
 * Then put the Worker URL into GH_OAUTH_PROXY in index.html.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: CORS });

    const url = new URL(request.url);
    let target = null;
    if (url.pathname.endsWith('/device/code')) target = 'https://github.com/login/device/code';
    else if (url.pathname.endsWith('/access_token')) target = 'https://github.com/login/oauth/access_token';
    else return new Response('Not found', { status: 404, headers: CORS });

    const body = await request.text();
    const ghResp = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'foundation-protocol' },
      body,
    });
    const text = await ghResp.text();
    return new Response(text, {
      status: ghResp.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  },
};
