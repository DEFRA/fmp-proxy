# Security suggestions: restricting fmp-proxy to fmp-app clients

You can't fully guarantee that only fmp-app's pages call the proxy, because the browser calls it directly. But you can make reuse from anywhere else difficult and easy to detect.

## How it works today

- **The browser calls the proxy directly.** fmp-app's `/defra-map/config` route (`fmp-app/server/routes/defra-map/map-config.js`) sends `fmpProxyUrl` to the page. ArcGIS then requests `/os-raster-tiles`, `/esri-service`, `/esri-tiles` and `/place-lookup` from the browser.
- **`fmpProxyUrl` defaults to `'proxy'`, a relative path** (`fmp-app/config/index.js`). So the proxy may already be meant to sit under fmp-app's own domain, behind the load balancer. Worth confirming how it's deployed.
- **fmp-proxy sets `cors: true`** in [server/createServer.js](./server/createServer.js), which lets any website call it.
- **Every route is `auth: false`.** Anyone who can reach the URL can use the OS and ESRI keys.
- **fmp-app has no session cookie**, only the cookie-policy cookie, so there's nothing existing the proxy could check.
- **Most proxy traffic is ArcGIS map-tile requests.** The ArcGIS library builds those URLs itself, so any token has to be added through `esriConfig.request.interceptors` (as a header or query parameter) rather than by changing each call.

## Options, from weakest to strongest

### 1. Limit CORS to fmp-app's own address

- Replace `cors: true` with `cors: { origin: config.allowedOrigins }`, a new setting in the Joi config ([server/config/index.js](./server/config/index.js)).
- This only stops other websites' scripts from reading responses. Plain image tile loads and curl still work.
- Low effort, but it isn't real protection.

### 2. Check the `Origin` and `Referer` headers

- Add a hapi `onRequest` hook that rejects requests whose `Origin` or `Referer` isn't an allowed fmp-app address. Exempt `/health-check`.
- This stops casual hotlinking from other websites, but curl can fake the headers.
- Low effort.

### 3. Short-lived signed token from fmp-app (recommended)

- fmp-app and the proxy share a secret, held in config on both sides.
- When fmp-app serves a page or `/defra-map/config`, it issues a token signed with that secret (HMAC or JWT), holding an expiry (for example 15–30 minutes) and the allowed origin.
- The client adds the token to every proxy request through an ArcGIS request interceptor (header preferred, query parameter as a fallback). It refreshes the token before it expires.
- The proxy checks the signature and expiry in an `onRequest` hook (or a hapi auth scheme, removing `auth: false`) and returns 401 otherwise.
- **Benefit:** someone has to load an fmp-app page to get a token, and it soon expires, so copying the proxy URL into another site or script stops working.
- **Downside:** a determined attacker can still script fetching tokens from fmp-app, so add rate limiting to fmp-app's token endpoint.

### 4. Network and hosting restrictions

- Put the proxy under fmp-app's own domain (`fmpProxyUrl='proxy'` suggests this was intended), or make it internal-only, reachable only through fmp-app's load balancer.
- This removes the separately exposed public address and makes any CORS question go away.
- It doesn't stop scripting through the fmp-app domain, so combine it with option 3.

### 5. Defence in depth (do alongside any of the above)

- **Rate limiting** per IP in the proxy, or at the load balancer or WAF.
- **Restrictions on the providers' side:**
  - Limit the OS API key to approved referrers.
  - Limit the ESRI service ID's scope.
  - Set usage alerts on both.
- **Narrow the routes:** allow only the specific paths and parameters each route needs, so the proxy can't be used to reach other OS or ESRI services.
- **Logging:** record rejected requests so you can see misuse.

## Suggested order

1. Option 1 and option 2: quick, and they block casual misuse from other websites.
2. Option 3: the real control.
   - Proxy changes: a config secret, a verification hook and specs.
   - fmp-app changes: issuing tokens and the client interceptor.
3. Options 4 and 5, tied to how it's deployed.

The first decision is whether the proxy will live under fmp-app's domain (option 4) or on its own hostname. That determines whether CORS matters and how the token in option 3 gets sent.
