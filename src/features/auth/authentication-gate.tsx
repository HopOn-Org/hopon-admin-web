import { useSyncExternalStore, type ReactNode } from 'react'
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
} from '../../lib/keycloak/authentication'
import { Button } from '../../components/ui/button'

export function useAuthentication() {
  return useSyncExternalStore(subscribeAuthentication, getAuthenticationState)
}

export function AuthenticationGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuthentication()
  if (status === 'authenticated') return children
  const busy = status === 'loading' || status === 'redirecting'
  const denied = status === 'denied'
  const failed = status === 'error'
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        aria-live="polite"
      >
        <p className="mb-7 text-xl font-extrabold tracking-tight text-emerald-800">
          hopon<span className="text-emerald-600">.</span>{' '}
          <span className="ml-2 text-xs font-semibold tracking-widest text-slate-400">
            ADMIN
          </span>
        </p>
        <div
          className={`mb-5 inline-flex rounded-xl p-3 ${denied || failed ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
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
            ? `${user?.name || 'Your account'} does not have the ADMIN realm role required to access this workspace. Contact your Keycloak administrator or sign out to use a different account.`
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
