import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Hospital, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ROLES = [
  { value: 'ADMIN',        label: 'Admin',        desc: 'Full system access' },
  { value: 'RECEPTIONIST', label: 'Receptionist',  desc: 'Appointments & patients' },
  { value: 'DOCTOR',       label: 'Doctor',        desc: 'Clinical management' },
  { value: 'NURSE',        label: 'Nurse',         desc: 'Patient care support' },
]

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter',  pass: /[A-Z]/.test(password) },
    { label: 'One number',            pass: /\d/.test(password) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      {checks.map(({ label, pass }) => (
        <div key={label} className={`flex items-center gap-1.5 text-xs ${pass ? 'text-green-600' : 'text-muted-foreground'}`}>
          <CheckCircle2 className={`h-3 w-3 ${pass ? 'text-green-600' : 'text-gray-300'}`} />
          {label}
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const navigate   = useNavigate()
  const { login }  = useAuthStore()

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.role) { setError('Please select a role'); return }

    // Basic phone validation (Indian 10-digit starting 6-9)
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setError('Enter a valid 10-digit Indian phone number')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        phone:    form.phone.trim(),
        password: form.password,
        role:     form.role,
      })
      login(data.accessToken, {
        id:    data.userId,
        name:  data.name,
        email: data.email,
        role:  data.role,
      })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 py-10">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg">
            <Hospital className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">HMS Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your staff account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border p-8">
          <h2 className="text-lg font-semibold mb-6">Staff Registration</h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="Dr. Jane Smith"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="jane@hospital.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
                <Input
                  className="pl-10"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('role', r.value)}
                    className={`text-left rounded-xl border-2 px-4 py-3 transition-all ${
                      form.role === r.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${form.role === r.value ? 'text-primary' : 'text-foreground'}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
