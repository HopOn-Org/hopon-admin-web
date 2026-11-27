import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  Star,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Passenger } from '../../types'
import { useStore, useUI } from '../../lib/store'
import { formatDate, money } from '../../lib/utils'
import {
  Avatar,
  BackLink,
  Badge,
  Card,
  CardHeading,
  ConfirmAction,
  DetailItem,
  EmptyState,
  ExportButton,
  PageHeading,
  SearchInput,
} from '../../components/shared/common'
import { DataTable } from '../../components/shared/data-table'
import { Button } from '../../components/ui/button'

export function PassengersPage() {
  const passengers = useStore((s) => s.passengers)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [verified, setVerified] = useState('All')
  const filtered = passengers.filter(
    (p) =>
      `${p.name} ${p.id} ${p.phone} ${p.email}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'All' || p.status === status) &&
      (verified === 'All' || p.verified === (verified === 'Verified')),
  )
  const columns: ColumnDef<Passenger, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Passenger',
      cell: ({ row }) => (
        <Link
          to={`/passengers/${row.original.id}`}
          className="flex items-center gap-3"
        >
          <Avatar name={row.original.name} index={row.index} />
          <span className="font-medium hover:text-emerald-700">
            {row.original.name}
            <span className="mt-1 block text-sm font-normal text-slate-400">
              {row.original.id}
            </span>
          </span>
        </Link>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => (
        <div>
          {row.original.phone}
          <p className="mt-1 text-sm text-slate-400">{row.original.email}</p>
        </div>
      ),
    },
    { accessorKey: 'trips', header: 'Trips' },
    {
      accessorKey: 'status',
      header: 'Account status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      accessorKey: 'verified',
      header: 'Verification',
      cell: ({ row }) => (
        <Badge>{row.original.verified ? 'Verified' : 'Unverified'}</Badge>
      ),
    },
    {
      accessorKey: 'joined',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-slate-500">
          {formatDate(row.original.joined)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button asChild variant="ghost" size="icon">
          <Link
            to={`/passengers/${row.original.id}`}
            aria-label={`View ${row.original.name}`}
          >
            <ArrowUpRight size={16} />
          </Link>
        </Button>
      ),
    },
  ]
  return (
    <>
      <PageHeading
        title="Passengers"
        description="The people behind every journey. Manage your passenger community."
        actions={
          <ExportButton
            filename="hopon-passengers.csv"
            rows={filtered.map((p) => ({
              ID: p.id,
              Name: p.name,
              Phone: p.phone,
              Email: p.email,
              Status: p.status,
              Verified: p.verified,
              Trips: p.trips,
              Joined: p.joined,
            }))}
          />
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total passengers',
            value: passengers.length,
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            label: 'Active accounts',
            value: passengers.filter((p) => p.status === 'Active').length,
            icon: UserCheck,
            color: 'text-emerald-700 bg-emerald-50',
          },
          {
            label: 'Suspended accounts',
            value: passengers.filter((p) => p.status === 'Suspended').length,
            icon: UserX,
            color: 'text-rose-600 bg-rose-50',
          },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4 p-5">
            <div className={`rounded-xl p-3 ${stat.color}`}>
              <stat.icon size={21} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search passengers, phone, or ID..."
          />
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter passenger verification"
              className="select"
              value={verified}
              onChange={(e) => setVerified(e.target.value)}
            >
              <option value="All">All verification</option>
              <option>Verified</option>
              <option>Unverified</option>
            </select>
            <select
              aria-label="Filter passenger status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </div>
        </div>
        <DataTable
          key={`${search}-${status}-${verified}`}
          data={filtered}
          columns={columns}
          noun="passengers"
        />
      </Card>
    </>
  )
}

export function PassengerDetailPage() {
  const { id } = useParams()
  const { passengers, rides, drivers, updateAccount } = useStore()
  const notify = useUI((s) => s.notify)
  const [confirm, setConfirm] = useState(false)
  const passenger = passengers.find((p) => p.id === id)
  if (!passenger)
    return (
      <EmptyState
        title="Passenger not found"
        description="This passenger does not exist in the sample data."
        action={
          <Button asChild>
            <Link to="/passengers">Back to passengers</Link>
          </Button>
        }
      />
    )
  const history = rides.filter((r) => r.passengerId === id)
  const suspended = passenger.status === 'Suspended'
  return (
    <>
      <BackLink to="/passengers">Passengers</BackLink>
      <PageHeading
        title="Passenger profile"
        description={`Account details and journey history · ${passenger.id}`}
        actions={
          <Button
            variant={suspended ? 'default' : 'outline'}
            onClick={() => setConfirm(true)}
          >
            {suspended ? <UserCheck size={16} /> : <UserX size={16} />}
            {suspended ? 'Reactivate account' : 'Suspend account'}
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="p-6">
          <div className="flex flex-col items-center border-b border-slate-100 pb-6">
            <Avatar name={passenger.name} size="lg" />
            <h2 className="mt-4 text-lg font-semibold">{passenger.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{passenger.id}</p>
            <div className="mt-3 flex gap-2">
              <Badge>{passenger.status}</Badge>
              <Badge>{passenger.verified ? 'Verified' : 'Unverified'}</Badge>
            </div>
          </div>
          <dl className="mt-3">
            <DetailItem label="Email">
              <span className="flex items-center gap-2 break-all">
                <Mail size={14} className="shrink-0 text-slate-400" />
                {passenger.email}
              </span>
            </DetailItem>
            <DetailItem label="Phone">
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                {passenger.phone}
              </span>
            </DetailItem>
            <DetailItem label="Location">
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                {passenger.area}, Sri Lanka
              </span>
            </DetailItem>
            <DetailItem label="Member since">
              {formatDate(passenger.joined)}
            </DetailItem>
          </dl>
        </Card>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Lifetime trips', value: passenger.trips },
              {
                label: 'Passenger rating',
                value: (
                  <span className="flex items-center gap-1">
                    {passenger.rating}
                    <Star size={17} className="fill-amber-400 text-amber-400" />
                  </span>
                ),
              },
              {
                label: 'Phone verification',
                value: (
                  <span className="flex items-center gap-1 text-base">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    {passenger.verified ? 'Verified' : 'Pending'}
                  </span>
                ),
              },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-sm text-slate-500">{s.label}</p>
                <div className="mt-3 text-2xl font-semibold">{s.value}</div>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeading
              title="Trip history"
              description="Recent sample journeys for this passenger"
            />
            {history.length ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ride</th>
                      <th>Route</th>
                      <th>Driver</th>
                      <th>Fare</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link
                            className="font-medium text-emerald-700"
                            to={`/rides/${r.id}`}
                          >
                            {r.id}
                          </Link>
                          <p className="mt-1 text-sm text-slate-400">
                            {formatDate(r.date)}
                          </p>
                        </td>
                        <td>
                          <p>{r.pickup}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            to {r.dropoff}
                          </p>
                        </td>
                        <td>
                          {drivers.find((d) => d.id === r.driverId)?.name}
                        </td>
                        <td>{money(r.fare)}</td>
                        <td>
                          <Badge>{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No recent trips"
                description="No sample ride history is available for this passenger."
              />
            )}
          </Card>
        </div>
      </div>
      <ConfirmAction
        open={confirm}
        onClose={() => setConfirm(false)}
        title={
          suspended
            ? 'Reactivate passenger account?'
            : 'Suspend passenger account?'
        }
        description={`${passenger.name}'s account will be ${suspended ? 'reactivated' : 'suspended'} in this demo.`}
        label={suspended ? 'Reactivate account' : 'Suspend account'}
        dangerous={!suspended}
        requireReason
        onConfirm={(reason) => {
          updateAccount(
            'passenger',
            passenger.id,
            suspended ? 'Active' : 'Suspended',
            reason,
          )
          notify(`Account ${suspended ? 'reactivated' : 'suspended'}`)
        }}
      />
    </>
  )
}
