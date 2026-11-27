import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CarFront,
  Route,
  Wallet,
  TrendingUp,
  CalendarDays,
  ShieldCheck,
  ArrowUpRight,
  Clock3,
  Check,
  Activity,
  Download,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore, useUI } from '../../lib/store'
import { weeklyMetrics } from '../../data/seed'
import { money, exportCsv } from '../../lib/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeading,
  PageHeading,
} from '../../components/shared/common'
import { Button } from '../../components/ui/button'
import { OperationsMap } from '../live-map/operations-map'
import { useAuthentication } from '../auth/authentication-gate'

export function DashboardPage() {
  const { user } = useAuthentication()
  const { drivers, passengers, rides, audit, settings } = useStore()
  const notify = useUI((s) => s.notify)
  const [period, setPeriod] = useState('This week')
  const [chartMetric, setChartMetric] = useState('rides')
  const pending = drivers.filter((d) => d.verification === 'Pending')
  const online = drivers.filter(
    (d) =>
      d.availability !== 'Offline' &&
      d.status === 'Active' &&
      d.verification === 'Approved',
  )
  const completed = rides.filter((r) => r.status === 'Completed')
  const todayRevenue = completed
    .filter((r) => r.date === '2026-11-26')
    .reduce((sum, r) => sum + r.fare, 0)
  const chart = (
    period === 'Today'
      ? weeklyMetrics.map((d, i) => ({
          ...d,
          day: `${8 + i * 2}:00`,
          rides: Math.round(d.rides / 8),
          previous: Math.round(d.previous / 8),
          revenue: Math.round(d.revenue / 8),
        }))
      : period === 'This month'
        ? weeklyMetrics.map((d, i) => ({
            ...d,
            day: `Nov ${i * 4 + 1}`,
            rides: d.rides * 4,
            previous: d.previous * 4,
            revenue: d.revenue * 4,
          }))
        : weeklyMetrics
  ).map((d) => ({ ...d, previousRevenue: Math.round(d.revenue * 0.82) }))
  const statistics = [
    {
      title: 'Total passengers',
      value: passengers.length.toLocaleString(),
      change: '+12.8%',
      caption: 'vs. previous month',
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      title: 'Registered drivers',
      value: drivers.length.toLocaleString(),
      change: '+8.2%',
      caption: `${online.length} drivers online now`,
      icon: CarFront,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Completed rides',
      value: completed.length.toLocaleString(),
      change: '+18.6%',
      caption: 'across sample ride history',
      icon: Route,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      title: "Today's revenue",
      value: money(todayRevenue),
      change: '+14.3%',
      caption: 'completed rides · Nov 26',
      icon: Wallet,
      color: 'text-amber-600 bg-amber-50',
    },
  ]
  return (
    <>
      <PageHeading
        title={`Good afternoon, ${user?.givenName || user?.name.split(' ')[0] || settings.name.split(' ')[0]} 👋`}
        description="Here's what's happening with your operations today."
        actions={
          <>
            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 sm:flex">
              <CalendarDays size={15} />
              Thu, Nov 26, 2026
            </div>
            <Button
              variant="outline"
              onClick={() => {
                exportCsv(
                  'hopon-overview.csv',
                  statistics.map((s) => ({
                    Metric: s.title,
                    Value: s.value,
                    Context: s.caption,
                  })),
                )
                notify('Overview report downloaded')
              }}
            >
              <Download size={14} />
              Export report
            </Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/70 bg-[#fffaf0] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
            <ShieldCheck size={17} />
          </div>
          <p className="text-sm text-amber-900">
            <strong className="font-semibold">
              {pending.length} driver applications need your attention.
            </strong>
            <span className="ml-1.5 hidden text-amber-800/75 md:inline">
              Help new drivers get on the road.
            </span>
          </p>
        </div>
        <Link
          to="/drivers?status=Pending"
          className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-amber-900"
        >
          Review applications
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <span className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon size={17} strokeWidth={1.8} />
              </span>
            </div>
            <p className="mt-3 text-[29px] leading-9 font-semibold tracking-[-1px]">
              {stat.value}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs">
              <span className="flex items-center gap-0.5 font-medium text-emerald-700">
                <TrendingUp size={11} />
                {stat.change}
              </span>
              <span className="text-slate-400">{stat.caption}</span>
            </div>
          </Card>
        ))}
      </div>
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Card>
          <CardHeading
            title="Ride activity"
            description="A snapshot of journeys across your network"
            action={
              <select
                aria-label="Chart period"
                className="select h-8 min-w-28 text-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option>Today</option>
                <option>This week</option>
                <option>This month</option>
              </select>
            }
          />
          <div className="flex items-center justify-between px-5 pb-3">
            <div className="flex items-end gap-3">
              <p className="text-3xl font-semibold tracking-tight">
                {chartMetric === 'rides'
                  ? chart.reduce((s, d) => s + d.rides, 0).toLocaleString()
                  : money(chart.reduce((s, d) => s + d.revenue, 0))}
              </p>
              <span className="mb-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                +18.6%
              </span>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {['rides', 'revenue'].map((metric) => (
                <button
                  key={metric}
                  className={`rounded-md px-3 py-1 text-xs capitalize ${chartMetric === metric ? 'bg-white font-medium shadow-xs' : 'text-slate-500'}`}
                  onClick={() => setChartMetric(metric)}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[225px] w-full px-2 pr-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chart}
                margin={{ top: 15, right: 3, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="rideGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b906a" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#0b906a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 4"
                  stroke="#edf0f2"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#8d98a7' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#8d98a7' }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${v / 1000}k` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 12,
                  }}
                  formatter={(value) =>
                    chartMetric === 'revenue'
                      ? money(Number(value))
                      : Number(value).toLocaleString()
                  }
                />
                <Area
                  type="monotone"
                  dataKey={
                    chartMetric === 'rides' ? 'previous' : 'previousRevenue'
                  }
                  name="Previous period"
                  stroke="#c3cbd4"
                  strokeDasharray="5 5"
                  fill="transparent"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  name={chartMetric === 'rides' ? 'Rides' : 'Revenue'}
                  stroke="#0b906a"
                  fill="url(#rideGradient)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            <span>Illustrative trend · Sample data</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Current period
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-px w-3 border-t border-dashed border-slate-400" />
                Previous period
              </span>
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <CardHeading
            title="Live operations"
            description="Your fleet, at a glance"
            action={
              <span className="flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Simulation
              </span>
            }
          />
          <OperationsMap compact />
          <div className="flex items-center justify-around border-t border-slate-100 px-3 py-3">
            <div className="text-center">
              <p className="text-base font-semibold">{online.length}</p>
              <p className="mt-0.5 text-xs text-slate-400">Online drivers</p>
            </div>
            <div className="h-7 w-px bg-slate-100" />
            <div className="text-center">
              <p className="text-base font-semibold text-emerald-700">
                {online.filter((d) => d.availability === 'Available').length}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">Available</p>
            </div>
            <div className="h-7 w-px bg-slate-100" />
            <div className="text-center">
              <p className="text-base font-semibold text-amber-600">
                {online.filter((d) => d.availability === 'On trip').length}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">On a trip</p>
            </div>
          </div>
        </Card>
      </div>
      <div className="mb-6 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeading
            title="Recent rides"
            description="The latest journeys on HopOn"
            action={
              <Link
                className="text-sm font-medium text-emerald-700"
                to="/rides"
              >
                View all rides
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Ride ID</th>
                  <th>Passenger</th>
                  <th>Status</th>
                  <th>Fare</th>
                  <th>Time</th>
                  <th aria-label="View ride" />
                </tr>
              </thead>
              <tbody>
                {rides.slice(0, 5).map((ride) => {
                  const passenger = passengers.find(
                    (p) => p.id === ride.passengerId,
                  )!
                  return (
                    <tr key={ride.id}>
                      <td>
                        <Link
                          to={`/rides/${ride.id}`}
                          className="font-semibold text-slate-700 hover:text-emerald-700"
                        >
                          #{ride.id.slice(3)}
                        </Link>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={passenger.name}
                            size="sm"
                            index={rides.indexOf(ride)}
                          />
                          <span>{passenger.name}</span>
                        </div>
                      </td>
                      <td>
                        <Badge>{ride.status}</Badge>
                      </td>
                      <td className="font-medium">{money(ride.fare)}</td>
                      <td className="text-slate-400">{ride.time}</td>
                      <td>
                        <Link
                          aria-label={`View ride ${ride.id}`}
                          to={`/rides/${ride.id}`}
                          className="text-slate-400 hover:text-emerald-700"
                        >
                          <ArrowUpRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeading
            title="Pending approvals"
            description="A few checks. A new journey."
            action={
              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                {pending.length} pending
              </span>
            }
          />
          <div className="px-5">
            {pending.slice(0, 3).map((driver, i) => (
              <Link
                key={driver.id}
                to={`/drivers/${driver.id}`}
                className="flex items-center gap-3 border-b border-slate-100 py-4 last:border-0"
              >
                <Avatar name={driver.name} index={i + 1} />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{driver.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {driver.vehicleType} · {driver.area}
                  </p>
                </div>
                <span className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                  Review
                </span>
              </Link>
            ))}
            {!pending.length && (
              <p className="py-10 text-center text-sm text-emerald-700">
                All caught up. No pending applications.
              </p>
            )}
          </div>
          <div className="px-5 pt-2 pb-4">
            <Button asChild variant="outline" className="w-full text-sm">
              <Link to="/drivers?status=Pending">View all applications</Link>
            </Button>
          </div>
        </Card>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeading
            title="Recent activity"
            action={
              <Link to="/audit-logs" className="text-sm text-emerald-700">
                View audit log
              </Link>
            }
          />
          <div className="space-y-4 px-5 pb-5">
            {audit.slice(0, 3).map((entry, i) => (
              <div className="flex items-start gap-3" key={entry.id}>
                <span
                  className={`rounded-full p-1.5 ${i === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {i === 0 ? <Check size={13} /> : <Activity size={13} />}
                </span>
                <div>
                  <p className="text-sm">
                    <strong className="font-medium">{entry.action}</strong>
                    <span className="text-slate-400"> · {entry.target}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {entry.actor} ·{' '}
                    {new Date(entry.time).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'Asia/Colombo',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="relative overflow-hidden bg-[#eef6f2]">
          <div className="relative z-10 p-6">
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-white text-emerald-800">
              <Clock3 size={20} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-emerald-950">
              A clearer picture of every journey.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-5 text-emerald-900/65">
              Explore ride trends, fleet performance, and revenue in your
              operations reports.
            </p>
            <Link
              to="/reports"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
            >
              Explore reports
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="absolute -right-10 -bottom-20 size-64 rounded-full border-[28px] border-emerald-800/[.04]" />
        </Card>
      </div>
    </>
  )
}
