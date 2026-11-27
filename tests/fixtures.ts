import { test as base } from '@playwright/test'
import { mockKeycloak } from './keycloak-mock'

export const test = base.extend<{ authenticated: void }>({
  authenticated: [
    async ({ page }, use) => {
      await mockKeycloak(page)
      await use()
    },
    { auto: true },
  ],
})
export { expect } from '@playwright/test'
