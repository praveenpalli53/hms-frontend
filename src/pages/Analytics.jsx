import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2']

function SummaryCards({ data }) {
  if (!data) return null
  const cards = [
    { label: 'Total Appointments', value: data.totalAppointments },
    { label: 'Completed', value: data.completedAppointments },
    { label: 'Cancellation Rate', value: `${data.cancellationRatePct}%` },
    { label: 'No-show Rate', value: `${data.noShowRatePct}%` },
    { label: 'Revenue Collected', value: formatCurrency(data.revenueCollected) },
    { label: 'Pending Invoices', value: data.pendingInvoices },
    { label: 'Avg Wait Time', value: data.avgWaitMinutes != null ? `${data.avgWaitMinutes} min` : '—' },
    { label: 'Revenue Pending', value: formatCurrency(data.revenuePending) },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function Analytics() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0]
  const [from, setFrom] = useState(thirtyAgo)
  const [to, setTo] = useState(today)

  const params = `from=${from}&to=${to}`

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary', from, to],
    queryFn: () => api.get(`/admin/analytics/summary?${params}`).then(r => r.data),
  })
  const { data: daily } = useQuery({
    queryKey: ['analytics', 'daily', from, to],
    queryFn: () => api.get(`/admin/analytics/appointments-by-day?${params}`).then(r => r.data),
  })
  const { data: revDept } = useQuery({
    queryKey: ['analytics', 'revdept', from, to],
    queryFn: () => api.get(`/admin/analytics/revenue-by-department?${params}`).then(r => r.data),
  })
  const { data: utilization } = useQuery({
    queryKey: ['analytics', 'util', from, to],
    queryFn: () => api.get(`/admin/analytics/doctor-utilization?${params}`).then(r => r.data),
  })
  const { data: noshow } = useQuery({
    queryKey: ['analytics', 'noshow', from, to],
    queryFn: () => api.get(`/admin/analytics/no-show-rate?${params}`).then(r => r.data),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">From</span>
          <Input type="date" className="w-36 h-8" value={from} onChange={e => setFrom(e.target.value)} />
          <span className="text-muted-foreground">To</span>
          <Input type="date" className="w-36 h-8" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards data={summary} />

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Line chart — daily appointments */}
        <Card>
          <CardHeader><CardTitle>Appointments per Day</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={daily?.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Appointments']} labelFormatter={l => `Date: ${l}`} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar chart — revenue by department */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue by Department</CardTitle>
              {revDept?.grandTotal != null && (
                <span className="text-sm font-semibold">{formatCurrency(revDept.grandTotal)}</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revDept?.departments ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="specialization" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revDept?.departments?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Doctor utilization table */}
      <Card>
        <CardHeader><CardTitle>Doctor Utilization</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3 font-medium">Doctor</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Specialization</th>
                <th className="text-left px-4 py-3 font-medium">Bookings</th>
                <th className="text-left px-4 py-3 font-medium">No-shows</th>
                <th className="text-left px-4 py-3 font-medium">No-show Rate</th>
              </tr>
            </thead>
            <tbody>
              {!utilization?.doctors?.length
                ? <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">No data</td></tr>
                : utilization.doctors.map(d => (
                  <tr key={d.doctorId} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{d.doctorName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.specialization}</td>
                    <td className="px-4 py-3">{d.bookings}</td>
                    <td className="px-4 py-3 text-red-600">{d.noShows}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(d.noShowRatePct, 100)}%` }} />
                        </div>
                        <span className="text-xs">{d.noShowRatePct}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* No-show summary */}
      {noshow && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>No-show Rate Summary</CardTitle>
              <span className="text-sm font-semibold text-red-600">{noshow.overallRatePct}% overall</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {noshow.totalNoShows} no-shows out of {noshow.totalAppointments} appointments in selected range.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
