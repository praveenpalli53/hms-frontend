import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, Stethoscope,
  FileText, BarChart2, Bell, Hospital, LogOut,
  Tv, ClipboardList, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',    roles: ['SUPER_ADMIN','ADMIN','RECEPTIONIST','NURSE','DOCTOR'] },
  { to: '/appointments',  icon: Calendar,         label: 'Appointments', roles: ['SUPER_ADMIN','ADMIN','RECEPTIONIST','DOCTOR'] },
  { to: '/patients',      icon: Users,            label: 'Patients',     roles: ['SUPER_ADMIN','ADMIN','RECEPTIONIST','NURSE','DOCTOR'] },
  { to: '/doctors',       icon: Stethoscope,      label: 'Doctors',      roles: ['SUPER_ADMIN','ADMIN'] },
  { to: '/billing',       icon: FileText,         label: 'Billing',      roles: ['SUPER_ADMIN','ADMIN','RECEPTIONIST'] },
  { to: '/analytics',     icon: BarChart2,        label: 'Analytics',    roles: ['SUPER_ADMIN','ADMIN'] },
  { to: '/notifications', icon: Bell,             label: 'Notifications',roles: ['SUPER_ADMIN','ADMIN','RECEPTIONIST','NURSE','DOCTOR'] },
  { to: '/staff',         icon: ClipboardList,    label: 'Staff',        roles: ['SUPER_ADMIN','ADMIN'] },
]

function TvPickerDialog({ open, onClose }) {
  const [doctorId, setDoctorId] = useState('')
  const { data: doctors } = useQuery({
    queryKey: ['doctors-active'],
    queryFn: () => api.get('/doctors?activeOnly=true').then(r => r.data),
    enabled: open,
  })
  function openTv() {
    if (doctorId) {
      window.open(`/tv/${doctorId}`, '_blank', 'noreferrer')
      onClose()
    }
  }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader><DialogTitle>Open TV Display</DialogTitle></DialogHeader>
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger><SelectValue placeholder="Select doctor…" /></SelectTrigger>
          <SelectContent>
            {doctors?.map(d => <SelectItem key={d.id} value={String(d.id)}>Dr. {d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="w-full" disabled={!doctorId} onClick={openTv}>
          <Tv className="h-4 w-4 mr-2" /> Open TV Display
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [tvOpen, setTvOpen] = useState(false)

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter(
    (item) => item.roles.includes(user?.role)
  )

  return (
    <aside className="flex flex-col w-64 h-screen bg-slate-900 text-slate-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700/50">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Hospital className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-none">HMS Portal</p>
          <p className="text-xs text-slate-400 mt-0.5">Management</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* TV Display picker */}
        <button
          onClick={() => setTvOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <Tv className="h-4 w-4 shrink-0" />
          TV Display
        </button>
      </nav>

      <TvPickerDialog open={tvOpen} onClose={() => setTvOpen(false)} />

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
