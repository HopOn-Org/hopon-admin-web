import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  seedAudit,
  seedDrivers,
  seedNotifications,
  seedPassengers,
  seedRides,
} from '../data/seed'
import type {
  AccountStatus,
  AuditEntry,
  Driver,
  Notification,
  Passenger,
  Ride,
  Settings,
  Verification,
} from '../types'

interface Store {
  drivers: Driver[]
  passengers: Passenger[]
  rides: Ride[]
  audit: AuditEntry[]
  notifications: Notification[]
  settings: Settings
  updateAccount: (
    kind: 'driver' | 'passenger',
    id: string,
    status: AccountStatus,
    reason: string,
  ) => void
  verifyDriver: (id: string, verification: Verification, reason: string) => void
  markRead: (id?: string) => void
  saveSettings: (settings: Settings) => void
  reset: () => void
}
const initial = {
  drivers: seedDrivers,
  passengers: seedPassengers,
  rides: seedRides,
  audit: seedAudit,
  notifications: seedNotifications,
  settings: {
    name: 'Alex Morgan',
    email: 'alex.morgan@hopon.lk',
    timezone: 'Asia/Colombo',
    emailAlerts: true,
    approvalAlerts: true,
    dailySummary: false,
  },
}
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initial,
      updateAccount: (kind, id, status, reason) => {
        const target = (
          kind === 'driver' ? get().drivers : get().passengers
        ).find((p) => p.id === id)
        if (!target) return
        const entry: AuditEntry = {
          id: crypto.randomUUID(),
          action: `Account ${status === 'Suspended' ? 'suspended' : 'reactivated'}`,
          target: target.name,
          actor: get().settings.name,
          time: new Date().toISOString(),
          category: 'Accounts',
          reason,
        }
        set((s) => ({
          ...(kind === 'driver'
            ? {
                drivers: s.drivers.map((d) =>
                  d.id === id
                    ? {
                        ...d,
                        status,
                        availability:
                          status === 'Suspended'
                            ? ('Offline' as const)
                            : d.availability,
                      }
                    : d,
                ),
              }
            : {
                passengers: s.passengers.map((p) =>
                  p.id === id ? { ...p, status } : p,
                ),
              }),
          audit: [entry, ...s.audit],
        }))
      },
      verifyDriver: (id, verification, reason) => {
        const driver = get().drivers.find((d) => d.id === id)
        if (
          !driver ||
          driver.verification !== 'Pending' ||
          verification === 'Pending'
        )
          return
        const entry: AuditEntry = {
          id: crypto.randomUUID(),
          action: `Driver ${verification.toLowerCase()}`,
          target: driver.name,
          actor: get().settings.name,
          time: new Date().toISOString(),
          category: 'Verification',
          reason,
        }
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id ? { ...d, verification } : d,
          ),
          audit: [entry, ...s.audit],
        }))
      },
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            !id || n.id === id ? { ...n, read: true } : n,
          ),
        })),
      saveSettings: (settings) =>
        set((s) => ({
          settings,
          audit: [
            {
              id: crypto.randomUUID(),
              action: 'Preferences updated',
              target: 'Admin preferences',
              actor: settings.name,
              time: new Date().toISOString(),
              category: 'Settings',
              reason: 'Updated profile and notification preferences.',
            },
            ...s.audit,
          ],
        })),
      reset: () => set(initial),
    }),
    { name: 'hopon-admin-demo', version: 1 },
  ),
)

interface UIStore {
  toast: string | null
  notify: (message: string) => void
  clearToast: () => void
}
export const useUI = create<UIStore>((set) => ({
  toast: null,
  notify: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}))
