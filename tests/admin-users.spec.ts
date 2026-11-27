import { test, expect } from './fixtures'

const url = '**/identity-api/api/v1/admin/users*'
const user = {
  keycloak_user_id: 'admin-user-1',
  username: 'admin.one',
  first_name: 'Admin',
  last_name: 'One',
  email: 'admin.one@example.com',
  status: 'ACTIVE',
}

test('sidebar opens live admin list with Bearer authentication and server pagination', async ({
  page,
}) => {
  const requests: {
    limit: string | null
    offset: string | null
    authorization?: string
  }[] = []
  await page.route(url, async (route) => {
    const params = new URL(route.request().url()).searchParams
    requests.push({
      limit: params.get('limit'),
      offset: params.get('offset'),
      authorization: route.request().headers().authorization,
    })
    const rows =
      params.get('offset') === '0'
        ? Array.from({ length: 50 }, (_, index) => ({
            ...user,
            keycloak_user_id: `admin-${index}`,
            username: `admin.${index}`,
            first_name: `Administrator ${index}`,
          }))
        : [user]
    await route.fulfill({ json: rows })
  })
  await page.goto('/dashboard')
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Manage admin users', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Manage admin users', exact: true }),
  ).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(50)
  expect(requests[0]).toMatchObject({ limit: '50', offset: '0' })
  expect(requests[0].authorization).toMatch(/^Bearer .+\.test-signature$/)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  expect(requests.at(-1)?.offset).toBe('50')
  await expect(page.getByText('Records 51–51 · Page 2')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Next', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Previous', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(50)
  await page
    .getByRole('textbox', { name: 'Search this page...' })
    .fill('admin.49')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody')).toContainText('admin.49')
})

test('admin list handles empty responses and retries a failed request', async ({
  page,
}) => {
  let attempts = 0
  await page.route(url, (route) => {
    attempts++
    return attempts === 1
      ? route.fulfill({ status: 503, json: { error: 'unavailable' } })
      : route.fulfill({ json: [] })
  })
  await page.goto('/admin-users')
  await expect(page.getByRole('alert')).toContainText(
    'Admin users could not be loaded',
  )
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(
    page.getByRole('heading', { name: 'No admin users found', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Next', exact: true }),
  ).toBeDisabled()
})

test('admin list reports forbidden access without unlocking it or blocking other pages', async ({
  page,
}) => {
  await page.route(url, (route) =>
    route.fulfill({ status: 403, json: { error: 'forbidden' } }),
  )
  await page.goto('/admin-users')
  await expect(page.getByRole('alert')).toContainText(
    'You do not have permission to view admin users.',
  )
  await expect(page.getByRole('navigation')).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(0)
})

test('admin list rejects malformed data and expires a rejected session', async ({
  page,
}) => {
  await page.route(url, (route) => route.fulfill({ json: { users: [user] } }))
  await page.goto('/admin-users')
  await expect(page.getByRole('alert')).toContainText(
    'unexpected admin users response',
  )
  await page.route(url, (route) =>
    route.fulfill({ status: 401, json: { error: 'unauthorized' } }),
  )
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your session has ended' }),
  ).toBeVisible()
})
