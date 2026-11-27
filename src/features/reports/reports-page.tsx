import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Download,
  TrendingUp,
  Route,
  Wallet,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react'
import { useStore, useUI } from '../../lib/store'
import { exportCsv, money } from '../../lib/utils'
import { Card, CardHeading, PageHeading } from '../../components/shared/common'
import { Button } from '../../components/ui/button'

export function ReportsPage() {
  const { rides, drivers } = useStore()
  const notify = useUI((s) => s.notify)
  const [period, setPeriod] = useState('3 days')
  const dates =
    period === 'Today'
      ? ['2026-11-26']
      : period === 'Yesterday'
        ? ['2026-11-25']
        : ['2026-11-24', '2026-11-25', '2026-11-26']
  const subset = rides.filter((r) => dates.includes(r.date))
  const completed = subset.filter((r) => r.status === 'Completed')
  const revenue = completed.reduce((sum, r) => sum + r.fare, 0)
  const chart = dates.map((date) => ({
    date: `Nov ${date.slice(-2)}`,
    Rides: subset.filter((r) => r.date === date).length,
    Revenue: completed
      .filter((r) => r.date === date)
      .reduce((sum, r) => sum + r.fare, 0),
  }))
  const types = ['Car', 'Tuk', 'Bike'].map((type) => ({
    name: type,
    value: subset.filter(
      (r) => drivers.find((d) => d.id === r.driverId)?.vehicleType === type,
    ).length,
  }))
  const paymentMix = ['Card', 'Cash'].map((method) => ({
    name: method,
    value: completed
      .filter((r) => r.method === method)
      .reduce((s, r) => s + r.fare, 0),
  }))
  const colors = ['#118066', '#8fc4b1', '#d2e7dc']
  return (
    <>
      <PageHeading
        title="Reports & analytics"
        description="Turn everyday journeys into a clearer view of your business."
        actions={
          <>
            <select
              aria-label="Report period"
              className="select bg-white"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>3 days</option>
              <option>Today</option>
              <option>Yesterday</option>
            </select>
            <Button
              onClick={() => {
                exportCsv('hopon-operations-report.csv', chart)
                notify('Operations report downloaded')
              }}
            >
              <Download size={15} />
              Download report
            </Button>
          </>
        }
      />
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <CalendarDays size={14} />
        {period === '3 days'
          ? 'November 24–26, 2026'
          : period === 'Today'
            ? 'November 26, 2026'
            : 'November 25, 2026'}
        <span className="ml-2 rounded bg-slate-200/70 px-2 py-1 text-xs">
          Sample dataset
        </span>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Gross revenue', value: money(revenue), icon: Wallet },
          { label: 'Total rides', value: subset.length, icon: Route },
          {
            label: 'Completion rate',
            value: `${Math.round((completed.length / Math.max(1, subset.length)) * 100)}%`,
            icon: CheckCircle2,
          },
          {
            label: 'Average fare',
            value: money(revenue / Math.max(1, completed.length)),
            icon: TrendingUp,
          },
        ].map((s) => (
          <Card className="p-5" key={s.label}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{s.label}</p>
              <s.icon size={17} className="text-emerald-700" />
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">
              {s.value}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Selected reporting period
            </p>
          </Card>
        ))}
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeading
            title="Revenue over time"
            description="Collected fares from completed rides"
          />
          <div className="h-64 px-4 pb-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ left: 4, right: 10, top: 10 }}>
                <defs>
                  <linearGradient
                    id="reportGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop stopColor="#118066" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#118066" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 4"
                  vertical={false}
                  stroke="#edf0f2"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                />
                <Tooltip formatter={(v) => money(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#118066"
                  fill="url(#reportGradient)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeading
            title="Ride volume"
            description="All ride requests by day"
          />
          <div className="h-64 px-4 pb-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -20, top: 10 }}>
                <CartesianGrid
                  strokeDasharray="3 4"
                  vertical={false}
                  stroke="#edf0f2"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ fill: '#f1f5f3' }} />
                <Bar
                  dataKey="Rides"
                  fill="#118066"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeading
            title="Rides by vehicle type"
            description="How your passengers choose to travel"
          />
          <div className="flex items-center px-5 pb-5">
            <div className="h-52 w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={types}
                    dataKey="value"
                    innerRadius="65%"
                    outerRadius="90%"
                    paddingAngle={4}
                    stroke="none"
                  >
                    {types.map((type, i) => (
                      <Cell key={type.name} fill={colors[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-5 pl-5">
              {types.map((type, i) => (
                <div
                  key={type.name}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: colors[i] }}
                  />
                  <span className="text-slate-500">{type.name}</span>
                  <span className="ml-auto font-semibold">
                    {type.value}
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      {Math.round(
                        (type.value / Math.max(1, subset.length)) * 100,
                      )}
                      %
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeading
            title="Payment breakdown"
            description="Revenue collected by payment method"
          />
          <div className="space-y-6 px-5 pt-4 pb-6">
            {paymentMix.map((method, i) => (
              <div key={method.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{method.name}</span>
                  <span className="font-semibold">{money(method.value)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(method.value / Math.max(1, revenue)) * 100}%`,
                      background: colors[i],
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {Math.round((method.value / Math.max(1, revenue)) * 100)}% of
                  total revenue
                </p>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-4 text-sm font-semibold">
              <span>Total collected</span>
              <span>{money(revenue)}</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
