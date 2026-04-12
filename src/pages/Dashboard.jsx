import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Users, Banknote, AlertTriangle, ChevronRight, UserPlus } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency, formatDateTime, statusColor } from '@/lib/utils'

// ── Summary card ────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-3 md:p-5 flex items-center gap-3 md:gap-4">
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Queue token row ──────────────────────────────────────────────────────────
function TokenRow({ token }) {
  const statusMap = {
    WAITING:     'bg-yellow-100 text-yellow-800',
    CALLED:      'bg-amber-100 text-amber-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DONE:        'bg-green-100 text-green-800',
    SKIPPED:     'bg-gray-100 text-gray-500',
  }
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <span className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
        {token.tokenNumber}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{token.patientName}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(token.slotTime)}</p>
      </div>
      <Badge className={statusMap[token.status]}>{token.status}</Badge>
    </div>
  )
}

// ── Walk-in modal ────────────────────────────────────────────────────────────
function WalkInModal({ doctors }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ doctorId: '', patientPhone: '', patientName: '', visitType: 'WALK_IN' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (body) => api.post('/appointments/walkin', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['today'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
      setOpen(false)
      setForm({ doctorId: '', patientPhone: '', patientName: '', visitType: 'WALK_IN' })
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Walk-in failed'),
  })

  function submit(e) {
    e.preventDefault()
    setError('')
    mutation.mutate({ ...form, doctorId: Number(form.doctorId) })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><UserPlus className="h-4 w-4" /> Walk-in</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Register Walk-in Patient</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Doctor</label>
            <Select value={form.doctorId} onValueChange={(v) => setForm(f => ({ ...f, doctorId: v }))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>
                {doctors?.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>Dr. {d.name} — {d.specialization}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Patient Phone</label>
            <Input className="mt-1" placeholder="+91 9876543210" value={form.patientPhone}
              onChange={e => setForm(f => ({ ...f, patientPhone: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm font-medium">Patient Name <span className="text-muted-foreground text-xs">(if new)</span></label>
            <Input className="mt-1" placeholder="Full name" value={form.patientName}
              onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registering…' : 'Register'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore()
  const today = new Date().toISOString().split('T')[0]

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary', today],
    queryFn: () => api.get(`/admin/analytics/summary?from=${today}&to=${today}`).then(r => r.data),
  })

  const { data: todayAppts } = useQuery({
    queryKey: ['today'],
    queryFn: () => api.get('/appointments/today').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors').then(r => r.data),
  })

  // Queue: use first doctor if user is not a doctor themselves
  const queueDoctorId = user?.role === 'DOCTOR' ? user?.doctorId : doctors?.[0]?.id
  const { data: queue } = useQuery({
    queryKey: ['queue', queueDoctorId],
    queryFn: () => api.get(`/queue/${queueDoctorId}/today`).then(r => r.data),
    enabled: !!queueDoctorId,
    refetchInterval: 15_000,
  })

  const qc = useQueryClient()
  const callNext = useMutation({
    mutationFn: (id) => api.patch(`/queue/${id}/call-next`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue'] }),
  })

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <WalkInModal doctors={doctors} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Today's Appointments"
          value={todayAppts?.length ?? '—'}
          icon={CalendarClock}
          color="bg-blue-500"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(summary?.revenueCollected)}
          icon={Banknote}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Invoices"
          value={summary?.pendingInvoices ?? '—'}
          icon={AlertTriangle}
          color="bg-amber-500"
        />
        <StatCard
          title="No-show Rate"
          value={summary ? `${summary.noShowRatePct}%` : '—'}
          icon={Users}
          color="bg-red-500"
        />
      </div>

      {/* Queue + Today's list */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Live Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Queue</CardTitle>
              {queueDoctorId && (
                <Button size="sm" onClick={() => callNext.mutate(queueDoctorId)}
                  disabled={callNext.isPending}>
                  {callNext.isPending ? 'Calling…' : 'Call Next'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!queue?.length
              ? <p className="text-sm text-muted-foreground py-4 text-center">No tokens in queue</p>
              : queue.filter(t => t.status !== 'DONE' && t.status !== 'SKIPPED').map(t => (
                  <TokenRow key={t.id} token={t} />
                ))
            }
          </CardContent>
        </Card>

        {/* Today's appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Appointments</CardTitle>
              <a href="/appointments" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
                View all <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {!todayAppts?.length
              ? <p className="text-sm text-muted-foreground py-4 text-center">No appointments today</p>
              : todayAppts.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                  <span className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                    {a.tokenNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.patientName}</p>
                    <p className="text-xs text-muted-foreground">Dr. {a.doctorName} · {formatDateTime(a.slotTime)}</p>
                  </div>
                  <Badge className={cn('text-xs', statusColor(a.status))}>{a.status}</Badge>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
