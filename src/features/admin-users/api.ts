import { z } from 'zod'
import {
  expireSession,
  getAccessToken,
} from '../../lib/keycloak/authentication'
import { identityApiUrl } from '../../lib/keycloak/profile'

const adminUserSchema = z.object({
  keycloak_user_id: z.string().min(1),
  username: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  status: z.string(),
})
export type AdminUser = z.infer<typeof adminUserSchema>

export async function getAdminUsers(
  limit: number,
  offset: number,
  signal: AbortSignal,
): Promise<AdminUser[]> {
  const token = await getAccessToken()
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  })
  const response = await fetch(
    `${identityApiUrl}/api/v1/admin/users?${params}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal,
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
    },
  )
  if (response.status === 401) {
    await expireSession()
    throw new Error('Your session has ended. Sign in again to continue.')
  }
  if (response.status === 403)
    throw new Error('You do not have permission to view admin users.')
  if (!response.ok)
    throw new Error('Admin users could not be loaded. Please try again.')
  const result = z.array(adminUserSchema).safeParse(await response.json())
  if (!result.success)
    throw new Error(
      'The Identity Service returned an unexpected admin users response.',
    )
  return result.data
}
