import { PropertyStatus } from '@/types/property'

export const PROPERTY_STATUSES: PropertyStatus[] = [
  'Seen',
  'Interested',
  'Contacted Realtor',
  'Visited',
  'On Hold',
  'Irrelevant',
  'Purchased'
]

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  'Seen': 'Just Added',
  'Interested': 'To contact',
  'Contacted Realtor': 'Contacted Realtor',
  'Visited': 'Visited',
  'On Hold': 'On Hold/Thinking',
  'Irrelevant': 'Irrelevant',
  'Purchased': 'Purchased'
}

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  'Seen': '#6366f1',
  'Interested': '#22c55e',
  'Contacted Realtor': '#3b82f6',
  'Visited': '#8b5cf6',
  'On Hold': '#f59e0b',
  'Irrelevant': '#64748b',
  'Purchased': '#10b981'
}

export const PROPERTY_STATUS_OPTIONS = PROPERTY_STATUSES.map((status) => ({
  value: status,
  label: PROPERTY_STATUS_LABELS[status]
}))

export const getStatusLabel = (status: PropertyStatus): string => {
  return PROPERTY_STATUS_LABELS[status] ?? status
}

export const getStatusColor = (status: PropertyStatus): string => {
  return PROPERTY_STATUS_COLORS[status] ?? '#64748b'
}
