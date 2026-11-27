import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CarFront, Bike, Navigation, ArrowUpRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Driver } from '../../types'
import { useStore } from '../../lib/store'
import {
  Avatar,
  Badge,
  Card,
  ExportButton,
  PageHeading,
  SearchInput,
} from '../../components/shared/common'
import { DataTable } from '../../components/shared/data-table'
import { Button } from '../../components/ui/button'

export function VehiclesPage() {
  const drivers = useStore((s) => s.drivers)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const filtered = drivers.filter(
    (d) =>
      `${d.vehicle} ${d.plate} ${d.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (type === 'All' || d.vehicleType === type) &&
      (status === 'All' || d.verification === status),
  )
  const columns: ColumnDef<Driver, unknown>[] = [
    {
      accessorKey: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-slate-50 p-3 text-slate-400">
            <CarFront size={24} />
          </span>
          <div className="font-medium">
            {row.original.vehicle}
            <p className="mt-1 text-sm font-normal text-slate-400">
              2022 · {row.index % 2 ? 'White' : 'Silver'}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'plate',
      header: 'License plate',
      cell: ({ row }) => (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-sm font-medium">
          {row.original.plate}
        </span>
      ),
    },
    { accessorKey: 'vehicleType', header: 'Type' },
    {
      accessorKey: 'name',
      header: 'Registered driver',
      cell: ({ row }) => (
        <Link
          to={`/drivers/${row.original.id}`}
          className="flex items-center gap-2 hover:text-emerald-700"
        >
          <Avatar name={row.original.name} size="sm" index={row.index} />
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'verification',
      header: 'Verification',
      cell: ({ row }) => <Badge>{row.original.verification}</Badge>,
    },
    { accessorKey: 'area', header: 'Service area' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button asChild variant="ghost" size="icon">
          <Link
            aria-label={`View vehicle for ${row.original.name}`}
            to={`/drivers/${row.original.id}`}
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
        title="Vehicles"
        description="Your fleet, organized. View vehicles and their registered drivers."
        actions={
          <ExportButton
            filename="hopon-vehicles.csv"
            rows={filtered.map((d) => ({
              Plate: d.plate,
              Vehicle: d.vehicle,
              Type: d.vehicleType,
              Driver: d.name,
              Verification: d.verification,
              Area: d.area,
            }))}
          />
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { name: 'Car', icon: CarFront, color: 'bg-blue-50 text-blue-700' },
          {
            name: 'Tuk',
            icon: Navigation,
            color: 'bg-emerald-50 text-emerald-700',
          },
          { name: 'Bike', icon: Bike, color: 'bg-amber-50 text-amber-700' },
        ].map((v) => (
          <button
            key={v.name}
            onClick={() => setType(type === v.name ? 'All' : v.name)}
            className={`flex items-center gap-4 rounded-xl border bg-white p-5 text-left shadow-xs transition-colors ${type === v.name ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-300'}`}
          >
            <span className={`rounded-xl p-3 ${v.color}`}>
              <v.icon size={24} />
            </span>
            <div>
              <p className="text-sm text-slate-500">
                {v.name === 'Tuk' ? 'Tuk-tuks' : `${v.name}s`}
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {drivers.filter((d) => d.vehicleType === v.name).length}
              </p>
            </div>
          </button>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search vehicle, plate, or driver..."
          />
          <div className="flex gap-2">
            <select
              aria-label="Vehicle verification"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All verification</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
            <select
              aria-label="Vehicle category"
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="All">All types</option>
              <option>Car</option>
              <option>Tuk</option>
              <option>Bike</option>
            </select>
          </div>
        </div>
        <DataTable
          key={`${search}-${type}-${status}`}
          data={filtered}
          columns={columns}
          noun="vehicles"
        />
      </Card>
    </>
  )
}
