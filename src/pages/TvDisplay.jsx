import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Hospital } from 'lucide-react'
import api from '@/lib/api'

export default function TvDisplay() {
  const { doctorId } = useParams()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data: queue } = useQuery({
    queryKey: ['tv-queue', doctorId],
    queryFn: () => api.get(`/queue/${doctorId}/today`).then(r => r.data),
    refetchInterval: 10_000,
    enabled: !!doctorId,
  })

  const active  = queue?.filter(t => ['IN_PROGRESS', 'CALLED', 'WAITING'].includes(t.status))
                        ?.sort((a, b) => a.tokenNumber - b.tokenNumber) ?? []
  const current = active[0] ?? null
  const next    = active[1] ?? null

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">

      {/* Header */}
      <div className="bg-slate-800 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Hospital className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-base md:text-lg leading-none">HMS Portal</p>
            <p className="text-slate-400 text-xs">Live Queue Display</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg md:text-2xl font-mono font-bold">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-slate-400 text-xs md:text-sm">
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Main panels — stacked on mobile, side by side on md+ */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-4 md:p-10">

        {/* NOW SERVING */}
        <div className="flex flex-col items-center justify-center bg-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-10">
          <p className="text-slate-400 text-xs md:text-base font-semibold tracking-widest uppercase mb-4 md:mb-6">
            Now Serving
          </p>
          {current ? (
            <>
              <div className="h-28 w-28 md:h-44 md:w-44 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center mb-4 md:mb-6">
                <span className="text-6xl md:text-8xl font-black text-primary">{current.tokenNumber}</span>
              </div>
              <p className="text-xl md:text-3xl font-bold text-center">{current.patientName}</p>
              <p className="text-slate-400 text-sm md:text-lg mt-2 md:mt-3 text-center">
                {current.status === 'CALLED' ? '🔔 Please proceed to the doctor' : '👨‍⚕️ Consultation in progress'}
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-base md:text-2xl text-center">No patient currently being served</p>
          )}
        </div>

        {/* NEXT */}
        <div className="flex flex-col items-center justify-center bg-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-10">
          <p className="text-slate-400 text-xs md:text-base font-semibold tracking-widest uppercase mb-4 md:mb-6">
            Next Patient
          </p>
          {next ? (
            <>
              <div className="h-28 w-28 md:h-44 md:w-44 rounded-full bg-amber-400/20 border-4 border-amber-400 flex items-center justify-center mb-4 md:mb-6">
                <span className="text-6xl md:text-8xl font-black text-amber-400">{next.tokenNumber}</span>
              </div>
              <p className="text-xl md:text-3xl font-bold text-center">{next.patientName}</p>
              <p className="text-amber-400 text-sm md:text-lg mt-2 md:mt-3">Please be ready</p>
            </>
          ) : (
            <p className="text-slate-500 text-base md:text-2xl text-center">No patients waiting</p>
          )}
        </div>

      </div>
    </div>
  )
}
