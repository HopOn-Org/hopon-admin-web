# Keycloak client setup

Server: https://hopon-auth.duckdns.org · Realm: `hopon` · Client: `hopon-admin-web`

Application URL: https://hopon-admin-web.vercel.app/. The settings below target this Vercel deployment. No Keycloak administrator credentials were available, and no server configuration, users, or MFA policies were changed. The deployed redirect URI has not been verified against the remote client settings.

## 1. Configure the public SPA client

Open the Keycloak Admin Console, select **hopon**, then **Clients → hopon-admin-web**. Update the existing client; do not delete/recreate it or change the mobile clients.

| Setting                                                      | Value                                  |
| ------------------------------------------------------------ | -------------------------------------- |
| Client type / protocol                                       | OpenID Connect                         |
| Client authentication                                        | **Off** (public SPA)                   |
| Authorization                                                | Off                                    |
| Standard flow                                                | **On**                                 |
| Direct access grants                                         | **Off**                                |
| Implicit flow                                                | **Off**                                |
| Service accounts                                             | Off                                    |
| Root URL / Home URL                                          | `https://hopon-admin-web.vercel.app/`  |
| Valid redirect URIs                                          | `https://hopon-admin-web.vercel.app/*` |
| Valid post logout redirect URIs                              | `https://hopon-admin-web.vercel.app`   |
| Web origins                                                  | `https://hopon-admin-web.vercel.app`   |
| Advanced → Proof Key for Code Exchange Code Challenge Method | **S256**                               |

Keep the default `roles`, `profile`, `email`, and `web-origins` client scopes assigned. The access token must include the **realm** role `ADMIN` or `SUPER_ADMIN` in `realm_access.roles`. Client roles named ADMIN or SUPER_ADMIN alone will not pass this app's check.

For a new client, [hopon-admin-web.client.json](./hopon-admin-web.client.json) is an importable configuration for the Vercel deployment. For an existing client, review/apply the settings above instead of attempting to import a duplicate client ID. No secrets are required or included.

Use https://hopon-admin-web.vercel.app/ to sign in. This client configuration allows the Vercel origin only. Local browser test origins are used with mocked authentication and are not part of the deployed client settings.

## 2. Administrator role and MFA

1. In **Realm roles**, create `ADMIN` and/or `SUPER_ADMIN` if needed.
2. Create or select your administrator user. In **Role mapping**, assign the realm role `ADMIN` or `SUPER_ADMIN` (directly or through your admin group).
3. Set the user's initial password through Keycloak's Credentials screen; do not put credentials in the frontend repository.
4. Assign the **Configure OTP** required action for that administrator. Verify that the realm's existing browser authentication flow supports OTP and that subsequent sign-ins enforce the intended MFA behavior. Do not change shared browser authentication flows without checking their effect on existing mobile clients.

The React app uses Keycloak's hosted login page. It does not create users, collect passwords/OTP codes, provision MFA, or use Keycloak's administrative APIs.

## 3. Build and verify the frontend

```sh
npm install
npm run build
```

In the Vercel project, use the Vite framework preset, build command `npm run build`, and output directory `dist`. Set the public `VITE_KEYCLOAK_*` values from `.env.example` in Vercel's environment settings and redeploy after changes. Never add a client secret. The application uses the current browser origin for its login callback and logout return URL, so the deployed app returns to this Vercel domain.

- Open https://hopon-admin-web.vercel.app: the app redirects to Keycloak using Authorization Code + PKCE S256.
- Sign in with an ADMIN or SUPER_ADMIN user: the requested app route opens after initialization succeeds.
- Sign in with a passenger/driver without either ADMIN or SUPER_ADMIN: only Access denied and Sign out are available.
- Sign out: the adapter ends the Keycloak session and returns to the app origin, where login is required again.
- With an expired/revoked refresh session, the app hides the workspace and asks the user to sign in again.

The adapter initializes once outside React effects. Access/refresh/ID tokens remain in adapter memory; they are never saved in application localStorage, sessionStorage, Zustand, or cookies. Keycloak may use transient callback storage for OAuth state, nonce, and PKCE verification. The sample business dataset remains in localStorage separately; the authenticated profile is fetched into memory.

The app checks for refresh every 10 seconds with `updateToken(30)`, on token expiry, and when the tab becomes active. The adapter only calls the token endpoint when a refresh is necessary. Refreshed roles are checked again. Because `checkLoginIframe` is disabled, remote logout/revocation is observed when a token refresh fails, rather than through iframe polling.

## 4. Identity Service APIs

`getAccessToken()` in `src/lib/keycloak/authentication.ts` refreshes the current session, checks ADMIN or SUPER_ADMIN again, and returns the current in-memory access token for a Bearer header. The app uses it for profile and admin-user requests; no Go endpoint was created.

Backend authorization remains a separate step: validate signature using JWKS, issuer, expiration, the intended API audience, and an allowed administrator role. Add a dedicated API audience mapper when the Go API's audience is defined. The SPA client ID alone does not establish that audience.

## Automated verification

`npm test` covers PKCE redirect parameters, callback/deep links, non-admin denial, logout, refresh success/failure, role removal, token storage, and existing UI workflows. Tests intercept the auth server at the browser network layer and run the real adapter; there is no production auth bypass. Passing these tests does not establish that the remote client or MFA is configured correctly. A real-user sign-in is still needed after correcting the server settings.

Reference: [Keycloak JavaScript adapter documentation](https://www.keycloak.org/securing-apps/javascript-adapter).

## Identity Service profile

After Keycloak grants ADMIN or SUPER_ADMIN access, the app calls `GET /api/v1/users/me` at `VITE_IDENTITY_API_URL` (default: `/identity-api`). The request calls `getAccessToken()` first, then sends `Authorization: Bearer <current token>` and `Accept: application/json`. It never uses a token copied into source code or environment files.

The response supplies the account ID, Keycloak subject, first/last name, email, phone, phone-verification timestamp, status, and profile photo. These details populate the header/sidebar, greeting, read-only Settings profile, and audit actor name. Username, realm roles, email-verification claim, and session metadata still come from Keycloak. Token refresh does not overwrite the API profile. The returned subject must match the signed-in subject and the account must be ACTIVE.

The workspace waits for the profile to load. Network/server errors and invalid responses show a retry screen; a 401 ends the local session, and a 403 or inactive account shows Access denied. Tokens and profile data remain in memory. Profile images use the supplied URL with an initials fallback. The rest of the fleet/business dataset remains local demo data.

Set `VITE_IDENTITY_API_URL` in Vercel and rebuild if you need to change the API host. The default uses same-origin Vercel rewrites to the existing Identity Service, so browser CORS is not needed. Admin user collection and item paths are both proxied, preserving methods such as GET, POST, and PUT. A direct API URL override requires service-side CORS. No backend endpoint was created or modified.

Session details and authorization use the adapter-decoded access-token claims. Issuer, audience, client, session/token IDs, token type, scopes, authentication context, allowed origins, and issue/expiry/authentication timestamps remain available in Settings. Epoch times display in Asia/Colombo; acr is displayed without inferring MFA enrollment.

### Current CORS verification

A credential-free preflight request to `/api/v1/users/me` with `Origin: https://hopon-admin-web.vercel.app`, method GET, and requested header Authorization returned HTTP 405 without Access-Control-Allow-Origin during implementation. Browser integration requires the service to handle OPTIONS and return appropriate CORS headers for that origin, GET, and Authorization (including on error responses). The included Vercel rewrite avoids this cross-origin browser request by proxying the profile endpoint and admin-user collection/item endpoints. Vite has the matching development proxy. Set `VITE_IDENTITY_API_URL=/identity-api` in Vercel and redeploy to enable it. No backend handler was added. The supplied example bearer token was not saved or used.
