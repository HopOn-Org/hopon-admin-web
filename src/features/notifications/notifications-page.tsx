import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useStore } from '../../lib/store'
import { Card, PageHeading } from '../../components/shared/common'
import { Button } from '../../components/ui/button'

export function NotificationsPage() {
  const { notifications, markRead } = useStore()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <>
      <PageHeading
        title="Notifications"
        description={`Stay up to date with your operations. ${unread} unread notification${unread === 1 ? '' : 's'}.`}
        actions={
          <Button
            disabled={!unread}
            variant="outline"
            onClick={() => markRead()}
          >
            <CheckCheck size={16} />
            Mark all as read
          </Button>
        }
      />
      <Card>
        <div className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-5 ${n.read ? '' : 'bg-brand-50/30'}`}
            >
              <span
                className={`rounded-xl p-3 ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-brand-100 text-brand-700'}`}
              >
                <Bell size={19} />
              </span>
              <div className="flex-1">
                <Link
                  to={n.link}
                  onClick={() => markRead(n.id)}
                  className="text-sm font-semibold hover:text-brand-700"
                >
                  {n.title}
                </Link>
                <p className="mt-2 text-sm text-slate-500">{n.message}</p>
                <p className="mt-2 text-sm text-slate-400">{n.time}</p>
              </div>
              {!n.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markRead(n.id)}
                >
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
