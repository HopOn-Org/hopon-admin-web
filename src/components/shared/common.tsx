import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  Search,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn, exportCsv, initials } from '../../lib/utils'
import { useUI } from '../../lib/store'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog'

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const text = String(children)
  const tone = [
    'Active',
    'Approved',
    'Completed',
    'Paid',
    'Available',
    'Verified',
  ].includes(text)
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
    : ['Pending', 'Requested', 'Accepted', 'On trip', 'Unverified'].includes(
          text,
        )
      ? 'bg-amber-50 text-amber-700 ring-amber-600/10'
      : ['Suspended', 'Rejected', 'Cancelled', 'Failed'].includes(text)
        ? 'bg-rose-50 text-rose-700 ring-rose-600/10'
        : 'bg-slate-100 text-slate-600 ring-slate-600/10'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium ring-1 ring-inset',
        tone,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-75" />
      {children}
    </span>
  )
}
export function Avatar({
  name,
  size = 'md',
  index = 0,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  index?: number
}) {
  const colors = [
    'bg-orange-100 text-orange-800',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-800',
    'bg-rose-100 text-rose-800',
    'bg-sky-100 text-sky-800',
  ]
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'lg'
          ? 'size-16 text-xl'
          : size === 'sm'
            ? 'size-8 text-sm'
            : 'size-10 text-sm',
        colors[index % colors.length],
      )}
    >
      {initials(name)}
    </div>
  )
}
export function PageHeading({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description: string
  actions?: ReactNode
  eyebrow?: string
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-sm font-semibold uppercase tracking-widest text-emerald-700">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200/90 bg-white shadow-xs',
        className,
      )}
    >
      {children}
    </section>
  )
}
export function CardHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
export function EmptyState({
  title = 'No results found',
  description = 'Try a different search or clear your filters.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-slate-100 p-4">
        <Search size={24} className="text-slate-400" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 mb-5 max-w-sm text-sm text-slate-500">{description}</p>
      {action}
    </div>
  )
}
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
      />
      <input
        className="input pr-9 pl-9"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
export function ExportButton({
  rows,
  filename = 'hopon-export.csv',
  label = 'Export',
}: {
  rows: Record<string, unknown>[]
  filename?: string
  label?: string
}) {
  const notify = useUI((s) => s.notify)
  return (
    <Button
      variant="outline"
      disabled={!rows.length}
      onClick={() => {
        exportCsv(filename, rows)
        notify('CSV export downloaded')
      }}
    >
      <Download size={15} />
      {label}
    </Button>
  )
}
export function DetailItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="border-b border-slate-100 py-3.5 last:border-0">
      <dt className="mb-1.5 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}
export function BackLink({
  to,
  children,
}: {
  to: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-700"
    >
      <span aria-hidden>‹</span>
      {children}
    </Link>
  )
}
export function ConfirmAction({
  open,
  onClose,
  title,
  description,
  label,
  onConfirm,
  dangerous = false,
  requireReason = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  label: string
  onConfirm: (reason: string) => void
  dangerous?: boolean
  requireReason?: boolean
}) {
  const [reason, setReason] = useState('')
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setReason('')
          onClose()
        }
      }}
      title={title}
      description={description}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (requireReason && reason.trim().length < 8) return
          onConfirm(reason.trim())
          setReason('')
          onClose()
        }}
      >
        <div
          className={cn(
            'mb-5 flex gap-3 rounded-lg p-3.5 text-sm',
            dangerous
              ? 'bg-amber-50 text-amber-900'
              : 'bg-emerald-50 text-emerald-900',
          )}
        >
          {dangerous ? (
            <AlertTriangle size={19} className="shrink-0" />
          ) : (
            <CheckCircle2 size={19} className="shrink-0" />
          )}
          <p>
            {dangerous
              ? 'This change will be recorded in the audit log. You can review it at any time.'
              : 'Confirm that you have reviewed the details before continuing.'}
          </p>
        </div>
        {requireReason && (
          <label className="field-label">
            Reason
            <textarea
              className="input mt-2 min-h-24 resize-y"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={8}
              maxLength={500}
              required
              placeholder="Add a reason (at least 8 characters)"
            />
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReason('')
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={dangerous ? 'destructive' : 'default'}
            disabled={requireReason && reason.trim().length < 8}
          >
            {label}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
export function Toast() {
  const { toast, clearToast } = useUI()
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(clearToast, 4000)
    return () => clearTimeout(id)
  }, [toast, clearToast])
  if (!toast) return null
  return (
    <div
      role="status"
      className="fixed right-5 bottom-5 z-[100] flex max-w-[calc(100%-2.5rem)] items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-sm shadow-lg"
    >
      <span className="rounded-full bg-emerald-100 p-1 text-emerald-700">
        <Check size={15} />
      </span>
      {toast}
      <button
        aria-label="Dismiss message"
        onClick={clearToast}
        className="ml-2 text-slate-400"
      >
        <X size={16} />
      </button>
    </div>
  )
}
