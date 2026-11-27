import { useState, useRef, useEffect } from 'react'
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CarFront,
  MapPinned,
  Route,
  Wallet,
  ChartNoAxesCombined,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Menu,
  CircleHelp,
  ArrowUpRight,
  Command,
  Radio,
  CheckCheck,
  LogOut,
} from 'lucide-react'
import { useStore } from '../../lib/store'
import { Avatar, Badge, Toast } from '../../components/shared/common'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { useAuthentication } from '../../features/auth/authentication-gate'
import { logout } from '../../lib/keycloak/authentication'

const navigation = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Live operations', path: '/live-map', icon: MapPinned },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Passengers', path: '/passengers', icon: Users },
      { label: 'Drivers', path: '/drivers', icon: ShieldCheck },
      { label: 'Vehicles', path: '/vehicles', icon: CarFront },
      { label: 'Rides', path: '/rides', icon: Route },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Payments', path: '/payments', icon: Wallet },
      {
        label: 'Reports & analytics',
        path: '/reports',
        icon: ChartNoAxesCombined,
      },
      { label: 'Audit logs', path: '/audit-logs', icon: ShieldCheck },
    ],
  },
]
export function AdminLayout() {
  const { user } = useAuthentication()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [search, setSearch] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { drivers, passengers, notifications, markRead, settings } = useStore()
  const pending = drivers.filter((d) => d.verification === 'Pending').length
  const unread = notifications.filter((n) => !n.read).length
  const notificationRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen((v) => !v)
      }
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setNotificationsOpen(false)
      }
    }
    const outside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      )
        setNotificationsOpen(false)
    }
    document.addEventListener('keydown', handler)
    document.addEventListener('mousedown', outside)
    return () => {
      document.removeEventListener('keydown', handler)
      document.removeEventListener('mousedown', outside)
    }
  }, [])
  const current = [
    ...navigation.flatMap((group) => group.items),
    { label: 'Settings', path: '/settings' },
    { label: 'Notifications', path: '/notifications' },
  ].find((item) => location.pathname.startsWith(item.path))
  const searchResults = search.trim()
    ? [
        ...drivers.map((d) => ({
          label: d.name,
          type: 'Driver',
          path: `/drivers/${d.id}`,
          id: d.id,
        })),
        ...passengers.map((p) => ({
          label: p.name,
          type: 'Passenger',
          path: `/passengers/${p.id}`,
          id: p.id,
        })),
      ]
        .filter((item) =>
          `${item.label} ${item.id}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .slice(0, 6)
    : []
  return (
    <div className="min-h-screen bg-[#f7f9fa]">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <Link
          to="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex h-[88px] items-center gap-3 px-7"
        >
          <img src="/logo.png" alt="HopOn" className="size-[76px] shrink-0 object-contain" />
          <span className="mt-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-slate-500">
            ADMIN
          </span>
        </Link>
        <div className="mx-4 mb-7 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <CarFront size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">HopOn Sri Lanka</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Operations workspace
            </p>
          </div>
          <Badge className="px-1.5 text-xs">Demo</Badge>
        </div>
        <nav className="flex-1 space-y-6 px-4" aria-label="Main navigation">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[1.5px] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? 'nav-item-active' : ''}`
                    }
                  >
                    <item.icon size={18} strokeWidth={1.7} />
                    <span className="flex-1">{item.label}</span>
                    {item.path === '/drivers' && pending > 0 && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                        {pending}
                      </span>
                    )}
                    {item.path === '/live-map' && (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-6 border-t border-slate-100 px-4 py-4">
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <Settings size={18} strokeWidth={1.7} />
            Settings
          </NavLink>
          <button
            className="nav-item w-full"
            onClick={() => {
              setHelpOpen(true)
              setMobileOpen(false)
            }}
          >
            <CircleHelp size={18} strokeWidth={1.7} />
            Help & resources
            <ArrowUpRight size={14} className="ml-auto" />
          </button>
          <button className="nav-item w-full" onClick={() => void logout()}>
            <LogOut size={18} strokeWidth={1.7} />
            Sign out
          </button>
        </div>
        <Link
          to="/settings"
          className="mx-4 mb-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3"
        >
          <Avatar
            name={user?.name || settings.name}
            src={user?.photoUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.name || settings.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Administrator</p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </Link>
      </aside>
      <div className="lg:ml-[244px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </Button>
            <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
              <span>Workspace</span>
              <span>/</span>
              <span className="font-medium text-slate-700">
                {current?.label || 'Page not found'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-slate-400 md:min-w-52"
              aria-label="Search workspace"
            >
              <Search size={17} />
              <span className="hidden text-sm md:block">
                Search anything...
              </span>
              <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-slate-200 px-1 py-0.5 text-xs md:flex">
                <Command size={10} />K
              </kbd>
            </button>
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <span className="hidden items-center gap-1.5 text-sm text-slate-500 xl:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Demo workspace
            </span>
            <div className="relative" ref={notificationRef}>
              <button
                aria-label={`Notifications, ${unread} unread`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-orange-500 ring-2 ring-white" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute top-12 right-[-48px] w-[min(360px,calc(100vw-32px))] rounded-xl border border-slate-200 bg-white shadow-xl sm:right-0">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h2 className="text-sm font-semibold">Notifications</h2>
                    <button
                      onClick={() => markRead()}
                      className="text-sm text-emerald-700"
                      aria-label="Mark all as read"
                    >
                      <CheckCheck size={17} />
                    </button>
                  </div>
                  {notifications.map((n) => (
                    <Link
                      onClick={() => {
                        markRead(n.id)
                        setNotificationsOpen(false)
                      }}
                      key={n.id}
                      to={n.link}
                      className={`block border-b border-slate-100 p-4 hover:bg-slate-50 ${!n.read ? 'bg-emerald-50/40' : ''}`}
                    >
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500">
                        {n.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">{n.time}</p>
                    </Link>
                  ))}
                  <Link
                    to="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="block p-3 text-center text-sm font-medium text-emerald-700"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
            <Link to="/settings" aria-label="Account settings">
              <Avatar
                name={user?.name || settings.name}
                src={user?.photoUrl}
                size="sm"
              />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1680px] px-5 py-7 md:px-8 md:py-8">
          <Outlet />
        </main>
        <footer className="mx-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-400 md:mx-8">
          <p>© 2026 HopOn. Every journey, connected.</p>
          <p className="flex items-center gap-1.5">
            <Radio size={12} />
            Frontend demo · Sample data
          </p>
        </footer>
      </div>
      <Dialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search workspace"
        description="Find a passenger, driver, or page."
      >
        <div className="relative">
          <Search size={18} className="absolute top-3 left-3 text-slate-400" />
          <input
            autoFocus
            className="input pl-10"
            placeholder="Search names or IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-3 space-y-1">
          {search.trim() ? (
            searchResults.length ? (
              searchResults.map((result) => (
                <button
                  key={result.id}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
                  onClick={() => {
                    navigate(result.path)
                    setSearchOpen(false)
                    setSearch('')
                  }}
                >
                  <Avatar name={result.label} size="sm" />
                  <span className="flex-1 text-sm font-medium">
                    {result.label}
                    <span className="mt-1 block text-sm font-normal text-slate-500">
                      {result.id}
                    </span>
                  </span>
                  <span className="text-sm text-slate-400">{result.type}</span>
                </button>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                No matching people. Try a different name or ID.
              </p>
            )
          ) : (
            navigation
              .flatMap((group) => group.items)
              .map((item) => (
                <button
                  key={item.path}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm text-slate-600 hover:bg-slate-50"
                  onClick={() => {
                    navigate(item.path)
                    setSearchOpen(false)
                  }}
                >
                  <item.icon size={17} />
                  {item.label}
                </button>
              ))
          )}
        </div>
      </Dialog>
      <Dialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Welcome to your operations workspace"
        description="Everything you need to explore the HopOn frontend."
      >
        <div className="space-y-5 text-sm leading-6 text-slate-600">
          <p>
            Browse passengers and drivers, review sample driver documents,
            monitor simulated driver positions, and inspect rides and payments.
          </p>
          <p>
            Search, filters, CSV exports, account actions, and settings work
            locally. Changes are saved in this browser. You can restore the
            sample data from Settings.
          </p>
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-900">
            Sign-in is managed by Keycloak. Fleet and business data remain local
            samples; Google Maps, payment providers, and backend APIs are not
            connected.
          </div>
          <p className="text-sm">
            Tip: press Ctrl / ⌘ + K to search the workspace.
          </p>
        </div>
      </Dialog>
      <Toast />
    </div>
  )
}
