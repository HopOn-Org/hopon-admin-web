import { test, expect } from './fixtures'
import { authOrigin } from './keycloak-mock'

test('all pages and detail routes render without runtime errors', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const routes = [
    ['/dashboard', 'Good afternoon'],
    ['/passengers', 'Passengers'],
    ['/passengers/PS-2041', 'Passenger profile'],
    ['/drivers', 'Drivers'],
    ['/drivers/DR-1042', 'Driver profile'],
    ['/vehicles', 'Vehicles'],
    ['/live-map', 'Live operations'],
    ['/rides', 'Rides'],
    ['/rides/HP-8824', 'Ride HP-8824'],
    ['/payments', 'Payments'],
    ['/reports', 'Reports & analytics'],
    ['/audit-logs', 'Audit logs'],
    ['/notifications', 'Notifications'],
    ['/settings', 'Settings'],
  ]
  for (const [route, title] of routes) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(title)
    await expect(
      page.getByText('Something went wrong', { exact: true }),
    ).toHaveCount(0)
  }
  expect(errors).toEqual([])
})

test('passenger search, pagination, confirmation and audit persistence', async ({
  page,
}) => {
  await page.goto('/passengers')
  await page.getByRole('button', { name: 'Next page', exact: true }).click()
  await expect(page.getByText('Page 2 of 3')).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Search passengers, phone, or ID...' })
    .fill('Anjali')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await page
    .getByRole('link', { name: 'View Anjali Silva', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Suspend account', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('button', { name: 'Suspend account', exact: true }),
  ).toBeDisabled()
  await dialog
    .getByRole('textbox')
    .fill('Demo review of repeated account misuse.')
  await dialog
    .getByRole('button', { name: 'Suspend account', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Reactivate account' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Reactivate account' }),
  ).toBeVisible()
  await page.goto('/audit-logs')
  await expect(page.locator('tbody tr').first()).toContainText('Anjali Silva')
  await page
    .getByRole('button', { name: 'View audit entry: Account suspended' })
    .first()
    .click()
  await expect(page.getByRole('dialog')).toContainText(
    'Demo review of repeated account misuse.',
  )
})

test('driver approval requires reviewing every document and records a decision', async ({
  page,
}) => {
  await page.goto('/drivers/DR-1042')
  const approve = page.getByRole('button', {
    name: 'Approve driver',
    exact: true,
  })
  await expect(approve).toBeDisabled()
  for (let index = 0; index < 4; index++) {
    await page
      .getByRole('button', { name: 'Review', exact: true })
      .nth(index)
      .click()
    await expect(page.getByRole('dialog')).toContainText('SAMPLE ONLY')
    await page.getByRole('button', { name: 'Mark as reviewed' }).click()
  }
  await expect(approve).toBeEnabled()
  await approve.click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Approve driver', exact: true })
    .click()
  await expect(page.getByText('Approved', { exact: true })).toBeVisible()
  await page.goto('/drivers?status=Pending')
  await expect(page.locator('tbody')).not.toContainText('Nimal Fernando')
  await page.goto('/audit-logs')
  await expect(page.locator('tbody tr').first()).toContainText(
    'Driver approved',
  )
  await expect(page.locator('tbody tr').first()).toContainText('Nimal Fernando')
})

test('map filters, transaction details and CSV exports work locally', async ({
  page,
}) => {
  const remoteRequests: string[] = []
  page.on('request', (request) => {
    if (
      !request.url().startsWith('http://localhost:5173') &&
      !request.url().startsWith(authOrigin) &&
      !request.url().startsWith('data:')
    )
      remoteRequests.push(request.url())
  })
  await page.goto('/live-map')
  await expect(page.locator('.map-marker')).toHaveCount(10)
  await page
    .getByRole('combobox', { name: 'Map availability' })
    .selectOption('Available')
  await expect(page.locator('.map-marker')).toHaveCount(6)
  await page.locator('.map-marker').first().click()
  await expect(
    page.getByRole('link', { name: 'View profile', exact: true }),
  ).toBeVisible()
  await page.goto('/payments')
  await page
    .getByRole('combobox', { name: 'Payment method', exact: true })
    .selectOption('Card')
  await page
    .getByRole('combobox', { name: 'Payment status', exact: true })
    .selectOption('Paid')
  await page.getByRole('button', { name: 'View transaction TX-8820' }).click()
  await expect(page.getByRole('dialog')).toContainText('Visa ending 4242')
  await page.getByRole('button', { name: 'Close dialog' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('hopon-transactions.csv')
  expect(remoteRequests).toEqual([])
})

test('settings show Keycloak identity and save only local preferences', async ({
  page,
}) => {
  await page.goto('/settings')
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue(
    'Alex Morgan',
  )
  await expect(
    page.getByRole('textbox', { name: 'Full name' }),
  ).toHaveAttribute('readonly', '')
  await expect(
    page.getByRole('textbox', { name: 'Email address' }),
  ).toHaveValue('alex@example.com')
  await page.getByRole('combobox', { name: 'Time zone' }).selectOption('UTC')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Time zone' })).toHaveValue(
    'UTC',
  )
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset demo data' })
    .click()
  await expect(page.getByRole('combobox', { name: 'Time zone' })).toHaveValue(
    'Asia/Colombo',
  )
  await expect(page.getByRole('textbox', { name: 'Full name' })).toHaveValue(
    'Alex Morgan',
  )
})
test('mobile navigation and all pages stay within the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Passengers' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Passengers', exact: true }),
  ).toBeVisible()
  for (const route of [
    '/dashboard',
    '/passengers',
    '/drivers/DR-1042',
    '/live-map',
    '/reports',
    '/settings',
  ]) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(overflow, `${route} should not overflow horizontally`).toBe(false)
  }
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true })
})
