import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowUpRight,
  Star,
  CarFront,
  FileText,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  UserX,
  UserCheck,
  Eye,
  MapPin,
  Clock3,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Driver } from '../../types'
import { useStore, useUI } from '../../lib/store'
import { formatDate } from '../../lib/utils'
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
import { Dialog } from '../../components/ui/dialog'

export function DriversPage() {
  const drivers = useStore((s) => s.drivers)
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [vehicle, setVehicle] = useState('All')
  const [account, setAccount] = useState('All')
  const status = params.get('status') || 'All'
  const filtered = drivers.filter(
    (d) =>
      `${d.name} ${d.id} ${d.phone} ${d.plate}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'All' || d.verification === status) &&
      (vehicle === 'All' || d.vehicleType === vehicle) &&
      (account === 'All' || d.status === account),
  )
  const columns: ColumnDef<Driver, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Driver',
      cell: ({ row }) => (
        <Link
          to={`/drivers/${row.original.id}`}
          className="flex items-center gap-3"
        >
          <Avatar name={row.original.name} index={row.index + 2} />
          <span className="font-medium hover:text-brand-700">
            {row.original.name}
            <span className="mt-1 block text-sm font-normal text-slate-400">
              {row.original.id} · {row.original.phone}
            </span>
          </span>
        </Link>
      ),
    },
    {
      accessorKey: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CarFront size={17} className="text-slate-400" />
          <div>
            {row.original.vehicle}
            <p className="mt-1 text-sm text-slate-400">{row.original.plate}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'verification',
      header: 'Verification',
      cell: ({ row }) => <Badge>{row.original.verification}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Account',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      accessorKey: 'availability',
      header: 'Availability',
      cell: ({ row }) => <Badge>{row.original.availability}</Badge>,
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <span className="flex items-center gap-1">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {row.original.rating}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          asChild
          variant={
            row.original.verification === 'Pending' ? 'outline' : 'ghost'
          }
          size="sm"
        >
          <Link to={`/drivers/${row.original.id}`}>
            {row.original.verification === 'Pending' ? (
              'Review'
            ) : (
              <ArrowUpRight size={16} />
            )}
            <span className="sr-only"> {row.original.name}</span>
          </Link>
        </Button>
      ),
    },
  ]
  return (
    <>
      <PageHeading
        title="Drivers"
        description="Manage your fleet community and keep great journeys moving."
        actions={
          <ExportButton
            filename="hopon-drivers.csv"
            rows={filtered.map((d) => ({
              ID: d.id,
              Name: d.name,
              Phone: d.phone,
              Verification: d.verification,
              Account: d.status,
              Availability: d.availability,
              Vehicle: d.vehicle,
              Plate: d.plate,
            }))}
          />
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Registered drivers',
            value: drivers.length,
            icon: CarFront,
            color: 'bg-blue-50 text-blue-600',
          },
          {
            label: 'Approved drivers',
            value: drivers.filter((d) => d.verification === 'Approved').length,
            icon: CheckCircle2,
            color: 'bg-brand-50 text-brand-700',
          },
          {
            label: 'Pending verification',
            value: drivers.filter((d) => d.verification === 'Pending').length,
            icon: Clock3,
            color: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Online now',
            value: drivers.filter(
              (d) =>
                d.availability !== 'Offline' &&
                d.status === 'Active' &&
                d.verification === 'Approved',
            ).length,
            icon: MapPin,
            color: 'bg-violet-50 text-violet-600',
          },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-5">
            <span className={`rounded-lg p-2.5 ${s.color}`}>
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
        <div className="flex overflow-x-auto border-b border-slate-200 px-5">
          {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setParams(tab === 'All' ? {} : { status: tab })}
              className={`mr-6 flex shrink-0 items-center gap-2 border-b-2 py-4 text-sm ${status === tab ? 'border-brand-700 font-semibold text-brand-700' : 'border-transparent text-slate-500'}`}
            >
              {tab === 'All' ? 'All drivers' : tab}
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs ${status === tab ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {
                  drivers.filter((d) => tab === 'All' || d.verification === tab)
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search drivers, plate, or ID..."
          />
          <div className="flex gap-2">
            <select
              className="select"
              aria-label="Driver account status"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            >
              <option value="All">All accounts</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>
            <select
              className="select"
              aria-label="Vehicle type"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            >
              <option value="All">All vehicles</option>
              <option>Car</option>
              <option>Tuk</option>
              <option>Bike</option>
            </select>
          </div>
        </div>
        <DataTable
          key={`${search}-${status}-${vehicle}-${account}`}
          data={filtered}
          columns={columns}
          noun="drivers"
        />
      </Card>
    </>
  )
}

const documentNames = [
  'National identity card',
  'Driving license',
  'Vehicle registration',
  'Insurance certificate',
]
export function DriverDetailPage() {
  const { id } = useParams()
  const { drivers, rides, verifyDriver, updateAccount, audit } = useStore()
  const notify = useUI((s) => s.notify)
  const [action, setAction] = useState<'approve' | 'reject' | 'suspend' | null>(
    null,
  )
  const [document, setDocument] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Record<string, string[]>>({})
  const reviewed = reviews[id || ''] || []
  const driver = drivers.find((d) => d.id === id)
  if (!driver)
    return (
      <EmptyState
        title="Driver not found"
        description="This driver does not exist in the sample data."
        action={
          <Button asChild>
            <Link to="/drivers">Back to drivers</Link>
          </Button>
        }
      />
    )
  const suspended = driver.status === 'Suspended'
  const driverAudit = audit.filter((a) => a.target === driver.name)
  return (
    <>
      <BackLink to="/drivers">Drivers</BackLink>
      <PageHeading
        title="Driver profile"
        description={`Driver details, documents, and verification · ${driver.id}`}
        actions={
          <Button variant="outline" onClick={() => setAction('suspend')}>
            {suspended ? <UserCheck size={16} /> : <UserX size={16} />}
            {suspended ? 'Reactivate account' : 'Suspend account'}
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[310px_1fr]">
        <Card className="p-6">
          <div className="flex flex-col items-center border-b border-slate-100 pb-6">
            <Avatar name={driver.name} size="lg" index={2} />
            <h2 className="mt-4 text-lg font-semibold">{driver.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{driver.id}</p>
            <div className="mt-3 flex gap-2">
              <Badge>{driver.verification}</Badge>
              <Badge>{driver.status}</Badge>
            </div>
            <p className="mt-4 flex items-center gap-1 text-sm">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {driver.rating}
              <span className="ml-1 text-sm text-slate-400">
                · {driver.trips} lifetime trips
              </span>
            </p>
          </div>
          <dl className="mt-3">
            <DetailItem label="Email">{driver.email}</DetailItem>
            <DetailItem label="Phone">{driver.phone}</DetailItem>
            <DetailItem label="Service area">{driver.area}</DetailItem>
            <DetailItem label="Availability">
              <Badge>{driver.availability}</Badge>
            </DetailItem>
            <DetailItem label="Joined">{formatDate(driver.joined)}</DetailItem>
          </dl>
          {driver.availability !== 'Offline' && (
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to={`/live-map?driver=${driver.id}`}>
                <MapPin size={15} />
                Locate on map
              </Link>
            </Button>
          )}
        </Card>
        <div className="space-y-6">
          {driver.verification === 'Pending' && (
            <Card className="border-amber-200 bg-amber-50/60 p-5">
              <div className="flex gap-3">
                <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <ShieldCheck size={21} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-amber-950">
                    Ready for verification
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-amber-800">
                    Review all four submitted documents before approving this
                    driver.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => setAction('approve')}
                  disabled={reviewed.length < 4}
                >
                  <CheckCircle2 size={15} />
                  Approve driver
                </Button>
                <Button variant="outline" onClick={() => setAction('reject')}>
                  <XCircle size={15} />
                  Reject application
                </Button>
                <span className="ml-1 text-sm text-amber-700">
                  {reviewed.length} of 4 documents reviewed
                </span>
              </div>
            </Card>
          )}
          {driver.verification === 'Rejected' && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <strong>Application rejected.</strong>
              <p className="mt-1">
                {driverAudit.find((a) => a.action === 'Driver rejected')
                  ?.reason ||
                  'The driver must resubmit valid documents for review.'}
              </p>
            </div>
          )}
          <Card>
            <CardHeading
              title="Submitted documents"
              description="Demo documents for the verification workflow"
            />
            <div className="divide-y divide-slate-100 px-5">
              {documentNames.map((name) => (
                <div key={name} className="flex items-center gap-3 py-4">
                  <span className="rounded-lg bg-slate-100 p-2.5 text-slate-500">
                    <FileText size={19} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      PDF · Sample document · Submitted{' '}
                      {formatDate(driver.joined)}
                    </p>
                  </div>
                  {reviewed.includes(name) && (
                    <CheckCircle2 size={16} className="text-brand-600" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocument(name)}
                  >
                    <Eye size={13} />
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeading title="Registered vehicle" />
            <div className="flex flex-wrap items-center gap-5 px-5 pb-5">
              <div className="flex h-24 w-32 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <CarFront size={56} strokeWidth={1} />
              </div>
              <div>
                <p className="text-lg font-semibold">{driver.vehicle}</p>
                <p className="mt-1 text-sm text-slate-500">{driver.plate}</p>
                <div className="mt-3 flex gap-2">
                  <Badge>{driver.vehicleType}</Badge>
                  <span className="text-sm text-slate-400">
                    Registration year · 2022
                  </span>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeading title="Recent journeys" />
            <div className="px-5 pb-5">
              {rides
                .filter((r) => r.driverId === id)
                .slice(0, 3)
                .map((r) => (
                  <Link
                    key={r.id}
                    to={`/rides/${r.id}`}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {r.id}
                        <span className="ml-3 text-sm font-normal text-slate-400">
                          {formatDate(r.date)}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {r.pickup} to {r.dropoff}
                      </p>
                    </div>
                    <Badge>{r.status}</Badge>
                  </Link>
                ))}
              {!rides.some((r) => r.driverId === id) && (
                <p className="py-4 text-sm text-slate-400">
                  No recent sample journeys for this driver.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Dialog
        open={!!document}
        onOpenChange={(open) => {
          if (!open) setDocument(null)
        }}
        title={document || 'Document'}
        description="Sample document preview. Contains fictional data for frontend review only."
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="absolute top-1/2 -left-4 rotate-[-25deg] text-5xl font-black tracking-widest text-slate-200/70">
            SAMPLE ONLY
          </div>
          <div className="relative">
            <ShieldCheck size={32} className="mb-5 text-brand-700" />
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              HopOn document preview
            </p>
            <h3 className="mt-2 text-xl font-semibold">{document}</h3>
            <dl className="mt-5 grid grid-cols-2 gap-5">
              <div>
                <dt className="text-sm text-slate-400">Full name</dt>
                <dd className="mt-1 text-sm font-medium">{driver.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Reference</dt>
                <dd className="mt-1 text-sm font-medium">DEMO-{driver.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Issued</dt>
                <dd className="mt-1 text-sm">01 Jan 2026</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-400">Valid until</dt>
                <dd className="mt-1 text-sm">31 Dec 2027</dd>
              </div>
            </dl>
            <div className="mt-6 h-10 rounded bg-[repeating-linear-gradient(90deg,#334155_0px,#334155_2px,transparent_2px,transparent_5px)] opacity-30" />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDocument(null)}>
            Close
          </Button>
          {driver.verification === 'Pending' && (
            <Button
              onClick={() => {
                if (document)
                  setReviews((all) => ({
                    ...all,
                    [driver.id]: [
                      ...new Set([...(all[driver.id] || []), document]),
                    ],
                  }))
                setDocument(null)
                notify('Document marked as reviewed')
              }}
            >
              <CheckCircle2 size={15} />
              Mark as reviewed
            </Button>
          )}
        </div>
      </Dialog>
      <ConfirmAction
        open={action !== null}
        onClose={() => setAction(null)}
        title={
          action === 'approve'
            ? 'Approve this driver?'
            : action === 'reject'
              ? 'Reject this application?'
              : suspended
                ? 'Reactivate driver account?'
                : 'Suspend driver account?'
        }
        description={`${driver.name} · ${driver.id}. This updates the local demo record.`}
        label={
          action === 'approve'
            ? 'Approve driver'
            : action === 'reject'
              ? 'Reject application'
              : suspended
                ? 'Reactivate account'
                : 'Suspend account'
        }
        dangerous={action === 'reject' || (action === 'suspend' && !suspended)}
        requireReason={action !== 'approve'}
        onConfirm={(reason) => {
          if (action === 'approve' || action === 'reject') {
            verifyDriver(
              driver.id,
              action === 'approve' ? 'Approved' : 'Rejected',
              reason || 'All four submitted documents reviewed and verified.',
            )
            notify(
              action === 'approve'
                ? 'Driver approved successfully'
                : 'Application rejected',
            )
          } else {
            updateAccount(
              'driver',
              driver.id,
              suspended ? 'Active' : 'Suspended',
              reason,
            )
            notify(`Driver account ${suspended ? 'reactivated' : 'suspended'}`)
          }
        }}
      />
    </>
  )
}
