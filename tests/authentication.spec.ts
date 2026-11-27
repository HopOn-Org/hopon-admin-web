import { test, expect } from '@playwright/test'
import { mockKeycloak, authOrigin } from './keycloak-mock'

const profileUrl = 'http://localhost:5173/identity-api/api/v1/users/me'

test('profile request uses the current Bearer token and displays API data instead of token profile', async ({
  page,
}) => {
  await mockKeycloak(page, {
    profile: {
      first_name: 'Identity',
      last_name: 'Administrator',
      email: 'identity@example.com',
      phone_number: '+94 77 1234567',
    },
  })
  const requestPromise = page.waitForRequest(
    (request) => request.url() === profileUrl && request.method() === 'GET',
  )
  await page.goto('/settings')
  const request = await requestPromise
  expect(request.headers().authorization).toMatch(/^Bearer .+\.test-signature$/)
  expect(request.headers().accept).toBe('application/json')
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue(
    'Identity Administrator',
  )
  await expect(
    page.getByRole('textbox', { name: 'Email address' }),
  ).toHaveValue('identity@example.com')
  await expect(page.getByText('+94 77 1234567', { exact: true })).toBeVisible()
})

test('profile failure shows retry without falling back to token identity', async ({
  page,
}) => {
  await mockKeycloak(page, { profileStatus: 503 })
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Unable to load your profile' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Retry profile' }),
  ).toBeVisible()
})

test('profile 401 expires the session and 403 denies access', async ({
  page,
}) => {
  await mockKeycloak(page, { profileStatus: 401 })
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Your session has ended' }),
  ).toBeVisible()
  await mockKeycloak(page, { profileStatus: 403 })
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Access denied' }),
  ).toBeVisible()
})

test('profile for a different Keycloak subject is rejected', async ({
  page,
}) => {
  await mockKeycloak(page, { profile: { keycloak_user_id: 'another-user' } })
  await page.goto('/dashboard')
  await expect(
    page.getByRole('heading', { name: 'Unable to load your profile' }),
  ).toBeVisible()
  await expect(page.getByRole('navigation')).toHaveCount(0)
})

test('SUPER_ADMIN alone can access the workspace and retain access after refresh', async ({
  page,
}) => {
  await page.clock.install()
  const requests = await mockKeycloak(page, {
    roles: ['SUPER_ADMIN'],
    expiresIn: 35,
  })
  await page.goto('/settings')
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.clock.fastForward(11_000)
  await expect.poll(() => requests.refreshes).toBe(1)
  await expect(page.getByRole('navigation')).toBeVisible()
})

test('changing ADMIN to SUPER_ADMIN during refresh retains access', async ({
  page,
}) => {
  await page.clock.install()
  await mockKeycloak(page, {
    roles: ['ADMIN'],
    expiresIn: 35,
    refreshedRoles: ['SUPER_ADMIN'],
  })
  await page.goto('/dashboard')
  await expect(page.getByRole('navigation')).toBeVisible()
  await page.clock.fastForward(11_000)
  await expect(page.getByRole('navigation')).toBeVisible()
  await expect
    .poll(async () =>
      page.getByRole('heading', { name: 'Access denied' }).count(),
    )
    .toBe(0)
})

test('uses Identity Service profile and keeps token session claims updated after refresh', async ({
  page,
}) => {
  await page.clock.install()
  await mockKeycloak(page, {
    expiresIn: 35,
    profile: {
      first_name: 'Sample',
      last_name: 'Administrator',
      email: 'sample@example.com',
    },
    claims: {
      name: 'Sample Administrator',
      given_name: 'Sample',
      family_name: 'Administrator',
      preferred_username: 'sample.admin',
      email: 'sample@example.com',
    },
    refreshedClaims: {
      name: 'Updated Administrator',
      given_name: 'Updated',
      email_verified: true,
    },
  })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Good afternoon, Sample',
  )
  await page.goto('/settings')
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue(
    'Sample Administrator',
  )
  await expect(
    page.getByRole('textbox', { name: 'Email address' }),
  ).toHaveValue('sample@example.com')
  await expect(
    page.getByText('Email status: Unverified', { exact: true }),
  ).toBeVisible()
  await page.getByText('Session details', { exact: true }).click()
  await expect(
    page.getByRole('definition').filter({ hasText: 'hopon-identity-api' }),
  ).toBeVisible()
  await expect(page.getByText('test-token-id', { exact: true })).toBeVisible()
  await page.clock.fastForward(11_000)
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue(
    'Sample Administrator',
  )
  await expect(
    page.getByText('Email status: Verified', { exact: true }),
  ).toBeVisible()
  const storage = await page.evaluate(() =>
    JSON.stringify({ ...localStorage, ...sessionStorage }),
  )
  expect(storage).not.toContain('sample@example.com')
  expect(storage).not.toContain('test-token-id')
})

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
  const requests = await mockKeycloak(page, { expiresIn: 35 })
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
    expiresIn: 35,
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
  await mockKeycloak(page, { expiresIn: 35, refreshedRoles: ['PASSENGER'] })
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
