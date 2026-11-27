import { test, expect } from '@playwright/test'
import { mockKeycloak, authOrigin } from './keycloak-mock'

test('redirects to hosted login with public code flow and S256 PKCE', async ({
  page,
}) => {
  const requests = await mockKeycloak(page, { holdLogin: true })
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Keycloak hosted login' }),
  ).toBeVisible()
  const url = requests.logins[0]
  expect(url.searchParams.get('client_id')).toBe('hopon-admin-web')
  expect(url.searchParams.get('response_type')).toBe('code')
  expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  expect(url.searchParams.get('code_challenge')?.length).toBeGreaterThan(40)
  expect(url.searchParams.has('client_secret')).toBe(false)
})

test('ADMIN callback preserves deep links and tokens stay out of browser storage', async ({
  page,
}) => {
  const requests = await mockKeycloak(page)
  await page.goto('/drivers/DR-1042')
  await expect(
    page.getByRole('heading', { name: 'Driver profile' }),
  ).toBeVisible()
  expect(requests.logins).toHaveLength(1)
  expect(requests.verifiers[0].length).toBeGreaterThanOrEqual(43)
  await expect(page).toHaveURL(/\/drivers\/DR-1042$/)
  const storage = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  )
  expect(storage).not.toContain('test-signature')
  expect(storage).not.toMatch(/access_token|refresh_token|id_token/)
})

test('non-admin is denied even on deep links and can end the Keycloak session', async ({
  page,
}) => {
  const requests = await mockKeycloak(page, { roles: ['PASSENGER'] })
  await page.goto('/passengers/PS-2041')
  await expect(
    page.getByRole('heading', { name: 'Access denied' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(
    page.getByRole('heading', { name: 'Keycloak signed out' }),
  ).toBeVisible()
  expect(requests.logouts[0].searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:5173',
  )
})

test('refreshes a short-lived session before expiry', async ({ page }) => {
  await page.clock.install()
  const requests = await mockKeycloak(page, { expiresIn: 20 })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Good afternoon',
  )
  await page.clock.fastForward(11_000)
  await expect.poll(() => requests.refreshes).toBe(1)
  await expect(page.getByRole('navigation')).toBeVisible()
})

test('failed refresh locks the app and requires sign-in again', async ({
  page,
}) => {
  await page.clock.install()
  const requests = await mockKeycloak(page, {
    expiresIn: 20,
    failRefresh: true,
  })
  await page.goto('/dashboard')
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.clock.fastForward(11_000)
  await expect(
    page.getByRole('heading', { name: 'Your session has ended' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)
  await page.getByRole('button', { name: 'Sign in again' }).click()
  await expect.poll(() => requests.logins.length).toBe(2)
})

test('ADMIN role removal during refresh immediately hides protected screens', async ({
  page,
}) => {
  await page.clock.install()
  await mockKeycloak(page, { expiresIn: 20, refreshedRoles: ['PASSENGER'] })
  await page.goto('/dashboard')
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.clock.fastForward(11_000)
  await expect(
    page.getByRole('heading', { name: 'Access denied' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)
})

test('logout is available in the workspace and returns to the app origin', async ({
  page,
}) => {
  const requests = await mockKeycloak(page)
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Keycloak signed out' }),
  ).toBeVisible()
  expect(requests.logouts[0].searchParams.get('post_logout_redirect_uri')).toBe(
    'http://localhost:5173',
  )
})

test('invalid callback fails closed with a retry screen', async ({ page }) => {
  await mockKeycloak(page)
  await page.route(`${authOrigin}/**/token`, (route) =>
    route.fulfill({
      status: 400,
      headers: { 'access-control-allow-origin': 'http://localhost:5173' },
      json: { error: 'invalid_grant' },
    }),
  )
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Unable to connect to sign-in' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Retry sign-in' }),
  ).toBeVisible()
})
