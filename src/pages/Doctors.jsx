import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

function DoctorForm({ doctor, specializations, onSuccess, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!doctor
  const [form, setForm] = useState({
    name: doctor?.name ?? '',
    email: doctor?.email ?? '',
    phone: doctor?.phone ?? '',
    password: '',
    specializationId: doctor?.specializationId ? String(doctor.specializationId) : '',
    qualification: doctor?.qualification ?? '',
    consultationFee: doctor?.consultationFee ?? '',
    bio: doctor?.bio ?? '',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (body) => isEdit
      ? api.put(`/admin/doctors/${doctor.id}`, body)
      : api.post('/admin/doctors', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); onSuccess?.() },
    onError: (err) => setError(err.response?.data?.message ?? 'Failed to save'),
  })

  function submit(e) {
    e.preventDefault()
    setError('')
    mutation.mutate({ ...form, specializationId: Number(form.specializationId), consultationFee: Number(form.consultationFee) })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[['name','Full Name','text',true],['email','Email','email',!isEdit],
          ['phone','Phone','text',!isEdit],['password','Password','password',!isEdit],
          ['qualification','Qualification','text',true],['consultationFee','Consultation Fee (₹)','number',true],
        ].map(([field, label, type, required]) => (
          <div key={field} className={field === 'bio' ? 'col-span-2' : ''}>
            <label className="text-sm font-medium">{label}</label>
            <Input className="mt-1" type={type} required={required}
              value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
          </div>
        ))}
        <div className="col-span-2">
          <label className="text-sm font-medium">Specialization</label>
          <Select value={form.specializationId} onValueChange={v => setForm(f => ({ ...f, specializationId: v }))}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select specialization" /></SelectTrigger>
            <SelectContent>
              {specializations?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update' : 'Create Doctor'}
        </Button>
      </div>
    </form>
  )
}

export default function Doctors() {
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('ALL')
  const [modal, setModal] = useState(null)  // null | 'create' | doctor-object
  const qc = useQueryClient()

  const { data: doctors } = useQuery({
    queryKey: ['doctors', search],
    queryFn: () => api.get(`/doctors?search=${search}&activeOnly=false`).then(r => r.data),
  })
  const { data: specializations } = useQuery({
    queryKey: ['specializations'],
    queryFn: () => api.get('/specializations').then(r => r.data),
  })

  const toggle = useMutation({
    mutationFn: (id) => api.patch(`/admin/doctors/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  })

  const filtered = (doctors ?? []).filter(d =>
    specFilter === 'ALL' || String(d.specializationId) === specFilter
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Doctors</h1>
        <Button onClick={() => setModal('create')}><Plus className="h-4 w-4 mr-1" /> Add Doctor</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search doctors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={specFilter} onValueChange={setSpecFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Specializations</SelectItem>
            {specializations?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered?.map(d => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">Dr. {d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.specialization} · {d.qualification}</p>
                </div>
                <Badge className={d.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}>
                  {d.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm font-medium text-primary">{formatCurrency(d.consultationFee)}</p>
              {d.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{d.bio}</p>}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal(d)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => toggle.mutate(d.id)}>
                  {d.active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal === 'create' ? 'Add New Doctor' : 'Edit Doctor'}</DialogTitle>
          </DialogHeader>
          {modal && (
            <DoctorForm
              doctor={modal === 'create' ? null : modal}
              specializations={specializations}
              onSuccess={() => setModal(null)}
              onClose={() => setModal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
