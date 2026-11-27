import { keycloak } from './keycloak'
import { identityApiUrl, profileSchema, type IdentityProfile } from './profile'

export type AuthStatus =
  'loading' | 'authenticated' | 'denied' | 'expired' | 'error' | 'redirecting'
export interface AuthUser {
  subject: string
  name: string
  username: string
  email?: string
  givenName?: string
  familyName?: string
  emailVerified: boolean
  roles: string[]
  id?: string
  phoneNumber?: string | null
  phoneVerifiedAt?: string | null
  accountStatus?: string
  photoUrl?: string | null
}
export interface AuthSession {
  issuer?: string
  audience: string[]
  authorizedParty?: string
  sessionId?: string
  tokenId?: string
  tokenType?: string
  issuedAt?: number
  expiresAt?: number
  authenticatedAt?: number
  authenticationContext?: string
  scopes: string[]
  allowedOrigins: string[]
}
export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  session: AuthSession | null
  profileStatus: 'idle' | 'loading' | 'ready' | 'error'
}

let state: AuthState = {
  status: 'loading',
  user: null,
  session: null,
  profileStatus: 'idle',
}
let profile: IdentityProfile | null = null
let profileRequest: AbortController | undefined
let profilePromise: Promise<void> | undefined
const listeners = new Set<() => void>()
let initialization: Promise<boolean> | undefined
let refreshTimer: ReturnType<typeof setInterval> | undefined
let refreshing: Promise<void> | undefined

export function getAuthenticationState() {
  return state
}
export function subscribeAuthentication(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
function publish(status: AuthStatus) {
  const claims = keycloak.tokenParsed
  const visible = claims && ['authenticated', 'denied'].includes(status)
  if (status !== 'authenticated') {
    profile = null
    profileRequest?.abort()
  }
  const strings = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : []
  const text = (value: unknown) =>
    typeof value === 'string' ? value : undefined
  const timestamp = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined
  state = {
    status,
    profileStatus: status === 'authenticated' ? state.profileStatus : 'idle',
    user: visible
      ? {
          subject: text(claims.sub) || '',
          name:
            text(claims.name) ||
            [text(claims.given_name), text(claims.family_name)]
              .filter(Boolean)
              .join(' ') ||
            text(claims.preferred_username) ||
            'Administrator',
          username: text(claims.preferred_username) || '',
          email: text(claims.email),
          givenName: text(claims.given_name),
          familyName: text(claims.family_name),
          emailVerified: claims.email_verified === true,
          roles: strings(claims.realm_access?.roles),
          ...(profile
            ? {
                id: profile.id,
                name:
                  [profile.first_name, profile.last_name]
                    .filter(Boolean)
                    .join(' ') ||
                  text(claims.preferred_username) ||
                  'Administrator',
                givenName: profile.first_name || undefined,
                familyName: profile.last_name || undefined,
                email: profile.email || undefined,
                phoneNumber: profile.phone_number,
                phoneVerifiedAt: profile.phone_verified_at,
                accountStatus: profile.status,
                photoUrl: profile.profile_photo_url,
              }
            : {}),
        }
      : null,
    session: visible
      ? {
          issuer: text(claims.iss),
          audience:
            typeof claims.aud === 'string' ? [claims.aud] : strings(claims.aud),
          authorizedParty: text(claims.azp),
          sessionId: text(claims.sid) || text(claims.session_state),
          tokenId: text(claims.jti),
          tokenType: text(claims.typ),
          issuedAt: timestamp(claims.iat),
          expiresAt: timestamp(claims.exp),
          authenticatedAt: timestamp(claims.auth_time),
          authenticationContext: text(claims.acr),
          scopes: (text(claims.scope) || '').split(/\s+/).filter(Boolean),
          allowedOrigins: strings(claims['allowed-origins']),
        }
      : null,
  }
  listeners.forEach((listener) => listener())
}
function stopRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = undefined
}
function applyAuthorization() {
  if (!keycloak.authenticated || !keycloak.token) {
    publish('expired')
    stopRefresh()
    return false
  }
  const roles = keycloak.tokenParsed?.realm_access?.roles ?? []
  const allowed = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
  publish(allowed ? 'authenticated' : 'denied')
  if (!allowed) stopRefresh()
  return allowed
}
async function expireSession() {
  stopRefresh()
  publish('expired')
  await keycloak.clearToken()
}
async function refreshSession() {
  if (state.status !== 'authenticated') return
  // Share an in-flight refresh between the timer, focus events and API callers.
  refreshing ??= (async () => {
    try {
      await keycloak.updateToken(30)
      // A logout may have started while the network request was in flight.
      if (state.status === 'authenticated') applyAuthorization()
    } catch {
      if (state.status === 'authenticated') await expireSession()
    }
  })().finally(() => {
    refreshing = undefined
  })
  await refreshing
}

/** Called once before React mounts; also safe to call repeatedly. */
export function initializeAuthentication(): Promise<boolean> {
  initialization ??= (async () => {
    keycloak.onTokenExpired = () => {
      void refreshSession()
    }
    keycloak.onAuthRefreshSuccess = () => {
      if (state.status === 'authenticated') applyAuthorization()
    }
    keycloak.onAuthLogout = () => {
      stopRefresh()
      publish('expired')
    }
    try {
      const authenticated = await keycloak.init({
        onLoad: 'login-required',
        flow: 'standard',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        scope: 'openid profile email',
      })
      if (!authenticated) {
        publish('expired')
        return false
      }
      // After initial login, show our locked session-expired screen on failure
      // instead of the adapter automatically starting a second redirect.
      keycloak.loginRequired = false
      const allowed = applyAuthorization()
      if (allowed) {
        refreshTimer = setInterval(() => {
          void refreshSession()
        }, 10_000)
        window.addEventListener('focus', () => {
          void refreshSession()
        })
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void refreshSession()
        })
      }
      return allowed
    } catch {
      stopRefresh()
      publish('error')
      return false
    }
  })()
  return initialization
}

export async function login() {
  publish('redirecting')
  try {
    await keycloak.login()
  } catch {
    publish('error')
  }
}

export async function logout() {
  stopRefresh()
  publish('redirecting')
  try {
    await keycloak.logout({ redirectUri: window.location.origin })
  } catch {
    await keycloak.clearToken()
    publish('error')
  }
}

/** Refresh and recheck ADMIN or SUPER_ADMIN before a future authenticated API request.
 * Returns the current in-memory token; does not make an application API call.
 */
export async function getAccessToken(): Promise<string> {
  await initializeAuthentication()
  if (state.status !== 'authenticated')
    throw new Error('Administrator authentication required')
  await refreshSession()
  if (
    state.status !== 'authenticated' ||
    !keycloak.authenticated ||
    !keycloak.token
  ) {
    throw new Error('Administrator session is no longer valid')
  }
  return keycloak.token
}

/** Load the signed-in user's Identity Service profile using a fresh token. */
export function loadCurrentUser(): Promise<void> {
  if (profilePromise) return profilePromise
  const controller = new AbortController()
  profileRequest = controller
  state = { ...state, profileStatus: 'loading' }
  listeners.forEach((listener) => listener())
  profilePromise = (async () => {
    try {
      const token = await getAccessToken()
      const subject = keycloak.tokenParsed?.sub
      const response = await fetch(`${identityApiUrl}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
      })
      if (controller.signal.aborted || state.status !== 'authenticated') return
      if (response.status === 401) {
        await expireSession()
        return
      }
      if (response.status === 403) {
        publish('denied')
        stopRefresh()
        return
      }
      if (!response.ok) throw new Error('Profile request failed')
      const result = profileSchema.parse(await response.json())
      if (controller.signal.aborted || state.status !== 'authenticated') return
      if (result.keycloak_user_id !== subject)
        throw new Error('Profile identity mismatch')
      if (result.status !== 'ACTIVE') {
        publish('denied')
        stopRefresh()
        return
      }
      profile = result
      state = { ...state, profileStatus: 'ready' }
      publish('authenticated')
    } catch {
      if (controller.signal.aborted || state.status !== 'authenticated') return
      state = { ...state, profileStatus: 'error' }
      listeners.forEach((listener) => listener())
    } finally {
      if (profileRequest === controller) profileRequest = undefined
      profilePromise = undefined
    }
  })()
  return profilePromise
}
