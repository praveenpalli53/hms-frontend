import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, X, ChevronRight, Tv } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn, formatDateTime, statusColor } from '@/lib/utils'

function QueueControl() {
  const qc = useQueryClient()
  const [doctorId, setDoctorId] = useState('')

  const { data: doctors } = useQuery({
    queryKey: ['doctors-active'],
    queryFn: () => api.get('/doctors?activeOnly=true').then(r => r.data),
  })

  const { data: queue } = useQuery({
    queryKey: ['queue-control', doctorId],
    queryFn: () => api.get(`/queue/${doctorId}/today`).then(r => r.data),
    enabled: !!doctorId,
    refetchInterval: 8_000,
  })

  const current = queue?.find(t => t.status === 'IN_PROGRESS' || t.status === 'CALLED')
  const next    = queue?.filter(t => t.status === 'WAITING')?.[0] ?? null

  const callNext = useMutation({
    mutationFn: () => api.patch(`/queue/${doctorId}/call-next`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['queue-control', doctorId] }),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Queue Control</CardTitle>
          {doctorId && (
            <a href={`/tv/${doctorId}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Tv className="h-3.5 w-3.5" /> TV Display
            </a>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger><SelectValue placeholder="Select doctor…" /></SelectTrigger>
          <SelectContent>
            {doctors?.map(d => <SelectItem key={d.id} value={String(d.id)}>Dr. {d.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {doctorId && (
          <div className="grid grid-cols-2 gap-3">
            {/* Current */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
              <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">Now Serving</p>
              {current ? (
                <>
                  <p className="text-3xl font-black text-blue-700">#{current.tokenNumber}</p>
                  <p className="text-sm font-medium text-blue-800 mt-1 truncate">{current.patientName}</p>
                  <Badge className="mt-1 text-xs bg-blue-100 text-blue-700">{current.status}</Badge>
                </>
              ) : (
                <p className="text-sm text-blue-400 py-2">—</p>
              )}
            </div>

            {/* Next */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
              <p className="text-xs text-amber-500 font-semibold uppercase tracking-wide mb-1">Up Next</p>
              {next ? (
                <>
                  <p className="text-3xl font-black text-amber-600">#{next.tokenNumber}</p>
                  <p className="text-sm font-medium text-amber-800 mt-1 truncate">{next.patientName}</p>
                  <Badge className="mt-1 text-xs bg-amber-100 text-amber-700">WAITING</Badge>
                </>
              ) : (
                <p className="text-sm text-amber-400 py-2">No one waiting</p>
              )}
            </div>
          </div>
        )}

        {doctorId && (
          <Button className="w-full" onClick={() => callNext.mutate()}
            disabled={callNext.isPending || !next}>
            <ChevronRight className="h-4 w-4 mr-1" />
            {callNext.isPending ? 'Calling…' : 'Done — Call Next Patient'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const STATUSES = ['PENDING','CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW']
const NEXT_STATUS = {
  PENDING:     ['CONFIRMED','CANCELLED'],
  CONFIRMED:   ['CHECKED_IN','CANCELLED','NO_SHOW'],
  CHECKED_IN:  ['IN_PROGRESS','NO_SHOW'],
  IN_PROGRESS: ['COMPLETED'],
}

function AppointmentDetail({ appt, onClose }) {
  const qc = useQueryClient()
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelBox, setShowCancelBox] = useState(false)

  const updateStatus = useMutation({
    mutationFn: ({ status }) => api.patch(`/appointments/${appt.id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); onClose() },
  })
  const cancel = useMutation({
    mutationFn: () => api.post(`/appointments/${appt.id}/cancel`, { reason: cancelReason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); onClose() },
  })

  const nextStatuses = NEXT_STATUS[appt.status] ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-muted-foreground text-xs">Patient</p><p className="font-medium">{appt.patientName}</p></div>
        <div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium">{appt.patientPhone ?? '—'}</p></div>
        <div><p className="text-muted-foreground text-xs">Doctor</p><p className="font-medium">Dr. {appt.doctorName}</p></div>
        <div><p className="text-muted-foreground text-xs">Specialization</p><p className="font-medium">{appt.specializationName}</p></div>
        <div><p className="text-muted-foreground text-xs">Slot</p><p className="font-medium">{formatDateTime(appt.slotTime)}</p></div>
        <div><p className="text-muted-foreground text-xs">Token</p><p className="font-medium">#{appt.tokenNumber}</p></div>
        <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{appt.type ?? 'CONSULTATION'}</p></div>
        <div>
          <p className="text-muted-foreground text-xs">Status</p>
          <Badge className={cn('text-xs', statusColor(appt.status))}>{appt.status}</Badge>
        </div>
      </div>
      {appt.notes && (
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p>{appt.notes}</p>
        </div>
      )}

      {/* Action buttons */}
      {nextStatuses.filter(s => s !== 'CANCELLED').length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {nextStatuses.filter(s => s !== 'CANCELLED').map(s => (
            <Button key={s} size="sm" onClick={() => updateStatus.mutate({ status: s })}
              disabled={updateStatus.isPending}>
              → {s.replace('_', ' ')}
            </Button>
          ))}
        </div>
      )}

      {/* Cancel */}
      {nextStatuses.includes('CANCELLED') && !showCancelBox && (
        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowCancelBox(true)}>
          Cancel Appointment
        </Button>
      )}
      {showCancelBox && (
        <div className="space-y-2">
          <Input placeholder="Reason for cancellation (optional)"
            value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCancelBox(false)}>Back</Button>
            <Button variant="destructive" size="sm" onClick={() => cancel.mutate()}
              disabled={cancel.isPending}>Confirm Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Appointments() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', date],
    queryFn: () => api.get(`/appointments?from=${date}&to=${date}`).then(r => r.data),
  })

  const filtered = (appointments ?? []).filter(a => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter
    const matchSearch = !search || [a.patientName, a.doctorName, String(a.tokenNumber)]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchStatus && matchSearch
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Appointments</h1>
      </div>

      <QueueControl />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input type="date" className="w-40" value={date} onChange={e => setDate(e.target.value)} />
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search patient / doctor…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter !== 'ALL') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('ALL') }}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Loading…</p>
          ) : !filtered.length ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No appointments found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Doctor</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Slot</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.tokenNumber}</td>
                    <td className="px-4 py-3 font-medium">{a.patientName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Dr. {a.doctorName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDateTime(a.slotTime)}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs', statusColor(a.status))}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(a)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment #{selected?.tokenNumber}</DialogTitle>
          </DialogHeader>
          {selected && <AppointmentDetail appt={selected} onClose={() => setSelected(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
