import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import {
  LoaderCircle,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import {
  getAuthenticationState,
  subscribeAuthentication,
  login,
  logout,
  loadCurrentUser,
} from '../../lib/keycloak/authentication'
import { Button } from '../../components/ui/button'

export function useAuthentication() {
  return useSyncExternalStore(subscribeAuthentication, getAuthenticationState)
}

export function AuthenticationGate({ children }: { children: ReactNode }) {
  const { status, user, profileStatus } = useAuthentication()
  useEffect(() => {
    if (status === 'authenticated' && profileStatus === 'idle')
      void loadCurrentUser()
  }, [status, profileStatus])
  if (status === 'authenticated' && profileStatus === 'ready') return children
  if (status === 'authenticated')
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <section
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          aria-live="polite"
        >
          <h1 className="text-2xl font-semibold">
            {profileStatus === 'error'
              ? 'Unable to load your profile'
              : 'Loading your profile'}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {profileStatus === 'error'
              ? 'The Identity Service could not provide your administrator profile. Try again.'
              : 'Retrieving your account details from the Identity Service.'}
          </p>
          {profileStatus === 'error' && (
            <div className="mt-6 flex gap-3">
              <Button onClick={() => void loadCurrentUser()}>
                Retry profile
              </Button>
              <Button variant="outline" onClick={() => void logout()}>
                Sign out
              </Button>
            </div>
          )}
        </section>
      </main>
    )
  const busy = status === 'loading' || status === 'redirecting'
  const denied = status === 'denied'
  const failed = status === 'error'
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        aria-live="polite"
      >
        <div className="mb-7 flex items-center gap-2">
          <img src="/logo.png" alt="HopOn" className="size-24 object-contain" />
          <span className="ml-2 text-xs font-semibold tracking-widest text-slate-400">
            ADMIN
          </span>
        </div>
        <div
          className={`mb-5 inline-flex rounded-xl p-3 ${denied || failed ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}
        >
          {busy ? (
            <LoaderCircle className="animate-spin" size={25} />
          ) : denied || failed ? (
            <ShieldAlert size={25} />
          ) : (
            <ShieldCheck size={25} />
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {denied
            ? 'Access denied'
            : failed
              ? 'Unable to connect to sign-in'
              : status === 'expired'
                ? 'Your session has ended'
                : status === 'redirecting'
                  ? 'Redirecting to Keycloak'
                  : 'Checking your session'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {denied
            ? `${user?.name || 'Your account'} is not permitted to access this workspace. An active account and an ADMIN or SUPER_ADMIN realm role are required. Contact your administrator or sign out to use a different account.`
            : failed
              ? 'Authentication could not be completed. Check your connection and the Keycloak client configuration, then try again.'
              : status === 'expired'
                ? 'Sign in again to continue. The workspace remains locked until your administrator session is verified.'
                : 'Please wait while we securely connect you to the HopOn administrator workspace.'}
        </p>
        {!busy && (
          <div className="mt-7 flex flex-wrap gap-3">
            {denied ? (
              <Button onClick={() => void logout()}>
                <LogOut size={16} />
                Sign out
              </Button>
            ) : failed ? (
              <Button onClick={() => window.location.reload()}>
                <RefreshCw size={16} />
                Retry sign-in
              </Button>
            ) : (
              <Button onClick={() => void login()}>
                <LogIn size={16} />
                Sign in again
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
