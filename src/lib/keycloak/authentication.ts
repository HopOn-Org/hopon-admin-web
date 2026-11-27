import { keycloak } from './keycloak'

export type AuthStatus =
  'loading' | 'authenticated' | 'denied' | 'expired' | 'error' | 'redirecting'
export interface AuthUser {
  subject: string
  name: string
  username: string
  email?: string
}
export interface AuthState {
  status: AuthStatus
  user: AuthUser | null
}

let state: AuthState = { status: 'loading', user: null }
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
  state = {
    status,
    user:
      claims && ['authenticated', 'denied'].includes(status)
        ? {
            subject: claims.sub || '',
            name: claims.name || claims.preferred_username || 'Administrator',
            username: claims.preferred_username || '',
            email: claims.email,
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
  const allowed = (keycloak.tokenParsed?.realm_access?.roles ?? []).includes(
    'ADMIN',
  )
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

/** Refresh and recheck ADMIN before a future authenticated API request.
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
