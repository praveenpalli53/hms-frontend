import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, CreditCard, Search } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency, formatDate, statusColor } from '@/lib/utils'

const PAYMENT_METHODS = ['CASH','CARD','UPI','INSURANCE','ONLINE']

function PaymentModal({ invoice, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ method: 'CASH', amount: invoice.total - (invoice.paidAmount ?? 0), transactionId: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (body) => api.post(`/billing/invoices/${invoice.id}/payment`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); onClose() },
    onError: (err) => setError(err.response?.data?.message ?? 'Payment failed'),
  })

  return (
    <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate(form) }} className="space-y-4">
      <div className="rounded-md bg-muted p-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-muted-foreground">Invoice</span><span className="font-mono">{invoice.invoiceNumber}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{invoice.patientName}</span></div>
        <div className="flex justify-between font-semibold"><span>Total Due</span><span>{formatCurrency(invoice.total)}</span></div>
      </div>
      <div>
        <label className="text-sm font-medium">Payment Method</label>
        <Select value={form.method} onValueChange={v => setForm(f => ({ ...f, method: v }))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Amount (₹)</label>
        <Input className="mt-1" type="number" step="0.01" required
          value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} />
      </div>
      <div>
        <label className="text-sm font-medium">Transaction ID <span className="text-muted-foreground text-xs">(optional)</span></label>
        <Input className="mt-1" placeholder="Txn / reference number"
          value={form.transactionId} onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending ? 'Processing…' : 'Record Payment'}
        </Button>
      </div>
    </form>
  )
}

export default function Billing() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [payModal, setPayModal] = useState(null)

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
      return api.get(`/billing/invoices${params}`).then(r => r.data)
    },
  })

  const filtered = (invoices ?? []).filter(inv =>
    !search || [inv.invoiceNumber, inv.patientName, inv.doctorName]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold">Billing</h1>

      <div className="flex gap-3 flex-wrap">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['ALL','PENDING','PAID','CANCELLED','REFUNDED'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Loading…</p>
          ) : !filtered.length ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No invoices found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                  <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Doctor</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium">{inv.patientName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">Dr. {inv.doctorName}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn('text-xs', statusColor(inv.status))}>{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {inv.status === 'PENDING' && (
                          <Button variant="outline" size="sm" onClick={() => setPayModal(inv)}>
                            <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
                          </Button>
                        )}
                        <Button variant="ghost" size="sm"
                          onClick={() => window.open(`/api/billing/invoices/${inv.id}/pdf`, '_blank')}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!payModal} onOpenChange={() => setPayModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {payModal && <PaymentModal invoice={payModal} onClose={() => setPayModal(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
