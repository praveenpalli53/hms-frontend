import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Appointments from '@/pages/Appointments'
import Patients from '@/pages/Patients'
import PatientProfile from '@/pages/PatientProfile'
import Doctors from '@/pages/Doctors'
import Billing from '@/pages/Billing'
import Analytics from '@/pages/Analytics'
import Notifications from '@/pages/Notifications'
import Staff from '@/pages/Staff'
import TvDisplay from '@/pages/TvDisplay'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tv/:doctorId" element={<TvDisplay />} />
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientProfile />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="billing" element={<Billing />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="staff" element={<Staff />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
