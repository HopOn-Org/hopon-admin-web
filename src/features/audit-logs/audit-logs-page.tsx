import { useState } from 'react'
import { ShieldCheck, Eye } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { AuditEntry } from '../../types'
import { useStore } from '../../lib/store'
import { formatDate } from '../../lib/utils'
import {
  Avatar,
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

export function AuditLogsPage() {
  const audit = useStore((s) => s.audit)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<AuditEntry | null>(null)
  const filtered = audit.filter(
    (a) =>
      `${a.action} ${a.target} ${a.actor} ${a.reason}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (category === 'All' || a.category === category),
  )
  const columns: ColumnDef<AuditEntry, unknown>[] = [
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <ShieldCheck size={15} />
          </span>
          <span className="font-medium">{row.original.action}</span>
        </div>
      ),
    },
    { accessorKey: 'target', header: 'Affected resource' },
    {
      accessorKey: 'actor',
      header: 'Administrator',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar name={row.original.actor} size="sm" />
          {row.original.actor}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge>{row.original.category}</Badge>,
    },
    {
      accessorKey: 'time',
      header: 'Date & time',
      cell: ({ row }) => (
        <div className="text-slate-500">
          {formatDate(row.original.time)}
          <p className="mt-1 text-sm text-slate-400">
            {new Date(row.original.time).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Colombo',
            })}{' '}
            · Asia/Colombo
          </p>
        </div>
      ),
    },
    {
      id: 'details',
      header: '',
      cell: ({ row }) => (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`View audit entry: ${row.original.action}`}
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
        title="Audit logs"
        description="Every action leaves a trail. Review administrative activity across HopOn."
        actions={
          <ExportButton
            filename="hopon-audit-logs.csv"
            rows={filtered.map((a) => ({
              ID: a.id,
              Action: a.action,
              Resource: a.target,
              Administrator: a.actor,
              Category: a.category,
              Timestamp: a.time,
              Reason: a.reason,
            }))}
          />
        }
      />
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
        <ShieldCheck size={19} className="shrink-0 text-blue-600" />
        <p className="text-sm leading-5 text-blue-900">
          Account changes, driver verification decisions, and preference updates
          made in this demo are recorded here. Entries are stored locally in
          your browser.
        </p>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search actions, people, or reasons..."
          />
          <select
            className="select"
            aria-label="Audit category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All categories</option>
            <option>Accounts</option>
            <option>Verification</option>
            <option>Settings</option>
            <option>Payments</option>
          </select>
        </div>
        <DataTable
          key={`${search}-${category}`}
          columns={columns}
          data={filtered}
          noun="events"
        />
      </Card>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title="Audit entry"
        description="Details of this administrative action."
      >
        {selected && (
          <dl>
            <DetailItem label="Action">{selected.action}</DetailItem>
            <DetailItem label="Affected resource">{selected.target}</DetailItem>
            <DetailItem label="Administrator">{selected.actor}</DetailItem>
            <DetailItem label="Category">{selected.category}</DetailItem>
            <DetailItem label="Reason">{selected.reason}</DetailItem>
            <DetailItem label="Timestamp">
              {new Date(selected.time).toLocaleString('en-GB', {
                timeZone: 'Asia/Colombo',
              })}{' '}
              (Asia/Colombo)
            </DetailItem>
            <DetailItem label="Event ID">
              <span className="break-all font-mono text-sm">{selected.id}</span>
            </DetailItem>
          </dl>
        )}
      </Dialog>
    </>
  )
}
