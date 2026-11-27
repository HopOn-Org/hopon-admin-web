import type { Page } from '@playwright/test'

export const authOrigin = 'https://hopon-auth.duckdns.org'
const issuer = `${authOrigin}/realms/hopon`

// Test-only responses: the real adapter and PKCE flow still run in the browser.
export async function mockKeycloak(
  page: Page,
  options: {
    roles?: string[]
    expiresIn?: number
    failRefresh?: boolean
    refreshedRoles?: string[]
    holdLogin?: boolean
    claims?: Record<string, unknown>
    refreshedClaims?: Record<string, unknown>
  } = {},
) {
  let nonce = ''
  const requests = {
    logins: [] as URL[],
    refreshes: 0,
    logouts: [] as URL[],
    verifiers: [] as string[],
  }
  const jwt = (claims: Record<string, unknown>) =>
    `${Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.test-signature`
  const headers = {
    'access-control-allow-origin': 'http://localhost:5173',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type',
  }
  await page.route(`${authOrigin}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers })
      return
    }
    if (url.pathname.endsWith('/auth')) {
      requests.logins.push(url)
      nonce = url.searchParams.get('nonce') || ''
      if (options.holdLogin) {
        await route.fulfill({
          contentType: 'text/html',
          body: '<h1>Keycloak hosted login</h1>',
        })
        return
      }
      const redirect = new URL(url.searchParams.get('redirect_uri')!)
      redirect.hash = new URLSearchParams({
        code: 'test-code',
        state: url.searchParams.get('state')!,
        session_state: 'test-session',
        iss: issuer,
      }).toString()
      await route.fulfill({ status: 302, headers: { location: redirect.href } })
    } else if (url.pathname.endsWith('/token')) {
      const body = new URLSearchParams(request.postData() || '')
      const refresh = body.get('grant_type') === 'refresh_token'
      if (refresh) requests.refreshes++
      else requests.verifiers.push(body.get('code_verifier') || '')
      if (refresh && options.failRefresh) {
        await route.fulfill({
          status: 400,
          headers,
          json: { error: 'invalid_grant' },
        })
        return
      }
      const now = Math.floor(Date.now() / 1000)
      const claims = {
        iss: issuer,
        sub: 'test-admin-subject',
        aud: 'hopon-identity-api',
        azp: 'hopon-admin-web',
        iat: now,
        exp: now + (refresh ? 300 : (options.expiresIn ?? 300)),
        name: 'Alex Morgan',
        preferred_username: 'alex.admin',
        email: 'alex@example.com',
        session_state: 'test-session',
        given_name: 'Alex',
        family_name: 'Morgan',
        email_verified: false,
        auth_time: now - 2,
        sid: 'test-session',
        jti: 'test-token-id',
        typ: 'Bearer',
        acr: '1',
        scope: 'openid profile email',
        'allowed-origins': ['https://hopon-admin-web.vercel.app'],
        realm_access: {
          roles: refresh
            ? (options.refreshedRoles ?? options.roles ?? ['ADMIN'])
            : (options.roles ?? ['ADMIN']),
        },
        ...options.claims,
        ...(refresh ? options.refreshedClaims : {}),
      }
      await route.fulfill({
        headers,
        json: {
          access_token: jwt(claims),
          refresh_token: jwt({ ...claims, exp: now + 1800 }),
          id_token: jwt({ ...claims, nonce }),
          token_type: 'Bearer',
          expires_in: refresh ? 300 : (options.expiresIn ?? 300),
          refresh_expires_in: 1800,
        },
      })
    } else if (url.pathname.endsWith('/logout')) {
      requests.logouts.push(url)
      await route.fulfill({
        contentType: 'text/html',
        body: '<h1>Keycloak signed out</h1>',
      })
    } else await route.abort()
  })
  return requests
}
