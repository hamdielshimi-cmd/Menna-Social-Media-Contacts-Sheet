'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { RefreshCw, X } from 'lucide-react'
import {
  Lead,
  getTrafficLightStatus,
  formatElapsedTime,
  isInFridayBlackout,
  getStatusColor,
  getStatusLabel,
} from '@/lib/types'

interface MonitorProps {
  refreshTrigger: number
}

type FilterType = 'all' | 'amr' | 'eman' | 'new'

export function Monitor({ refreshTrigger }: MonitorProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [updating, setUpdating] = useState(false)
  const [status, setStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [now, setNow] = useState(new Date())
  const [inBlackout, setInBlackout] = useState(false)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sheets')
      const data = await response.json()
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads)
      } else {
        toast.error('Failed to load leads')
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  // Refresh every second for real-time elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
      setInBlackout(isInFridayBlackout(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Initial fetch and on trigger
  useEffect(() => {
    fetchLeads()
    setInBlackout(isInFridayBlackout(new Date()))
  }, [refreshTrigger])

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead)
    setStatus(lead.status || '')
    setAdminNote(lead.adminNote || '')
  }

  const handleUpdateLead = async () => {
    if (!selectedLead) return

    setUpdating(true)
    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          rowIndex: selectedLead.id,
          status,
          adminNote,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Lead updated successfully!')
        setSelectedLead(null)
        fetchLeads()
      } else {
        toast.error(data.error || 'Failed to update lead')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead')
    } finally {
      setUpdating(false)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    switch (filter) {
      case 'amr':
        return lead.dispatchedTo?.includes('Amr')
      case 'eman':
        return lead.dispatchedTo?.includes('Eman')
      case 'new':
        return !lead.dispatchedTo
      default:
        return true
    }
  })

  const statusCounts = {
    green: leads.filter((l) => getTrafficLightStatus(l, now) === 'green').length,
    yellow: leads.filter((l) => getTrafficLightStatus(l, now) === 'yellow').length,
    red: leads.filter((l) => getTrafficLightStatus(l, now) === 'red').length,
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      {inBlackout && (
        <div className="bg-muted border border-border rounded-md p-3 text-sm text-muted-foreground">
          🔕 Red flag alerts paused (Friday blackout window)
        </div>
      )}

      {/* Summary */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Summary</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-green/10 border border-green/20">
            <div className="text-2xl font-bold text-green">{statusCounts.green}</div>
            <div className="text-xs text-foreground/70">On Track</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow/10 border border-yellow/20">
            <div className="text-2xl font-bold text-yellow">{statusCounts.yellow}</div>
            <div className="text-xs text-foreground/70">At Risk</div>
          </div>
          <div className="p-3 rounded-lg bg-red/10 border border-red/20">
            <div className="text-2xl font-bold text-red">{statusCounts.red}</div>
            <div className="text-xs text-foreground/70">Overdue</div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="flex-1 h-10"
        >
          All
        </Button>
        <Button
          variant={filter === 'amr' ? 'default' : 'outline'}
          onClick={() => setFilter('amr')}
          className="flex-1 h-10"
        >
          Amr
        </Button>
        <Button
          variant={filter === 'eman' ? 'default' : 'outline'}
          onClick={() => setFilter('eman')}
          className="flex-1 h-10"
        >
          Eman
        </Button>
        <Button
          variant={filter === 'new' ? 'default' : 'outline'}
          onClick={() => setFilter('new')}
          className="flex-1 h-10"
        >
          New
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchLeads}
          disabled={loading}
          className="h-10 w-10"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Lead List */}
      {filteredLeads.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">No leads found</div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map((lead) => {
            const trafficLight = getTrafficLightStatus(lead, now)
            const elapsed = lead.dispatchTimestamp ? formatElapsedTime(lead.dispatchTimestamp, now) : null

            return (
              <Card key={lead.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-foreground">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">{lead.phone}</div>
                    </div>
                    {lead.dispatchedTo && (
                      <Badge variant="outline" className="text-xs">
                        {lead.dispatchedTo}
                      </Badge>
                    )}
                  </div>

                  {lead.note && (
                    <div className="text-sm text-muted-foreground italic">{lead.note}</div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-2">
                      {lead.dispatchTimestamp && (
                        <>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              trafficLight === 'green'
                                ? 'bg-green'
                                : trafficLight === 'yellow'
                                  ? 'bg-yellow'
                                  : trafficLight === 'red'
                                    ? 'bg-red'
                                    : 'bg-gray'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">{elapsed}</span>
                        </>
                      )}
                    </div>

                    {lead.status && (
                      <Badge variant="secondary" className="text-xs">
                        {lead.status}
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSelectLead(lead)}
                    size="sm"
                    className="w-full mt-2 bg-primary hover:bg-primary/90"
                  >
                    Update Status & Note
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Update Lead</DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground">{selectedLead.name}</p>
                <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>
              </div>

              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={status || 'none'} onValueChange={(val) => setStatus(val === 'none' ? '' : val)} disabled={updating}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Status</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="Not Interested">Not Interested</SelectItem>
                    <SelectItem value="No Answer">No Answer</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Admin Note</FieldLabel>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  disabled={updating}
                  placeholder="Add a note..."
                  rows={3}
                  className="resize-none"
                />
              </Field>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedLead(null)}
              disabled={updating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLead}
              disabled={updating}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {updating ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
