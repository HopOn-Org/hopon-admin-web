import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Banknote, Wallet, Eye, ReceiptText } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Ride } from '../../types'
import { useStore } from '../../lib/store'
import { formatDate, money } from '../../lib/utils'
import {
  Badge,
  Card,
  DetailItem,
  ExportButton,
  PageHeading,
  SearchInput,
} from '../../components/shared/common'
import { DataTable } from '../../components/shared/data-table'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'

export function PaymentsPage() {
  const { rides, passengers, drivers } = useStore()
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('All')
  const [status, setStatus] = useState('All')
  const [selected, setSelected] = useState<Ride | null>(null)
  const transactions = rides.filter((r) =>
    ['Completed', 'Cancelled'].includes(r.status),
  )
  const completed = transactions.filter((r) => r.status === 'Completed')
  const filtered = transactions.filter(
    (r) =>
      `${r.id} TX-${r.id.slice(3)} ${passengers.find((p) => p.id === r.passengerId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (method === 'All' || r.method === method) &&
      (status === 'All' ||
        (status === 'Paid'
          ? r.status === 'Completed'
          : r.status === 'Cancelled')),
  )
  const columns: ColumnDef<Ride, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'Transaction',
      cell: ({ row }) => (
        <button
          className="text-left font-medium text-brand-700"
          onClick={() => setSelected(row.original)}
        >
          TX-{row.original.id.slice(3)}
          <p className="mt-1 text-sm font-normal text-slate-400">
            {formatDate(row.original.date)} · {row.original.time}
          </p>
        </button>
      ),
    },
    {
      accessorKey: 'passengerId',
      header: 'Passenger',
      cell: ({ row }) =>
        passengers.find((p) => p.id === row.original.passengerId)?.name,
    },
    {
      id: 'ride',
      header: 'Ride',
      cell: ({ row }) => (
        <Link
          to={`/rides/${row.original.id}`}
          className="text-slate-500 hover:text-brand-700"
        >
          {row.original.id}
        </Link>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          {row.original.method === 'Card' ? (
            <CreditCard size={16} className="text-slate-400" />
          ) : (
            <Banknote size={16} className="text-slate-400" />
          )}
          {row.original.method}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge>
          {row.original.status === 'Completed' ? 'Paid' : 'Cancelled'}
        </Badge>
      ),
    },
    {
      accessorKey: 'fare',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-semibold">
          {money(row.original.status === 'Cancelled' ? 0 : row.original.fare)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          aria-label={`View transaction TX-${row.original.id.slice(3)}`}
          variant="ghost"
          size="icon"
          onClick={() => setSelected(row.original)}
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ]
  return (
    <>
      <PageHeading
        title="Payments"
        description="A clear view of every transaction and every rupee."
        actions={
          <ExportButton
            filename="hopon-transactions.csv"
            rows={filtered.map((r) => ({
              Transaction: `TX-${r.id.slice(3)}`,
              Ride: r.id,
              Passenger: passengers.find((p) => p.id === r.passengerId)?.name,
              Method: r.method,
              Amount: r.status === 'Cancelled' ? 0 : r.fare,
              Status: r.status === 'Completed' ? 'Paid' : 'Cancelled',
              Date: r.date,
            }))}
          />
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Total collected',
            value: completed.reduce((s, r) => s + r.fare, 0),
            icon: Wallet,
            color: 'bg-brand-50 text-brand-700',
          },
          {
            label: 'Card payments',
            value: completed
              .filter((r) => r.method === 'Card')
              .reduce((s, r) => s + r.fare, 0),
            icon: CreditCard,
            color: 'bg-indigo-50 text-indigo-600',
          },
          {
            label: 'Cash payments',
            value: completed
              .filter((r) => r.method === 'Cash')
              .reduce((s, r) => s + r.fare, 0),
            icon: Banknote,
            color: 'bg-amber-50 text-amber-700',
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{s.label}</p>
              <span className={`rounded-lg p-2 ${s.color}`}>
                <s.icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {money(s.value)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Sample transaction history · LKR
            </p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search transaction, ride, or name..."
          />
          <div className="flex gap-2">
            <select
              className="select"
              aria-label="Payment method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="All">All methods</option>
              <option>Card</option>
              <option>Cash</option>
            </select>
            <select
              className="select"
              aria-label="Payment status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All statuses</option>
              <option>Paid</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>
        <DataTable
          key={`${search}-${method}-${status}`}
          columns={columns}
          data={filtered}
          noun="transactions"
        />
      </Card>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={`Transaction TX-${selected?.id.slice(3) || ''}`}
        description="Payment information from the local sample dataset."
      >
        {selected && (
          <>
            <div className="mb-3 flex flex-col items-center rounded-xl bg-slate-50 p-6">
              <ReceiptText size={30} className="mb-3 text-brand-700" />
              <p className="text-3xl font-semibold">
                {money(selected.status === 'Cancelled' ? 0 : selected.fare)}
              </p>
              <div className="mt-3">
                <Badge>
                  {selected.status === 'Completed' ? 'Paid' : 'Cancelled'}
                </Badge>
              </div>
            </div>
            <dl>
              <DetailItem label="Ride">
                <Link to={`/rides/${selected.id}`} className="text-brand-700">
                  {selected.id}
                </Link>
              </DetailItem>
              <DetailItem label="Passenger">
                {passengers.find((p) => p.id === selected.passengerId)?.name}
              </DetailItem>
              <DetailItem label="Driver">
                {drivers.find((d) => d.id === selected.driverId)?.name}
              </DetailItem>
              <DetailItem label="Payment method">
                {selected.method === 'Card'
                  ? 'Card · Visa ending 4242 (sample)'
                  : 'Cash collected by driver'}
              </DetailItem>
              <DetailItem label="Date">
                {formatDate(selected.date)} at {selected.time}
              </DetailItem>
            </dl>
            <p className="mt-4 text-sm text-slate-400">
              This is a sample transaction. No real payment has been processed.
            </p>
          </>
        )}
      </Dialog>
    </>
  )
}
