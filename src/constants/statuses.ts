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
  'Seen': 'Seen',
  'Interested': 'Contact realtor',
  'Contacted Realtor': 'Contacted Realtor',
  'Visited': 'Visited',
  'On Hold': 'On Hold/Thinking',
  'Irrelevant': 'Irrelevant',
  'Purchased': 'Purchased'
}

export const PROPERTY_STATUS_OPTIONS = PROPERTY_STATUSES.map((status) => ({
  value: status,
  label: PROPERTY_STATUS_LABELS[status]
}))

export const getStatusLabel = (status: PropertyStatus): string => {
  return PROPERTY_STATUS_LABELS[status] ?? status
}
