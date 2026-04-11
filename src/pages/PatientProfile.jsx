import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, FileText, Image, FlaskConical } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate, formatDateTime, statusColor } from '@/lib/utils'

const DOC_ICONS = { LAB_REPORT: FlaskConical, PRESCRIPTION: FileText, SCAN: Image }

export default function PatientProfile() {
  const { id } = useParams()
  const [tab, setTab] = useState('overview')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.get(`/patients/${id}`).then(r => r.data),
  })

  const { data: documents } = useQuery({
    queryKey: ['patient-docs', id],
    queryFn: () => api.get(`/patients/${id}/documents`).then(r => r.data),
    enabled: tab === 'documents',
  })

  const { data: invoices } = useQuery({
    queryKey: ['patient-invoices', id],
    queryFn: () => api.get(`/billing/invoices?patientId=${id}`).then(r => r.data),
    enabled: tab === 'billing',
  })

  async function downloadDoc(docId, fileName) {
    const { data } = await api.get(`/documents/${docId}/download`)
    window.open(data.url, '_blank')
  }

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>
  if (!profile)  return <div className="p-6 text-muted-foreground">Patient not found</div>

  const tabs = ['overview', 'appointments', 'documents', 'billing']

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/patients" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">Patient ID #{id}</p>
        </div>
      </div>

      {/* Quick info strip */}
      <div className="flex flex-wrap gap-3 text-sm">
        {[
          ['Gender', profile.gender],
          ['DOB', formatDate(profile.dob)],
          ['Blood Group', profile.bloodGroup],
          ['Phone', profile.phone],
          ['Emergency', profile.emergencyContact],
        ].map(([k, v]) => v && (
          <span key={k} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
            <span className="font-medium text-foreground">{k}:</span> {v}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[['Full Name', profile.name], ['Email', profile.email], ['Phone', profile.phone],
                ['Date of Birth', formatDate(profile.dob)], ['Gender', profile.gender],
                ['Blood Group', profile.bloodGroup ?? '—'], ['Insurance', profile.insuranceNumber ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Appointments</CardTitle></CardHeader>
            <CardContent>
              {!profile.appointments?.length
                ? <p className="text-sm text-muted-foreground">No appointments yet</p>
                : profile.appointments.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center gap-2 py-2 border-b last:border-0 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">Dr. {a.doctorName}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(a.slotTime)}</p>
                    </div>
                    <Badge className={cn('text-xs', statusColor(a.status))}>{a.status}</Badge>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'appointments' && (
        <Card>
          <CardContent className="p-0">
            {!profile.appointments?.length
              ? <p className="text-sm text-muted-foreground p-6 text-center">No appointments</p>
              : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                      <th className="text-left px-4 py-3">Doctor</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Slot</th>
                      <th className="text-left px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.appointments.map(a => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">Dr. {a.doctorName}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDateTime(a.slotTime)}</td>
                        <td className="px-4 py-3"><Badge className={cn('text-xs', statusColor(a.status))}>{a.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </CardContent>
        </Card>
      )}

      {tab === 'documents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {!documents?.length
            ? <p className="text-sm text-muted-foreground">No documents uploaded</p>
            : documents.map(doc => {
              const Icon = DOC_ICONS[doc.docType] ?? FileText
              return (
                <Card key={doc.id}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{doc.docType} · {formatDate(doc.createdAt)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => downloadDoc(doc.id, doc.fileName)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          }
        </div>
      )}

      {tab === 'billing' && (
        <Card>
          <CardContent className="p-0">
            {!invoices?.length
              ? <p className="text-sm text-muted-foreground p-6 text-center">No invoices</p>
              : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground text-xs">
                      <th className="text-left px-4 py-3">Invoice #</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                      <th className="text-left px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="px-4 py-3"/>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatDate(inv.createdAt)}</td>
                        <td className="px-4 py-3 font-medium">₹{inv.total}</td>
                        <td className="px-4 py-3"><Badge className={cn('text-xs', statusColor(inv.status))}>{inv.status}</Badge></td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/api/billing/invoices/${inv.id}/pdf`, '_blank')}>
                            <Download className="h-3.5 w-3.5 mr-1" /> PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </CardContent>
        </Card>
      )}
    </div>
  )
}
