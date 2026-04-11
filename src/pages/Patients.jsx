import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronRight, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'

export default function Patients() {
  const [query, setQuery] = useState('')

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', query],
    queryFn: () => api.get(`/admin/patients?query=${encodeURIComponent(query)}`).then(r => r.data),
    keepPreviousData: true,
  })

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold">Patients</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, phone or ID…"
          value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-6 text-center">Searching…</p>
          ) : !patients?.length ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No patients found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Gender</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">DOB</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Blood Group</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">ID #{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.gender}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(p.dob)}</td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {p.bloodGroup && (
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-medium">{p.bloodGroup}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/patients/${p.id}`}
                        className="flex items-center gap-0.5 text-primary text-xs hover:underline">
                        Profile <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
