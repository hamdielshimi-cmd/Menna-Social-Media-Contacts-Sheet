'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { toast } from 'sonner'
import { DISPATCHER_NUMBERS } from '@/lib/types'

interface LeadIntakeProps {
  onLeadAdded: () => void
}

export function LeadIntake({ onLeadAdded }: LeadIntakeProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastRowId, setLastRowId] = useState<number | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const validateForm = (): boolean => {
    if (!name.trim()) {
      toast.error('Patient name is required')
      return false
    }
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return false
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Phone must be at least 10 digits')
      return false
    }
    return true
  }

  const handleSaveLead = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          name,
          phone,
          note,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setLastRowId(data.rowIndex)
        toast.success('Lead saved successfully!')
        setName('')
        setPhone('')
        setNote('')
        onLeadAdded()
      } else {
        toast.error(data.error || 'Failed to save lead')
      }
    } catch (error) {
      console.error('Error saving lead:', error)
      toast.error('Failed to save lead')
    } finally {
      setLoading(false)
    }
  }

  const handleDispatch = async (dispatcher: 'amr' | 'eman') => {
    if (lastRowId === null) {
      toast.error('Please save the lead first')
      return
    }

    setLoading(true)
    try {
      const dispatcherName = dispatcher === 'amr' ? 'Amr (Call Center)' : 'Eman (Accounting)'
      const whatsappNumber = dispatcher === 'amr' ? DISPATCHER_NUMBERS.amr : DISPATCHER_NUMBERS.eman

      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch',
          rowIndex: lastRowId,
          dispatchedTo: dispatcherName,
          phone,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Lead dispatched to ${dispatcherName}`)
        // Open WhatsApp
        const whatsappMessage = `New lead: ${name} - ${phone}${note ? ` - Note: ${note}` : ''}`
        const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
        window.open(waUrl, '_blank')
      } else {
        toast.error(data.error || 'Failed to dispatch lead')
      }
    } catch (error) {
      console.error('Error dispatching lead:', error)
      toast.error('Failed to dispatch lead')
    } finally {
      setLoading(false)
    }
  }

  const handleSendDailyReport = async () => {
    try {
      const response = await fetch('/api/sheets', {
        method: 'GET',
      })

      const data = await response.json()
      if (data.success && data.leads) {
        // Filter leads from today
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todaysLeads = data.leads.filter((lead: any) => {
          const leadDate = new Date(lead.timestamp)
          leadDate.setHours(0, 0, 0, 0)
          return leadDate.getTime() === today.getTime()
        })

        if (todaysLeads.length === 0) {
          toast.error('No leads added today')
          return
        }

        const leadsList = todaysLeads
          .map((lead: any) => `${lead.name} - ${lead.phone}`)
          .join('\n')

        const message = `Daily Report - ${today.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}\n\n${leadsList}\n\nTotal: ${todaysLeads.length} leads`

        const waUrl = `https://wa.me/${DISPATCHER_NUMBERS.menna}?text=${encodeURIComponent(message)}`
        window.open(waUrl, '_blank')
        toast.success('Report sent to WhatsApp')
      }
    } catch (error) {
      console.error('Error sending report:', error)
      toast.error('Failed to send report')
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-20">
      <Card className="p-4">
        <form ref={formRef} className="space-y-4">
          <Field>
            <FieldLabel>Patient Name *</FieldLabel>
            <Input
              placeholder="Enter patient name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              minLength={1}
              className="h-11"
            />
          </Field>

          <Field>
            <FieldLabel>Phone Number *</FieldLabel>
            <Input
              placeholder="Enter 10+ digit phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              type="tel"
              className="h-11"
            />
          </Field>

          <Field>
            <FieldLabel>Issue/Note</FieldLabel>
            <Textarea
              placeholder="Optional notes about the patient"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              className="resize-none"
              rows={3}
            />
          </Field>

          <Button
            type="button"
            onClick={handleSaveLead}
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {loading ? 'Saving...' : 'Save Lead'}
          </Button>
        </form>
      </Card>

      {lastRowId !== null && (
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Dispatch to:</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => handleDispatch('amr')}
              disabled={loading}
              variant="outline"
              className="flex-1 h-11"
            >
              → Amr
            </Button>
            <Button
              onClick={() => handleDispatch('eman')}
              disabled={loading}
              variant="outline"
              className="flex-1 h-11"
            >
              → Eman
            </Button>
          </div>
        </Card>
      )}

      <Button
        onClick={handleSendDailyReport}
        disabled={loading}
        variant="secondary"
        className="w-full h-11 font-medium"
      >
        Send Daily Report to Manager
      </Button>
    </div>
  )
}
