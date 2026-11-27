import { z } from 'zod'

export const profileSchema = z.object({
  id: z.string().min(1),
  keycloak_user_id: z.string().min(1),
  phone_number: z.string().nullable(),
  phone_verified_at: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  status: z.string().min(1),
  profile_photo_url: z.string().nullable(),
})
export type IdentityProfile = z.infer<typeof profileSchema>
export const identityApiUrl = (
  import.meta.env.VITE_IDENTITY_API_URL || '/identity-api'
).replace(/\/$/, '')
