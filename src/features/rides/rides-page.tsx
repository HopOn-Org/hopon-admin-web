import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  MapPin,
  Navigation,
  Route,
  Wallet,
  CheckCircle2,
  XCircle,
  CarFront,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Ride } from '../../types'
import { useStore } from '../../lib/store'
import { formatDate, money } from '../../lib/utils'
import {
  Avatar,
  BackLink,
  Badge,
  Card,
  CardHeading,
  DetailItem,
  EmptyState,
  ExportButton,
  PageHeading,
  SearchInput,
} from '../../components/shared/common'
import { DataTable } from '../../components/shared/data-table'
import { Button } from '../../components/ui/button'

export function RidesPage() {
  const { rides, passengers, drivers } = useStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [date, setDate] = useState('All')
  const filtered = rides.filter(
    (r) =>
      `${r.id} ${r.pickup} ${r.dropoff} ${passengers.find((p) => p.id === r.passengerId)?.name} ${drivers.find((d) => d.id === r.driverId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'All' || r.status === status) &&
      (date === 'All' || r.date === date),
  )
  const columns: ColumnDef<Ride, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'Ride ID',
      cell: ({ row }) => (
        <Link
          className="font-semibold text-emerald-700"
          to={`/rides/${row.original.id}`}
        >
          {row.original.id}
          <p className="mt-1 text-sm font-normal text-slate-400">
            {formatDate(row.original.date)} · {row.original.time}
          </p>
        </Link>
      ),
    },
    {
      accessorKey: 'passengerId',
      header: 'Passenger',
      cell: ({ row }) => (
        <Link
          className="hover:text-emerald-700"
          to={`/passengers/${row.original.passengerId}`}
        >
          {passengers.find((p) => p.id === row.original.passengerId)?.name}
        </Link>
      ),
    },
    {
      accessorKey: 'pickup',
      header: 'Journey',
      cell: ({ row }) => (
        <div className="max-w-[230px] text-sm">
          <p className="flex items-center gap-2">
            <span className="size-1.5 shrink-0 rounded-full border border-emerald-600" />
            {row.original.pickup}
          </p>
          <p className="mt-2 flex items-center gap-2 text-slate-400">
            <span className="size-1.5 shrink-0 rounded-sm bg-slate-400" />
            {row.original.dropoff}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'driverId',
      header: 'Driver',
      cell: ({ row }) => (
        <Link
          className="hover:text-emerald-700"
          to={`/drivers/${row.original.driverId}`}
        >
          {row.original.status === 'Requested'
            ? 'Awaiting assignment'
            : drivers.find((d) => d.id === row.original.driverId)?.name}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      accessorKey: 'fare',
      header: 'Fare',
      cell: ({ row }) => (
        <span className="font-medium">{money(row.original.fare)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button asChild variant="ghost" size="icon">
          <Link
            aria-label={`View ${row.original.id}`}
            to={`/rides/${row.original.id}`}
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
        title="Rides"
        description="Follow every journey, from the first request to the final destination."
        actions={
          <ExportButton
            filename="hopon-rides.csv"
            rows={filtered.map((r) => ({
              ID: r.id,
              Passenger: passengers.find((p) => p.id === r.passengerId)?.name,
              Driver:
                r.status === 'Requested'
                  ? 'Unassigned'
                  : drivers.find((d) => d.id === r.driverId)?.name,
              Pickup: r.pickup,
              Dropoff: r.dropoff,
              Status: r.status,
              Fare: r.fare,
              Date: r.date,
              Time: r.time,
            }))}
          />
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Total rides', value: rides.length, icon: Route },
          {
            label: 'In progress',
            value: rides.filter((r) =>
              ['Active', 'Accepted'].includes(r.status),
            ).length,
            icon: Navigation,
          },
          {
            label: 'Completed',
            value: rides.filter((r) => r.status === 'Completed').length,
            icon: CheckCircle2,
          },
          {
            label: 'Cancelled',
            value: rides.filter((r) => r.status === 'Cancelled').length,
            icon: XCircle,
          },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-5">
            <span className="rounded-lg bg-slate-50 p-2.5 text-emerald-700">
              <s.icon size={20} />
            </span>
            <div>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search rides, people, or locations..."
          />
          <div className="flex flex-wrap gap-2">
            <select
              className="select"
              aria-label="Ride date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            >
              <option value="All">All dates</option>
              <option value="2026-11-26">Nov 26, 2026</option>
              <option value="2026-11-25">Nov 25, 2026</option>
              <option value="2026-11-24">Nov 24, 2026</option>
            </select>
            <select
              className="select"
              aria-label="Ride status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All statuses</option>
              {[
                'Requested',
                'Accepted',
                'Active',
                'Completed',
                'Cancelled',
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          key={`${search}-${status}-${date}`}
          data={filtered}
          columns={columns}
          noun="rides"
        />
      </Card>
    </>
  )
}

export function RideDetailPage() {
  const { id } = useParams()
  const { rides, passengers, drivers } = useStore()
  const ride = rides.find((r) => r.id === id)
  if (!ride)
    return (
      <EmptyState
        title="Ride not found"
        description="This ride does not exist in the sample data."
        action={
          <Button asChild>
            <Link to="/rides">Back to rides</Link>
          </Button>
        }
      />
    )
  const passenger = passengers.find((p) => p.id === ride.passengerId)!
  const driver = drivers.find((d) => d.id === ride.driverId)!
  const timeline = [
    'Ride requested',
    'Driver assigned',
    'Driver arrived',
    'Trip started',
    'Trip completed',
  ]
  const progress =
    ride.status === 'Completed'
      ? 4
      : ride.status === 'Active'
        ? 3
        : ride.status === 'Accepted'
          ? 1
          : 0
  return (
    <>
      <BackLink to="/rides">Rides</BackLink>
      <PageHeading
        title={`Ride ${ride.id}`}
        description={`${formatDate(ride.date)} at ${ride.time} · ${ride.distance}`}
        actions={<Badge className="px-3 py-1.5 text-sm">{ride.status}</Badge>}
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeading
              title="Journey details"
              description="Pickup, destination, and trip overview"
            />
            <div className="route-illustration mx-5 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
              <svg
                viewBox="0 0 700 190"
                className="h-full w-full"
                aria-label="Illustrative route, not actual road directions"
              >
                <defs>
                  <pattern
                    id="routeGrid"
                    width="45"
                    height="45"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-15)"
                  >
                    <rect width="45" height="45" fill="#f0f3ef" />
                    <rect
                      x="3"
                      y="3"
                      width="39"
                      height="39"
                      fill="#e4e9e1"
                      rx="2"
                    />
                  </pattern>
                </defs>
                <rect width="700" height="190" fill="url(#routeGrid)" />
                <path
                  d="M100 145L230 145Q270 145 270 110L270 75Q270 45 310 45L560 45"
                  fill="none"
                  stroke="white"
                  strokeWidth="16"
                />
                <path
                  d="M100 145L230 145Q270 145 270 110L270 75Q270 45 310 45L560 45"
                  fill="none"
                  stroke="#118066"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle
                  cx="100"
                  cy="145"
                  r="10"
                  fill="white"
                  stroke="#118066"
                  strokeWidth="4"
                />
                <circle
                  cx="560"
                  cy="45"
                  r="10"
                  fill="#118066"
                  stroke="white"
                  strokeWidth="4"
                />
                <rect
                  x="306"
                  y="66"
                  width="100"
                  height="27"
                  rx="6"
                  fill="white"
                />
                <text
                  x="356"
                  y="84"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#466257"
                  fontFamily="system-ui"
                >
                  {ride.distance}
                </text>
              </svg>
            </div>
            <p className="mx-5 mt-2 text-xs text-slate-400">
              Illustrative route · Sample journey
            </p>
            <div className="space-y-5 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Pickup location</p>
                  <p className="mt-1 text-sm font-medium">{ride.pickup}</p>
                </div>
              </div>
              <div className="ml-4 h-4 border-l-2 border-dashed border-slate-200" />
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-slate-100 p-2 text-slate-600">
                  <Navigation size={18} />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Drop-off location</p>
                  <p className="mt-1 text-sm font-medium">{ride.dropoff}</p>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeading
              title="Trip timeline"
              description="Sample events for this journey"
            />
            <div className="px-6 pb-6">
              {timeline.slice(0, progress + 1).map((event, i) => (
                <div key={event} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < progress && (
                    <span className="absolute top-6 left-2.5 h-[calc(100%-20px)] w-px bg-emerald-200" />
                  )}
                  <span className="relative z-10 rounded-full bg-emerald-50 p-1 text-emerald-700">
                    <CheckCircle2 size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{event}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {i === 0 ? ride.time : `${ride.time} + ${i * 3} min`}
                    </p>
                  </div>
                </div>
              ))}
              {ride.status === 'Cancelled' && (
                <div className="mt-6 flex gap-4">
                  <XCircle size={22} className="text-rose-500" />
                  <div>
                    <p className="text-sm font-medium">
                      Ride cancelled by passenger
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {ride.cancellationReason}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeading title="People on this journey" />
            <div className="px-5 pb-5">
              <Link
                to={`/passengers/${passenger.id}`}
                className="flex items-center gap-3 border-b border-slate-100 pb-4"
              >
                <Avatar name={passenger.name} />
                <div className="flex-1">
                  <p className="text-sm text-slate-400">Passenger</p>
                  <p className="mt-1 text-sm font-medium">{passenger.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {passenger.phone}
                  </p>
                </div>
                <ArrowUpRight size={15} className="text-slate-400" />
              </Link>
              {ride.status !== 'Requested' ? (
                <Link
                  to={`/drivers/${driver.id}`}
                  className="mt-4 flex items-center gap-3"
                >
                  <Avatar name={driver.name} index={2} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Driver</p>
                    <p className="mt-1 text-sm font-medium">{driver.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {driver.vehicle} · {driver.plate}
                    </p>
                  </div>
                  <ArrowUpRight size={15} className="text-slate-400" />
                </Link>
              ) : (
                <p className="mt-4 text-sm text-amber-700">
                  Awaiting driver assignment
                </p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeading title="Fare & payment" />
            <dl className="px-5 pb-3">
              <DetailItem label="Total fare">
                <span className="text-2xl font-semibold">
                  {money(ride.fare)}
                </span>
              </DetailItem>
              <DetailItem label="Payment method">
                <span className="flex items-center gap-2">
                  <Wallet size={16} />
                  {ride.method}
                </span>
              </DetailItem>
              <DetailItem label="Payment status">
                <Badge>
                  {ride.status === 'Completed'
                    ? 'Paid'
                    : ride.status === 'Cancelled'
                      ? 'Cancelled'
                      : 'Pending'}
                </Badge>
              </DetailItem>
              <DetailItem label="Distance">{ride.distance}</DetailItem>
              <DetailItem label="Vehicle class">
                <span className="flex items-center gap-2">
                  <CarFront size={16} />
                  {driver.vehicleType}
                </span>
              </DetailItem>
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}
