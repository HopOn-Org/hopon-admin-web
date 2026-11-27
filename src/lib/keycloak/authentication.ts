import { keycloak } from './keycloak'

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
}

let state: AuthState = { status: 'loading', user: null, session: null }
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
