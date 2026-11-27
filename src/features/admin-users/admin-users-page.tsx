import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { useAuthentication } from '../auth/authentication-gate'
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ExportButton,
  PageHeading,
  SearchInput,
} from '../../components/shared/common'
import { Button } from '../../components/ui/button'
import { getAdminUsers } from './api'

export function AdminUsersPage() {
  const { user } = useAuthentication()
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const query = useQuery({
    queryKey: ['admin-users', user?.subject, limit, offset],
    queryFn: ({ signal }) => getAdminUsers(limit, offset, signal),
    retry: false,
    staleTime: 30_000,
  })
  const rows = query.data ?? []
  const filtered = rows.filter((row) =>
    [
      row.username,
      row.first_name,
      row.last_name,
      row.email,
      row.keycloak_user_id,
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  const page = Math.floor(offset / limit) + 1
  return (
    <>
      <PageHeading
        title="Manage admin users"
        description="View administrator accounts from the Identity Service."
        actions={
          <>
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RefreshCw
                size={15}
                className={query.isFetching ? 'animate-spin' : ''}
              />
              Refresh
            </Button>
            <ExportButton
              label="Export page"
              filename={`hopon-admin-users-page-${page}.csv`}
              rows={filtered.map((row) => ({
                Username: row.username,
                'First name': row.first_name,
                'Last name': row.last_name,
                Email: row.email,
                Status: row.status,
                'Keycloak user ID': row.keycloak_user_id,
              }))}
            />
          </>
        }
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search this page..."
          />
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Rows per page
            <select
              className="select"
              aria-label="Admin users per page"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value))
                setOffset(0)
                setSearch('')
              }}
            >
              {[10, 25, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        {query.isPending ? (
          <div
            role="status"
            className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500"
          >
            <RefreshCw size={20} className="animate-spin text-brand-600" />
            Loading admin users...
          </div>
        ) : query.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center px-6 py-16 text-center"
          >
            <AlertCircle size={28} className="mb-4 text-red-600" />
            <h2 className="font-semibold">Unable to load admin users</h2>
            <p className="mt-2 mb-5 text-sm text-slate-500">
              {query.error instanceof Error
                ? query.error.message
                : 'Please try again.'}
            </p>
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table" aria-label="Admin users">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Keycloak user ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => {
                    const name =
                      [row.first_name, row.last_name]
                        .filter(Boolean)
                        .join(' ') || row.username
                    const status =
                      row.status === 'ACTIVE'
                        ? 'Active'
                        : row.status === 'SUSPENDED'
                          ? 'Suspended'
                          : row.status
                    return (
                      <tr key={row.keycloak_user_id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={name} index={index} />
                            <div>
                              <p className="font-medium">{name}</p>
                              {row.keycloak_user_id === user?.subject && (
                                <p className="mt-1 text-xs text-brand-600">
                                  Your account
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{row.username || 'Not provided'}</td>
                        <td>{row.email || 'Not provided'}</td>
                        <td>
                          <Badge>{status}</Badge>
                        </td>
                        <td className="font-mono text-xs text-slate-500">
                          {row.keycloak_user_id}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!filtered.length && (
              <EmptyState
                title={
                  search ? 'No matches on this page' : 'No admin users found'
                }
                description={
                  search
                    ? 'Try another name, username, email, or ID. Search applies to the current page only.'
                    : offset
                      ? 'There are no more admin accounts on this page. Return to the previous page.'
                      : 'No administrator accounts were returned by the Identity Service.'
                }
              />
            )}
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">
            {query.isPending || query.isError
              ? `Page ${page}`
              : rows.length
                ? `${search ? `${filtered.length} matching · ` : ''}Records ${offset + 1}–${offset + rows.length} · Page ${page}`
                : `Page ${page} · No records`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0 || query.isFetching}
              onClick={() => {
                setOffset((value) => Math.max(0, value - limit))
                setSearch('')
              }}
            >
              <ChevronLeft size={14} />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                query.isFetching || query.isError || rows.length < limit
              }
              onClick={() => {
                setOffset((value) => value + limit)
                setSearch('')
              }}
            >
              Next
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck size={14} />
        Live account list · Account changes are not available from this screen.
      </p>
    </>
  )
}
