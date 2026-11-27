import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Save,
  RotateCcw,
  ShieldCheck,
  Database,
  UserRound,
  Info,
} from 'lucide-react'
import { useStore, useUI } from '../../lib/store'
import {
  Avatar,
  Card,
  CardHeading,
  ConfirmAction,
  PageHeading,
} from '../../components/shared/common'
import { Button } from '../../components/ui/button'
import { useAuthentication } from '../auth/authentication-gate'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters.')
    .max(60, 'Use at most 60 characters.'),
  email: z.email('Enter a valid email address.'),
  timezone: z.string(),
  emailAlerts: z.boolean(),
  approvalAlerts: z.boolean(),
  dailySummary: z.boolean(),
})
type FormValues = z.infer<typeof schema>
export function SettingsPage() {
  const { user } = useAuthentication()
  const { settings, saveSettings, reset } = useStore()
  const notify = useUI((s) => s.notify)
  const [resetOpen, setResetOpen] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset: resetForm,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: settings,
  })
  return (
    <>
      <PageHeading
        title="Settings"
        description="Make this workspace work for you. Manage your profile and preferences."
      />
      <form
        onSubmit={handleSubmit((values) => {
          saveSettings(values)
          resetForm(values)
          notify('Preferences saved')
        })}
        className="grid items-start gap-6 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <Card>
            <CardHeading
              title="Profile details"
              description="Your administrator profile in this demo workspace"
            />
            <div className="space-y-5 px-5 pb-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <Avatar name={settings.name} size="lg" />
                <div>
                  <p className="text-sm font-semibold">{settings.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Workspace administrator
                  </p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="field-label">
                  Full name
                  <input
                    className="input mt-2"
                    {...register('name')}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span
                      role="alert"
                      className="mt-1 block text-sm text-red-600"
                    >
                      {errors.name.message}
                    </span>
                  )}
                </label>
                <label className="field-label">
                  Email address
                  <input
                    className="input mt-2"
                    {...register('email')}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span
                      role="alert"
                      className="mt-1 block text-sm text-red-600"
                    >
                      {errors.email.message}
                    </span>
                  )}
                </label>
              </div>
              <label className="field-label block">
                Time zone
                <select
                  className="select mt-2 w-full"
                  {...register('timezone')}
                >
                  <option value="Asia/Colombo">
                    Asia/Colombo (UTC +05:30)
                  </option>
                  <option value="UTC">UTC (UTC +00:00)</option>
                  <option value="Asia/Singapore">
                    Asia/Singapore (UTC +08:00)
                  </option>
                </select>
              </label>
              <p className="text-sm text-slate-400">
                Your preference is saved locally. Operational timestamps use
                Asia/Colombo for consistency.
              </p>
            </div>
          </Card>
          <Card>
            <CardHeading
              title="Notification preferences"
              description="Choose which updates matter most to you"
            />
            <div className="divide-y divide-slate-100 px-5 pb-3">
              {[
                {
                  name: 'emailAlerts' as const,
                  label: 'Operations alerts',
                  detail: 'Receive updates about fleet and account activity.',
                },
                {
                  name: 'approvalAlerts' as const,
                  label: 'Driver applications',
                  detail:
                    'Be notified when new applications are ready for review.',
                },
                {
                  name: 'dailySummary' as const,
                  label: 'Daily operations summary',
                  detail: 'A daily digest of rides, passengers, and revenue.',
                },
              ].map((item) => (
                <label
                  className="flex cursor-pointer items-center justify-between gap-6 py-5"
                  key={item.name}
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {item.detail}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="toggle"
                    {...register(item.name)}
                  />
                </label>
              ))}
            </div>
            <p className="px-5 pb-5 text-sm text-slate-400">
              Preferences are demonstrated locally; no emails or notifications
              are sent.
            </p>
          </Card>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty}
              onClick={() => resetForm(settings)}
            >
              Discard changes
            </Button>
            <Button type="submit" disabled={!isDirty}>
              <Save size={15} />
              Save changes
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeading title="Workspace information" />
            <div className="space-y-5 px-5 pb-5">
              <div className="flex gap-3">
                <UserRound size={17} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="mt-1 text-sm font-medium">Administrator</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck size={17} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Authentication</p>
                  <p className="mt-1 text-sm font-medium">Keycloak session</p>
                  <p className="mt-1 text-sm leading-5 text-slate-400">
                    Signed in as {user?.username || user?.name}. Realm role:
                    ADMIN.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Database size={17} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Data source</p>
                  <p className="mt-1 text-sm font-medium">
                    Browser local storage
                  </p>
                </div>
              </div>
            </div>
          </Card>
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeading
              title="Reset demo data"
              description="Start fresh with the original sample records."
            />
            <div className="px-5 pb-5">
              <p className="mb-4 text-sm leading-5 text-slate-500">
                This restores accounts, driver verification, preferences,
                notifications, and the audit log in this browser.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw size={14} />
                Reset demo
              </Button>
            </div>
          </Card>
          <div className="flex gap-2 px-1 text-sm leading-5 text-slate-400">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>
              HopOn Admin Web v1.0
              <br />
              Sample business data · Keycloak sign-in
            </p>
          </div>
        </div>
      </form>
      <ConfirmAction
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset this demo workspace?"
        description="All changes you made locally will be replaced with the original sample data. This cannot be undone."
        label="Reset demo data"
        dangerous
        onConfirm={() => {
          reset()
          resetForm(useStore.getState().settings)
          notify('Demo workspace restored')
        }}
      />
    </>
  )
}
