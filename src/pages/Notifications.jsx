import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'

export default function Notifications() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => api.get(`/notifications?userId=${user?.id}`).then(r => r.data),
    enabled: !!user?.id,
  })

  const markAll = useMutation({
    mutationFn: () => api.post(`/notifications/mark-all-read?userId=${user?.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = (notifications ?? []).filter(n => !n.read).length

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          {unread > 0 && <p className="text-sm text-muted-foreground">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {!notifications?.length ? (
            <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : notifications.map(n => (
            <div
              key={n.id}
              className={cn('flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer hover:bg-muted/30',
                !n.read && 'bg-blue-50/60')}
              onClick={() => !n.read && markOne.mutate(n.id)}
            >
              <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0 transition-opacity',
                n.read ? 'opacity-0' : 'bg-primary')} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !n.read && 'font-medium')}>{n.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
