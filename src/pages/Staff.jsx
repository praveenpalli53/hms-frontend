import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ROLES = ['ADMIN','RECEPTIONIST','NURSE','DOCTOR']

function StaffForm({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'RECEPTIONIST' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (body) => api.post('/admin/users', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); onClose() },
    onError: (err) => setError(err.response?.data?.message ?? 'Failed to create'),
  })

  function submit(e) {
    e.preventDefault()
    setError('')
    mutation.mutate(form)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {[['name','Full Name','text'],['email','Email','email'],
        ['phone','Phone','tel'],['password','Temporary Password','password']].map(([f, l, t]) => (
        <div key={f}>
          <label className="text-sm font-medium">{l}</label>
          <Input className="mt-1" type={t} required value={form[f]}
            onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
        </div>
      ))}
      <div>
        <label className="text-sm font-medium">Role</label>
        <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create Staff'}
        </Button>
      </div>
    </form>
  )
}

export default function Staff() {
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()

  const { data: staff } = useQuery({
    queryKey: ['staff', roleFilter],
    queryFn: () => {
      const q = roleFilter !== 'ALL' ? `?role=${roleFilter}` : ''
      return api.get(`/admin/users${q}`).then(r => r.data)
    },
  })

  const toggle = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Staff Management</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>
      </div>

      <div className="flex gap-1.5">
        {['ALL', ...ROLES].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              roleFilter === r ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {r}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {!staff?.length ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No staff found</td></tr>
              ) : staff.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{s.phone}</td>
                  <td className="px-4 py-3">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">{s.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                      {s.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => toggle.mutate(s.id)}>
                      {s.active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <StaffForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
