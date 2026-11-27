import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Radio, CarFront, MapPin, RotateCcw, Star } from 'lucide-react'
import { useStore } from '../../lib/store'
import {
  Avatar,
  Badge,
  Card,
  PageHeading,
  SearchInput,
} from '../../components/shared/common'
import { Button } from '../../components/ui/button'
import { OperationsMap } from './operations-map'

export function LiveMapPage() {
  const drivers = useStore((s) => s.drivers)
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('All')
  const [type, setType] = useState('All')
  const [area, setArea] = useState('All')
  const [search, setSearch] = useState('')
  const online = drivers.filter(
    (d) =>
      d.status === 'Active' &&
      d.verification === 'Approved' &&
      d.availability !== 'Offline',
  )
  const filtered = online.filter(
    (d) =>
      (status === 'All' || d.availability === status) &&
      (type === 'All' || d.vehicleType === type) &&
      (area === 'All' || d.area === area) &&
      d.name.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <>
      <PageHeading
        title="Live operations"
        description="A city in motion. Keep an eye on your drivers and active journeys."
        actions={
          <span className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <Radio size={14} />
            Simulation mode
          </span>
        }
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          {
            name: 'Drivers online',
            value: online.length,
            icon: CarFront,
            color: 'text-slate-800',
          },
          {
            name: 'Available for rides',
            value: online.filter((d) => d.availability === 'Available').length,
            icon: MapPin,
            color: 'text-emerald-700',
          },
          {
            name: 'Currently on a trip',
            value: online.filter((d) => d.availability === 'On trip').length,
            icon: Radio,
            color: 'text-amber-600',
          },
        ].map((s) => (
          <Card key={s.name} className="flex items-center gap-4 p-5">
            <s.icon className={s.color} size={22} />
            <div>
              <p className="text-sm text-slate-500">{s.name}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.color}`}>
                {s.value}
              </p>
            </div>
          </Card>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Map availability"
        >
          <option value="All">All availability</option>
          <option>Available</option>
          <option>On trip</option>
        </select>
        <select
          className="select"
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Map vehicle type"
        >
          <option value="All">All vehicle types</option>
          <option>Car</option>
          <option>Tuk</option>
          <option>Bike</option>
        </select>
        <select
          className="select"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          aria-label="Map area"
        >
          <option value="All">All areas</option>
          {[...new Set(online.map((d) => d.area))].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <Button
          variant="ghost"
          onClick={() => {
            setStatus('All')
            setType('All')
            setArea('All')
            setSearch('')
            setParams({})
          }}
        >
          <RotateCcw size={14} />
          Reset
        </Button>
        <span className="ml-auto hidden text-sm text-slate-400 md:block">
          Colombo metropolitan area · Sample positions
        </span>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <OperationsMap
            status={status}
            type={type}
            area={area}
            focusId={params.get('driver') || undefined}
          />
          <div className="flex flex-wrap items-center gap-5 px-5 py-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-600" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500" />
              On trip
            </span>
            <span className="ml-auto text-xs text-slate-400">
              Offline and suspended drivers are hidden
            </span>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="mb-3 text-sm font-semibold">
              Drivers on the map{' '}
              <span className="ml-1 text-slate-400">({filtered.length})</span>
            </h2>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Find a driver..."
            />
          </div>
          <div className="max-h-[510px] divide-y divide-slate-100 overflow-y-auto">
            {filtered.map((driver, i) => (
              <div
                key={driver.id}
                className={`p-4 ${params.get('driver') === driver.id ? 'bg-emerald-50/60' : ''}`}
              >
                <button
                  className="flex w-full items-center gap-3 text-left"
                  onClick={() => setParams({ driver: driver.id })}
                >
                  <Avatar name={driver.name} size="sm" index={i} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{driver.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {driver.vehicle} · {driver.plate}
                    </p>
                  </div>
                </button>
                <div className="mt-3 flex items-center justify-between">
                  <Badge>{driver.availability}</Badge>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    {driver.rating}
                  </span>
                  <Link
                    to={`/drivers/${driver.id}`}
                    className="text-xs font-medium text-emerald-700"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                No matching drivers.
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
