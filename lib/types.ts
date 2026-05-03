export interface Lead {
  id: number
  timestamp: string
  name: string
  phone: string
  note: string
  dispatchedTo: string | null
  dispatchTimestamp: string | null
  status: string
  adminNote: string
}

export type TrafficLightStatus = 'green' | 'yellow' | 'red' | 'gray'

export const DISPATCH_THRESHOLDS = {
  green: 3600000, // 1 hour in ms
  yellow: 10800000, // 3 hours in ms
}

export const FINAL_STATUSES = ['Done', 'Booked', 'Not Interested']

export function getTrafficLightStatus(
  lead: Lead,
  now: Date
): TrafficLightStatus {
  // Gray for closed statuses
  if (lead.status && FINAL_STATUSES.includes(lead.status)) {
    return 'gray'
  }

  // Gray if no dispatch
  if (!lead.dispatchTimestamp) {
    return 'gray'
  }

  const dispatchTime = new Date(lead.dispatchTimestamp).getTime()
  const elapsedMs = now.getTime() - dispatchTime

  // Red: > 3 hours
  if (elapsedMs > DISPATCH_THRESHOLDS.yellow) {
    return 'red'
  }

  // Yellow: 1-3 hours
  if (elapsedMs > DISPATCH_THRESHOLDS.green) {
    return 'yellow'
  }

  // Green: < 1 hour
  return 'green'
}

export function formatElapsedTime(timestamp: string, now: Date): string {
  const leadTime = new Date(timestamp).getTime()
  const elapsedMs = now.getTime() - leadTime
  const elapsedMins = Math.floor(elapsedMs / 60000)
  const elapsedHours = Math.floor(elapsedMins / 60)

  if (elapsedHours > 0) {
    return `${elapsedHours}h ${elapsedMins % 60}m`
  }
  return `${elapsedMins}m`
}

export function isInFridayBlackout(date: Date): boolean {
  const dayOfWeek = date.getDay() // 0 = Sunday, 5 = Friday, 6 = Saturday
  const hours = date.getHours()

  // Thursday 12:00 PM onwards
  if (dayOfWeek === 4 && hours >= 12) {
    return true
  }

  // Friday all day
  if (dayOfWeek === 5) {
    return true
  }

  // Saturday until 9:00 AM
  if (dayOfWeek === 6 && hours < 9) {
    return true
  }

  return false
}

export function getStatusColor(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
      return 'bg-green text-white'
    case 'yellow':
      return 'bg-yellow text-white'
    case 'red':
      return 'bg-red text-white'
    case 'gray':
      return 'bg-gray text-white'
  }
}

export function getStatusLabel(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
      return 'On Track'
    case 'yellow':
      return 'At Risk'
    case 'red':
      return 'Overdue'
    case 'gray':
      return 'Closed'
  }
}

export const DISPATCHER_NUMBERS = {
  amr: '+201234567890', // Placeholder - replace with actual Amr number
  eman: '+201234567891', // Placeholder - replace with actual Eman number
  menna: '+201156732768',
}

export function cleanPhoneNumber(phone: string): string {
  // Remove all spaces, dashes, parentheses, and other non-digit characters
  // Keep the + if present
  const hasPlus = phone.startsWith('+')
  const digits = phone.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}
