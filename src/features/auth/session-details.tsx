import { useAuthentication } from './authentication-gate'
import { DetailItem, Badge } from '../../components/shared/common'

export function SessionDetails() {
  const { user, session } = useAuthentication()
  if (!user || !session) return null
  const time = (value?: number) =>
    value === undefined
      ? 'Not provided'
      : new Date(value * 1000).toLocaleString('en-GB', {
          timeZone: 'Asia/Colombo',
        })
  const fields = [
    ['Subject', user.subject],
    ['Issuer', session.issuer],
    ['Audience', session.audience.join(', ')],
    ['Client', session.authorizedParty],
    ['Session ID', session.sessionId],
    ['Token ID', session.tokenId],
    ['Token type', session.tokenType],
    ['Issued at (Asia/Colombo)', time(session.issuedAt)],
    ['Expires at (Asia/Colombo)', time(session.expiresAt)],
    ['Signed in at (Asia/Colombo)', time(session.authenticatedAt)],
    ['Authentication context', session.authenticationContext],
    ['Scopes', session.scopes.join(', ')],
    ['Allowed origins', session.allowedOrigins.join(', ')],
  ]
  return (
    <details className="mt-4 border-t border-slate-100 pt-4">
      <summary className="cursor-pointer text-sm font-medium text-emerald-700">
        Session details
      </summary>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Decoded access-token claims for this session. Times use Asia/Colombo.
      </p>
      <dl className="mt-2 break-all">
        {fields.map(([label, value]) => (
          <DetailItem key={label} label={label || ''}>
            {value || 'Not provided'}
          </DetailItem>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        {user.roles.map((role) => (
          <Badge key={role}>{role}</Badge>
        ))}
      </div>
    </details>
  )
}
