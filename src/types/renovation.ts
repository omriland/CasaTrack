export type RenovationProjectStatus = 'active' | 'archived'

export interface RenovationProject {
  id: string
  name: string
  notes: string | null
  address_text: string | null
  status: RenovationProjectStatus
  start_date: string | null
  target_end_date: string | null
  total_budget: number
  contingency_amount: number
  currency: string
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface RenovationTeamMember {
  id: string
  project_id: string
  name: string
  phone: string | null
  email: string | null
  sort_order: number
}

/** External service providers / contractors (phone book) */
export interface RenovationProvider {
  id: string
  project_id: string
  name: string
  description: string | null
  phone: string | null
  email: string | null
  additional_info: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type CalendarEventType = 'general' | 'provider_meeting'

export interface RenovationCalendarEvent {
  id: string
  project_id: string
  event_type: CalendarEventType
  title: string
  body: string | null
  /** Free-text location / address */
  address: string | null
  provider_id: string | null
  /** Team member who created the event (active profile at save time). */
  created_by_member_id: string | null
  is_all_day: boolean
  start_date: string | null
  end_date: string | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
  provider?: RenovationProvider | null
  created_by?: RenovationTeamMember | null
}

export interface RenovationBudgetLine {
  id: string
  project_id: string
  category_name: string
  amount_allocated: number
  sort_order: number
  /** Linked via `renovation_budget_line_rooms`; empty = not scoped to specific rooms */
  room_ids: string[]
}

export interface RenovationExpense {
  id: string
  project_id: string
  amount: number
  expense_date: string | null
  vendor: string | null
  category: string | null
  notes: string | null
  payment_method: string | null
  receipt_storage_path: string | null
  /** True = expected cost not yet paid */
  is_planned: boolean
  /** Spent rows only: optional link to a planned row this payment counts toward */
  linked_planned_expense_id: string | null
  created_at: string
  updated_at: string
}

/** Cash paid toward a vendor row (partial payments vs “actual” amount). */
export interface RenovationVendorPayment {
  id: string
  project_id: string
  vendor_key: string
  amount: number
  note: string | null
  created_at: string
}

/** Multiple files per expense (bucket: renovation-files) */
export interface RenovationExpenseAttachment {
  id: string
  expense_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  sort_order: number
  created_at: string
  public_url?: string
}

export interface RenovationLabel {
  id: string
  project_id: string
  name: string
  color: string
  sort_order: number
}

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done'
export type TaskUrgency = 'low' | 'medium' | 'high' | 'critical'

export interface RenovationTask {
  id: string
  project_id: string
  title: string
  body: string | null
  status: TaskStatus
  assignee_id: string | null
  /** Team member who created the task (current profile at save time). */
  created_by_member_id: string | null
  room_id: string | null
  provider_id: string | null
  due_date: string | null
  start_date: string | null
  urgency: TaskUrgency
  sort_order: number
  created_at: string
  updated_at: string
  label_ids?: string[]
  assignee?: RenovationTeamMember | null
  created_by?: RenovationTeamMember | null
  room?: RenovationRoom | null
  provider?: RenovationProvider | null
}

export interface RenovationRoom {
  id: string
  project_id: string
  name: string
  notes: string | null
  sort_order: number
  /** App-defined key from Room icon picker (e.g. `house`, `bath`, `shower_head`). */
  room_icon_key?: string | null
}

export interface RenovationGalleryTag {
  id: string
  project_id: string
  name: string
}

export interface RenovationGalleryItem {
  id: string
  project_id: string
  storage_path: string
  caption: string | null
  taken_at: string | null
  room_id: string | null
  created_at: string
  tag_ids?: string[]
  public_url?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annotations?: any[]
}

/** Apartment needs / requirements */
export interface RenovationNeed {
  id: string
  project_id: string
  room_id: string | null
  title: string
  sort_order: number
  completed: boolean
  created_at: string
  room?: RenovationRoom | null
}

export interface RenovationFile {
  id: string
  project_id: string
  room_id: string | null
  storage_path: string
  display_name: string
  original_name: string | null
  mime_type: string | null
  file_size: number | null
  created_at: string
  updated_at: string
  public_url?: string
  room?: RenovationRoom | null
}
