import { defaultTimedEnd } from '@/lib/calendar-datetime'
import { supabase } from '@/lib/supabase'
import type {
  RenovationProject,
  RenovationTeamMember,
  RenovationBudgetLine,
  RenovationExpense,
  RenovationExpenseAttachment,
  RenovationLabel,
  RenovationTask,
  TaskStatus,
  TaskUrgency,
  RenovationRoom,
  RenovationGalleryTag,
  RenovationGalleryItem,
  RenovationFile,
  RenovationNeed,
  RenovationProvider,
  RenovationCalendarEvent,
  CalendarEventType,
  RenovationVendorPayment,
} from '@/types/renovation'
import { normalizeVendorKey } from '@/lib/renovation-vendor-budget'

const BUCKET = 'renovation-gallery'
const FILES_BUCKET = 'renovation-files'

export function renovationPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') || ''
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`
}

export function renovationFilesPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') || ''
  return `${base}/storage/v1/object/public/${FILES_BUCKET}/${path}`
}

/**
 * When `true`, the renovation **Files** tab stores blobs in your Dropbox folder
 * (`DROPBOX_*` server env) and keeps metadata in `renovation_files` as today.
 * Expense attachments still use Supabase Storage.
 */
export function renovationFilesUseDropbox(): boolean {
  return process.env.NEXT_PUBLIC_RENOVATION_FILES_STORAGE === 'dropbox'
}

function projectFilePublicUrl(f: RenovationFile): string {
  if (renovationFilesUseDropbox()) {
    return `/api/renovation/files/download?id=${encodeURIComponent(f.id)}`
  }
  return renovationFilesPublicUrl(f.storage_path)
}

/** Effective budget cap = total + contingency */
export function effectiveBudget(project: RenovationProject): number {
  return Number(project.total_budget) + Number(project.contingency_amount)
}

// --- Projects ---

export async function getActiveProject(): Promise<RenovationProject | null> {
  const { data, error } = await supabase
    .from('renovation_projects')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as RenovationProject | null
}

export async function getArchivedProjects(): Promise<RenovationProject[]> {
  const { data, error } = await supabase
    .from('renovation_projects')
    .select('*')
    .eq('status', 'archived')
    .order('archived_at', { ascending: false })

  if (error) throw error
  return (data || []) as RenovationProject[]
}

export async function archiveProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('renovation_projects')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) throw error
}

export async function createProject(row: {
  name: string
  notes?: string | null
  address_text?: string | null
  start_date?: string | null
  target_end_date?: string | null
  total_budget?: number
  contingency_amount?: number
}): Promise<RenovationProject> {
  const active = await getActiveProject()
  if (active) {
    await archiveProject(active.id)
  }

  const { data, error } = await supabase
    .from('renovation_projects')
    .insert({
      name: row.name,
      notes: row.notes ?? null,
      address_text: row.address_text ?? null,
      start_date: row.start_date ?? null,
      target_end_date: row.target_end_date ?? null,
      total_budget: row.total_budget ?? 0,
      contingency_amount: row.contingency_amount ?? 0,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data as RenovationProject
}

export async function updateProject(
  id: string,
  updates: Partial<
    Pick<
      RenovationProject,
      | 'name'
      | 'notes'
      | 'address_text'
      | 'start_date'
      | 'target_end_date'
      | 'total_budget'
      | 'contingency_amount'
    >
  >
): Promise<RenovationProject> {
  const { data, error } = await supabase
    .from('renovation_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as RenovationProject
}

// --- Team ---

export async function listTeamMembers(projectId: string): Promise<RenovationTeamMember[]> {
  const { data, error } = await supabase
    .from('renovation_team_members')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
    .order('name')

  if (error) throw error
  return (data || []) as RenovationTeamMember[]
}

export async function createTeamMember(
  projectId: string,
  row: { name: string; phone?: string; email?: string }
): Promise<RenovationTeamMember> {
  const { data, error } = await supabase
    .from('renovation_team_members')
    .insert({
      project_id: projectId,
      name: row.name,
      phone: row.phone || null,
      email: row.email || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as RenovationTeamMember
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_team_members').delete().eq('id', id)
  if (error) throw error
}

// --- Budget lines ---

function mergeBudgetLineRoomIds(
  lines: Omit<RenovationBudgetLine, 'room_ids'>[],
  links: { budget_line_id: string; room_id: string }[]
): RenovationBudgetLine[] {
  const byLine = new Map<string, string[]>()
  for (const l of links) {
    const list = byLine.get(l.budget_line_id) ?? []
    list.push(l.room_id)
    byLine.set(l.budget_line_id, list)
  }
  return lines.map((row) => ({
    ...row,
    room_ids: byLine.get(row.id) ?? [],
  }))
}

export async function listBudgetLines(projectId: string): Promise<RenovationBudgetLine[]> {
  const { data: lines, error } = await supabase
    .from('renovation_budget_lines')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')

  if (error) throw error
  const list = (lines || []) as Omit<RenovationBudgetLine, 'room_ids'>[]
  if (list.length === 0) return []

  const ids = list.map((r) => r.id)
  const { data: linkRows, error: linkErr } = await supabase
    .from('renovation_budget_line_rooms')
    .select('budget_line_id, room_id')
    .in('budget_line_id', ids)

  if (linkErr) {
    console.warn('renovation_budget_line_rooms:', linkErr.message)
    return mergeBudgetLineRoomIds(list, [])
  }
  return mergeBudgetLineRoomIds(list, (linkRows || []) as { budget_line_id: string; room_id: string }[])
}

/** Replace room links for a budget line (empty array clears all). */
export async function setBudgetLineRooms(budgetLineId: string, roomIds: string[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('renovation_budget_line_rooms')
    .delete()
    .eq('budget_line_id', budgetLineId)
  if (delErr) throw delErr
  if (roomIds.length === 0) return
  const { error: insErr } = await supabase.from('renovation_budget_line_rooms').insert(
    roomIds.map((room_id) => ({ budget_line_id: budgetLineId, room_id }))
  )
  if (insErr) throw insErr
}

export async function createBudgetLine(
  projectId: string,
  category_name: string,
  amount_allocated: number
): Promise<RenovationBudgetLine> {
  const { data, error } = await supabase
    .from('renovation_budget_lines')
    .insert({ project_id: projectId, category_name, amount_allocated })
    .select()
    .single()

  if (error) throw error
  return { ...(data as Omit<RenovationBudgetLine, 'room_ids'>), room_ids: [] }
}

export async function updateBudgetLine(
  id: string,
  updates: Partial<Pick<RenovationBudgetLine, 'category_name' | 'amount_allocated' | 'sort_order'>>
): Promise<void> {
  const { error } = await supabase.from('renovation_budget_lines').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteBudgetLine(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_budget_lines').delete().eq('id', id)
  if (error) throw error
}

// --- Expenses ---

export function mapExpenseRow(row: RenovationExpense): RenovationExpense {
  return {
    ...row,
    expense_date: row.expense_date ?? null,
    is_planned: row.is_planned === true,
    linked_planned_expense_id: row.linked_planned_expense_id ?? null,
  }
}

export async function getExpenseById(id: string): Promise<RenovationExpense | null> {
  const { data, error } = await supabase.from('renovation_expenses').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapExpenseRow(data as RenovationExpense)
}

export function expenseIsPlanned(e: RenovationExpense): boolean {
  return e.is_planned === true
}

export function sumSpentExpenses(expenses: RenovationExpense[]): number {
  return expenses.filter((e) => !expenseIsPlanned(e)).reduce((s, e) => s + Number(e.amount), 0)
}

export function sumPlannedExpenses(expenses: RenovationExpense[]): number {
  return expenses.filter(expenseIsPlanned).reduce((s, e) => s + Number(e.amount), 0)
}

/** Sum of spent rows linked to a given planned expense id. */
export function sumSpentLinkedToPlanned(expenses: RenovationExpense[], plannedId: string): number {
  return expenses
    .filter((e) => !expenseIsPlanned(e) && e.linked_planned_expense_id === plannedId)
    .reduce((s, e) => s + Number(e.amount), 0)
}

/**
 * Remaining “open” amount per planned row after linked spent (not below zero).
 * Sum across all planned rows — used for budget bar / committed breakdown.
 */
export function openPlannedRemainderTotal(expenses: RenovationExpense[]): number {
  return expenses.filter(expenseIsPlanned).reduce((sum, p) => {
    const linked = sumSpentLinkedToPlanned(expenses, p.id)
    return sum + Math.max(0, Number(p.amount) - linked)
  }, 0)
}

/** committed = all spent + Σ max(0, planned − linked spent per plan) */
export function committedTowardCap(expenses: RenovationExpense[]): number {
  return sumSpentExpenses(expenses) + openPlannedRemainderTotal(expenses)
}

export async function listExpenses(projectId: string): Promise<RenovationExpense[]> {
  const { data, error } = await supabase
    .from('renovation_expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data || []) as RenovationExpense[]).map(mapExpenseRow)
}

export async function sumExpenses(projectId: string): Promise<number> {
  const expenses = await listExpenses(projectId)
  return sumSpentExpenses(expenses)
}

export async function createExpense(
  projectId: string,
  row: {
    amount: number
    expense_date?: string | null
    vendor?: string | null
    category?: string | null
    notes?: string | null
    payment_method?: string | null
    receipt_storage_path?: string | null
    is_planned?: boolean
    linked_planned_expense_id?: string | null
  }
): Promise<RenovationExpense> {
  const isPlanned = row.is_planned ?? false
  const linkId =
    isPlanned || row.linked_planned_expense_id === undefined || row.linked_planned_expense_id === null
      ? null
      : row.linked_planned_expense_id
  const { data, error } = await supabase
    .from('renovation_expenses')
    .insert({
      project_id: projectId,
      amount: row.amount,
      expense_date:
        row.expense_date === undefined || row.expense_date === null || row.expense_date === ''
          ? null
          : row.expense_date,
      vendor: row.vendor ?? null,
      category: row.category ?? null,
      notes: row.notes ?? null,
      payment_method: row.payment_method ?? null,
      receipt_storage_path: row.receipt_storage_path ?? null,
      is_planned: isPlanned,
      linked_planned_expense_id: linkId,
    })
    .select()
    .single()

  if (error) throw error
  return mapExpenseRow(data as RenovationExpense)
}

export async function updateExpense(
  id: string,
  updates: Partial<
    Pick<
      RenovationExpense,
      | 'amount'
      | 'expense_date'
      | 'vendor'
      | 'category'
      | 'notes'
      | 'payment_method'
      | 'receipt_storage_path'
      | 'is_planned'
      | 'linked_planned_expense_id'
    >
  >
): Promise<void> {
  const { error } = await supabase.from('renovation_expenses').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string): Promise<void> {
  const atts = await listExpenseAttachmentsForExpense(id)
  for (const a of atts) {
    await supabase.storage.from(FILES_BUCKET).remove([a.storage_path])
  }
  const { data: exp } = await supabase.from('renovation_expenses').select('receipt_storage_path').eq('id', id).maybeSingle()
  const legacyPath = exp?.receipt_storage_path as string | null | undefined
  if (legacyPath) {
    await supabase.storage.from(BUCKET).remove([legacyPath])
  }
  const { error } = await supabase.from('renovation_expenses').delete().eq('id', id)
  if (error) throw error
}

/** Replace all planned rows for this vendor with a single planned expense of `amount` (0 removes planned). */
export async function setVendorPlannedTotal(projectId: string, vendorDisplay: string, amount: number): Promise<void> {
  const key = normalizeVendorKey(vendorDisplay)
  const all = await listExpenses(projectId)
  const planned = all.filter((e) => expenseIsPlanned(e) && normalizeVendorKey(e.vendor) === key)
  const spent = all.filter((e) => !expenseIsPlanned(e) && normalizeVendorKey(e.vendor) === key)
  const oldPlannedIds = new Set(planned.map((p) => p.id))

  for (const p of planned) await deleteExpense(p.id)

  let newPlannedId: string | null = null
  if (amount > 0) {
    const created = await createExpense(projectId, {
      vendor: vendorDisplay.trim() || null,
      amount,
      is_planned: true,
      expense_date: null,
    })
    newPlannedId = created.id
  }

  for (const s of spent) {
    const wasLinked = s.linked_planned_expense_id && oldPlannedIds.has(s.linked_planned_expense_id)
    await updateExpense(s.id, {
      linked_planned_expense_id: wasLinked ? newPlannedId : (s.linked_planned_expense_id ?? null),
    })
  }
}

/** Set total spent for vendor: merges multiple spent rows into one (keeps oldest for attachments). */
export async function setVendorSpentTotal(projectId: string, vendorDisplay: string, amount: number): Promise<void> {
  const key = normalizeVendorKey(vendorDisplay)
  const all = await listExpenses(projectId)
  const spent = all.filter((e) => !expenseIsPlanned(e) && normalizeVendorKey(e.vendor) === key)
  const planned = all.find((e) => expenseIsPlanned(e) && normalizeVendorKey(e.vendor) === key)
  const linkId = planned?.id ?? null

  if (amount <= 0) {
    for (const s of spent) await deleteExpense(s.id)
    return
  }

  if (spent.length === 0) {
    await createExpense(projectId, {
      vendor: vendorDisplay.trim() || null,
      amount,
      is_planned: false,
      expense_date: new Date().toISOString().slice(0, 10),
      linked_planned_expense_id: linkId,
    })
    return
  }

  const sorted = [...spent].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const [keep, ...rest] = sorted
  await updateExpense(keep!.id, { amount, linked_planned_expense_id: linkId })
  for (const r of rest) await deleteExpense(r.id)
}

/** Ensure at least one expense row exists for this vendor (0₪ planned) so attachments can be stored. */
export async function ensureVendorExpenseForAttachments(projectId: string, vendorDisplay: string): Promise<string> {
  const key = normalizeVendorKey(vendorDisplay)
  const all = await listExpenses(projectId)
  const rows = all.filter((e) => normalizeVendorKey(e.vendor) === key)
  const spent = rows.find((e) => !expenseIsPlanned(e))
  if (spent) return spent.id
  const planned = rows.find((e) => expenseIsPlanned(e))
  if (planned) return planned.id
  const created = await createExpense(projectId, {
    vendor: vendorDisplay.trim() || null,
    amount: 0,
    is_planned: true,
    expense_date: null,
  })
  return created.id
}

export async function updateVendorExpenseMeta(
  projectId: string,
  vendorDisplay: string,
  patch: { category?: string | null; notes?: string | null; payment_method?: string | null }
): Promise<void> {
  const key = normalizeVendorKey(vendorDisplay)
  const all = await listExpenses(projectId)
  const rows = all.filter((e) => normalizeVendorKey(e.vendor) === key)
  for (const e of rows) {
    await updateExpense(e.id, patch)
  }
}

async function renameVendorPaymentKeys(projectId: string, fromKey: string, toKey: string): Promise<void> {
  if (fromKey === toKey) return
  const { error } = await supabase
    .from('renovation_vendor_payments')
    .update({ vendor_key: toKey })
    .eq('project_id', projectId)
    .eq('vendor_key', fromKey)
  if (error) throw error
}

async function renameVendorBudgetRoomKeys(projectId: string, fromKey: string, toKey: string): Promise<void> {
  if (fromKey === toKey) return
  const { data: fromRows, error: selFromErr } = await supabase
    .from('renovation_vendor_budget_rooms')
    .select('room_id')
    .eq('project_id', projectId)
    .eq('vendor_key', fromKey)
  if (selFromErr) throw selFromErr
  if (!fromRows?.length) return

  const { data: toRows, error: selToErr } = await supabase
    .from('renovation_vendor_budget_rooms')
    .select('room_id')
    .eq('project_id', projectId)
    .eq('vendor_key', toKey)
  if (selToErr) throw selToErr
  const already = new Set((toRows ?? []).map((r: { room_id: string }) => r.room_id))

  const { error: delErr } = await supabase
    .from('renovation_vendor_budget_rooms')
    .delete()
    .eq('project_id', projectId)
    .eq('vendor_key', fromKey)
  if (delErr) throw delErr

  const toAdd = fromRows
    .map((r: { room_id: string }) => r.room_id)
    .filter((room_id) => !already.has(room_id))
  if (toAdd.length === 0) return
  const { error: insErr } = await supabase.from('renovation_vendor_budget_rooms').insert(
    toAdd.map((room_id) => ({ project_id: projectId, vendor_key: toKey, room_id }))
  )
  if (insErr) throw insErr
}

export async function renameVendorAcrossExpenses(projectId: string, fromKey: string, toDisplayName: string): Promise<void> {
  const trimmed = toDisplayName.trim()
  const toKey = normalizeVendorKey(trimmed)
  const all = await listExpenses(projectId)
  const rows = all.filter((e) => normalizeVendorKey(e.vendor) === fromKey)
  for (const e of rows) {
    await updateExpense(e.id, { vendor: trimmed || null })
  }
  await renameVendorPaymentKeys(projectId, fromKey, toKey)
  await renameVendorBudgetRoomKeys(projectId, fromKey, toKey)
}

export type VendorBudgetRoomLink = { vendor_key: string; room_id: string }

export async function listVendorBudgetRoomLinks(projectId: string): Promise<VendorBudgetRoomLink[]> {
  const { data, error } = await supabase
    .from('renovation_vendor_budget_rooms')
    .select('vendor_key, room_id')
    .eq('project_id', projectId)

  if (error) {
    console.warn('renovation_vendor_budget_rooms:', error.message)
    return []
  }
  return (data || []) as VendorBudgetRoomLink[]
}

export function vendorRoomLinksByVendorKey(links: VendorBudgetRoomLink[]): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const l of links) {
    const list = m.get(l.vendor_key) ?? []
    list.push(l.room_id)
    m.set(l.vendor_key, list)
  }
  return m
}

export async function setVendorBudgetRooms(projectId: string, vendorKey: string, roomIds: string[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('renovation_vendor_budget_rooms')
    .delete()
    .eq('project_id', projectId)
    .eq('vendor_key', vendorKey)
  if (delErr) throw new Error(delErr.message)
  if (roomIds.length === 0) return
  const { error: insErr } = await supabase.from('renovation_vendor_budget_rooms').insert(
    roomIds.map((room_id) => ({ project_id: projectId, vendor_key: vendorKey, room_id }))
  )
  if (insErr) throw new Error(insErr.message)
}

export async function deleteVendorBudgetRoomsForVendor(projectId: string, vendorKey: string): Promise<void> {
  const { error } = await supabase
    .from('renovation_vendor_budget_rooms')
    .delete()
    .eq('project_id', projectId)
    .eq('vendor_key', vendorKey)
  if (error) throw error
}

export async function listVendorPayments(projectId: string): Promise<RenovationVendorPayment[]> {
  const { data, error } = await supabase
    .from('renovation_vendor_payments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data || []) as RenovationVendorPayment[]).map((row) => ({
    ...row,
    amount: Number(row.amount),
    note: row.note ?? null,
  }))
}

export async function createVendorPayment(
  projectId: string,
  vendorKey: string,
  row: { amount: number; note?: string | null }
): Promise<RenovationVendorPayment> {
  const { data, error } = await supabase
    .from('renovation_vendor_payments')
    .insert({
      project_id: projectId,
      vendor_key: vendorKey,
      amount: row.amount,
      note: row.note?.trim() ? row.note.trim() : null,
    })
    .select()
    .single()

  if (error) throw error
  const p = data as RenovationVendorPayment
  return { ...p, amount: Number(p.amount), note: p.note ?? null }
}

export async function listExpenseAttachmentsForExpense(expenseId: string): Promise<RenovationExpenseAttachment[]> {
  const { data, error } = await supabase
    .from('renovation_expense_attachments')
    .select('*')
    .eq('expense_id', expenseId)
    .order('sort_order')
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data || []) as RenovationExpenseAttachment[]).map((a) => ({
    ...a,
    public_url: renovationFilesPublicUrl(a.storage_path),
  }))
}

export async function listExpenseAttachmentsForExpenses(expenseIds: string[]): Promise<RenovationExpenseAttachment[]> {
  if (expenseIds.length === 0) return []
  const { data, error } = await supabase
    .from('renovation_expense_attachments')
    .select('*')
    .in('expense_id', expenseIds)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data || []) as RenovationExpenseAttachment[]).map((a) => ({
    ...a,
    public_url: renovationFilesPublicUrl(a.storage_path),
  }))
}

export async function uploadExpenseAttachment(
  projectId: string,
  expenseId: string,
  file: File
): Promise<RenovationExpenseAttachment> {
  const safeName = file.name.replace(/[^\w.\-()\s\u0590-\u05FF]+/g, '_').trim() || 'file'
  const ext = safeName.includes('.') ? safeName.split('.').pop() || 'bin' : 'bin'
  const path = `${projectId}/expense-attachments/${expenseId}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await supabase.storage.from(FILES_BUCKET).upload(path, file, { upsert: false })
  if (upErr) throw upErr

  const { data, error } = await supabase
    .from('renovation_expense_attachments')
    .insert({
      expense_id: expenseId,
      storage_path: path,
      file_name: safeName,
      mime_type: file.type || null,
      file_size: file.size,
    })
    .select()
    .single()

  if (error) throw error
  const row = data as RenovationExpenseAttachment
  return { ...row, public_url: renovationFilesPublicUrl(row.storage_path) }
}

export async function deleteExpenseAttachment(att: RenovationExpenseAttachment): Promise<void> {
  await supabase.storage.from(FILES_BUCKET).remove([att.storage_path])
  const { error } = await supabase.from('renovation_expense_attachments').delete().eq('id', att.id)
  if (error) throw error
}

export async function uploadReceipt(projectId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${projectId}/receipts/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

// --- Labels ---

export async function listLabels(projectId: string): Promise<RenovationLabel[]> {
  const { data, error } = await supabase
    .from('renovation_labels')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
    .order('name')

  if (error) throw error
  return (data || []) as RenovationLabel[]
}

export async function createLabel(
  projectId: string,
  name: string,
  color = '#007AFF'
): Promise<RenovationLabel> {
  const { data, error } = await supabase
    .from('renovation_labels')
    .insert({ project_id: projectId, name, color })
    .select()
    .single()

  if (error) throw error
  return data as RenovationLabel
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_labels').delete().eq('id', id)
  if (error) throw error
}

// --- Tasks ---

async function loadTaskLabelIds(taskIds: string[]): Promise<Map<string, string[]>> {
  if (taskIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('renovation_task_labels')
    .select('task_id, label_id')
    .in('task_id', taskIds)

  if (error) throw error
  const map = new Map<string, string[]>()
  for (const row of data || []) {
    const t = row.task_id as string
    const list = map.get(t) || []
    list.push(row.label_id as string)
    map.set(t, list)
  }
  return map
}

export async function listTasks(projectId: string): Promise<RenovationTask[]> {
  const { data, error } = await supabase
    .from('renovation_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
    .order('created_at', { ascending: false })

  if (error) throw error
  const tasks = (data || []) as RenovationTask[]
  const members = await listTeamMembers(projectId)
  const memberMap = new Map(members.map((m) => [m.id, m]))
  const labelMap = await loadTaskLabelIds(tasks.map((t) => t.id))

  const rooms = await listRooms(projectId)
  const roomMap = new Map(rooms.map((r) => [r.id, r]))

  let providers: RenovationProvider[] = []
  try {
    providers = await listProviders(projectId)
  } catch {
    providers = []
  }
  const providerMap = new Map(providers.map((p) => [p.id, p]))

  return tasks.map((t) => ({
    ...t,
    created_by_member_id: t.created_by_member_id ?? null,
    provider_id: t.provider_id ?? null,
    assignee: t.assignee_id ? memberMap.get(t.assignee_id) ?? null : null,
    created_by: t.created_by_member_id ? memberMap.get(t.created_by_member_id) ?? null : null,
    room: t.room_id ? roomMap.get(t.room_id) ?? null : null,
    provider: t.provider_id ? providerMap.get(t.provider_id) ?? null : null,
    label_ids: labelMap.get(t.id) || [],
  }))
}

export async function createTask(
  projectId: string,
  row: {
    title: string
    body?: string | null
    status?: TaskStatus
    assignee_id?: string | null
    created_by_member_id?: string | null
    room_id?: string | null
    provider_id?: string | null
    due_date?: string | null
    start_date?: string | null
    urgency?: TaskUrgency
    label_ids?: string[]
  }
): Promise<RenovationTask> {
  const { data, error } = await supabase
    .from('renovation_tasks')
    .insert({
      project_id: projectId,
      title: row.title,
      body: row.body ?? null,
      status: row.status ?? 'open',
      assignee_id: row.assignee_id ?? null,
      created_by_member_id: row.created_by_member_id ?? null,
      room_id: row.room_id ?? null,
      provider_id: row.provider_id ?? null,
      due_date: row.due_date ?? null,
      start_date: row.start_date ?? null,
      urgency: row.urgency ?? 'medium',
    })
    .select()
    .single()

  if (error) throw error
  const task = data as RenovationTask
  if (row.label_ids?.length) {
    await supabase.from('renovation_task_labels').insert(
      row.label_ids.map((label_id) => ({ task_id: task.id, label_id }))
    )
  }
  return task
}

export async function updateTask(
  id: string,
  updates: Partial<
    Pick<
      RenovationTask,
      'title' | 'body' | 'status' | 'assignee_id' | 'room_id' | 'provider_id' | 'due_date' | 'start_date' | 'urgency' | 'sort_order'
    >
  >
): Promise<void> {
  const { error } = await supabase.from('renovation_tasks').update(updates).eq('id', id)
  if (error) throw error
}

export async function setTaskLabels(taskId: string, labelIds: string[]): Promise<void> {
  await supabase.from('renovation_task_labels').delete().eq('task_id', taskId)
  if (labelIds.length) {
    await supabase
      .from('renovation_task_labels')
      .insert(labelIds.map((label_id) => ({ task_id: taskId, label_id })))
  }
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_tasks').delete().eq('id', id)
  if (error) throw error
}

// --- Rooms ---

export async function listRooms(projectId: string): Promise<RenovationRoom[]> {
  const { data, error } = await supabase
    .from('renovation_rooms')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
    .order('name')

  if (error) throw error
  return (data || []) as RenovationRoom[]
}

export async function createRoom(
  projectId: string,
  name: string,
  notes?: string | null,
  roomIconKey?: string | null
): Promise<RenovationRoom> {
  const { data, error } = await supabase
    .from('renovation_rooms')
    .insert({
      project_id: projectId,
      name,
      notes: notes ?? null,
      ...(roomIconKey != null && roomIconKey !== '' ? { room_icon_key: roomIconKey } : {}),
    })
    .select()
    .single()

  if (error) throw error
  return data as RenovationRoom
}

export async function updateRoom(
  id: string,
  updates: Partial<Pick<RenovationRoom, 'name' | 'notes' | 'room_icon_key'>>
): Promise<void> {
  const { error } = await supabase.from('renovation_rooms').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_rooms').delete().eq('id', id)
  if (error) throw error
}

// --- Needs — apartment requirements list ---

export async function listNeeds(projectId: string): Promise<RenovationNeed[]> {
  const { data, error } = await supabase
    .from('renovation_needs')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
    .order('created_at', { ascending: true })

  if (error) throw error
  const rows = (data || []) as RenovationNeed[]
  const rooms = await listRooms(projectId)
  const roomMap = new Map(rooms.map((r) => [r.id, r]))
  return rows.map((n) => ({
    ...n,
    completed: n.completed ?? false,
    room: n.room_id ? roomMap.get(n.room_id) ?? null : null,
  }))
}

export async function createNeed(projectId: string, title: string, roomId?: string | null): Promise<RenovationNeed> {
  const { data, error } = await supabase
    .from('renovation_needs')
    .insert({
      project_id: projectId,
      title: title.trim(),
      room_id: roomId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as RenovationNeed
}

export async function updateNeed(
  id: string,
  updates: Partial<Pick<RenovationNeed, 'title' | 'room_id' | 'sort_order' | 'completed'>>
): Promise<void> {
  const { error } = await supabase.from('renovation_needs').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteNeed(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_needs').delete().eq('id', id)
  if (error) throw error
}

// --- Service providers ---

export async function listProviders(projectId: string): Promise<RenovationProvider[]> {
  const { data, error } = await supabase
    .from('renovation_providers')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')
    .order('name')

  if (error) throw error
  return (data || []) as RenovationProvider[]
}

export async function createProvider(
  projectId: string,
  row: {
    name: string
    description?: string | null
    phone?: string | null
    email?: string | null
    additional_info?: string | null
  }
): Promise<RenovationProvider> {
  const { data, error } = await supabase
    .from('renovation_providers')
    .insert({
      project_id: projectId,
      name: row.name.trim(),
      description: row.description?.trim() || null,
      phone: row.phone?.trim() || null,
      email: row.email?.trim() || null,
      additional_info: row.additional_info?.trim() || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as RenovationProvider
}

export async function updateProvider(
  id: string,
  updates: Partial<
    Pick<RenovationProvider, 'name' | 'description' | 'phone' | 'email' | 'additional_info' | 'sort_order'>
  >
): Promise<void> {
  const { error } = await supabase.from('renovation_providers').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteProvider(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_providers').delete().eq('id', id)
  if (error) throw error
}

// --- Calendar events ---

export async function listCalendarEvents(projectId: string): Promise<RenovationCalendarEvent[]> {
  const { data, error } = await supabase
    .from('renovation_calendar_events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data || []) as RenovationCalendarEvent[]
  let providers: RenovationProvider[] = []
  let members: RenovationTeamMember[] = []
  try {
    providers = await listProviders(projectId)
  } catch {
    providers = []
  }
  try {
    members = await listTeamMembers(projectId)
  } catch {
    members = []
  }
  const providerMap = new Map(providers.map((p) => [p.id, p]))
  const memberMap = new Map(members.map((m) => [m.id, m]))
  return rows.map((e) => ({
    ...e,
    address: e.address ?? null,
    created_by_member_id: e.created_by_member_id ?? null,
    provider: e.provider_id ? providerMap.get(e.provider_id) ?? null : null,
    created_by: e.created_by_member_id ? memberMap.get(e.created_by_member_id) ?? null : null,
  }))
}

export async function createCalendarEvent(
  projectId: string,
  row: {
    event_type: CalendarEventType
    title: string
    body?: string | null
    address?: string | null
    provider_id?: string | null
    created_by_member_id?: string | null
    is_all_day: boolean
    start_date?: string | null
    end_date?: string | null
    starts_at?: string | null
    ends_at?: string | null
  }
): Promise<RenovationCalendarEvent> {
  const title = row.title.trim()
  const body = row.body?.trim() || null
  const address = row.address?.trim() || null
  const isAllDay = row.is_all_day
  const eventType = row.event_type
  const providerId = eventType === 'provider_meeting' ? row.provider_id ?? null : null

  const insert = isAllDay
    ? {
        project_id: projectId,
        event_type: eventType,
        title,
        body,
        address,
        created_by_member_id: row.created_by_member_id ?? null,
        provider_id: providerId,
        is_all_day: true,
        start_date: row.start_date!,
        end_date: row.end_date && row.end_date >= row.start_date! ? row.end_date : row.start_date!,
        starts_at: null,
        ends_at: null,
      }
    : {
        project_id: projectId,
        event_type: eventType,
        title,
        body,
        address,
        created_by_member_id: row.created_by_member_id ?? null,
        provider_id: providerId,
        is_all_day: false,
        start_date: null,
        end_date: null,
        starts_at: row.starts_at!,
        ends_at: row.ends_at?.trim() ? row.ends_at : defaultTimedEnd(row.starts_at!),
      }

  const { data, error } = await supabase.from('renovation_calendar_events').insert(insert).select().single()

  if (error) throw error
  return data as RenovationCalendarEvent
}

export async function updateCalendarEvent(
  id: string,
  row: {
    event_type: CalendarEventType
    title: string
    body?: string | null
    address?: string | null
    provider_id?: string | null
    is_all_day: boolean
    start_date?: string | null
    end_date?: string | null
    starts_at?: string | null
    ends_at?: string | null
  }
): Promise<void> {
  const title = row.title.trim()
  const body = row.body?.trim() || null
  const address = row.address !== undefined ? (row.address?.trim() || null) : undefined
  const isAllDay = row.is_all_day
  const eventType = row.event_type
  const providerId = eventType === 'provider_meeting' ? row.provider_id ?? null : null

  const baseAllDay = {
    event_type: eventType,
    title,
    body,
    provider_id: providerId,
    is_all_day: true,
    start_date: row.start_date!,
    end_date: row.end_date && row.end_date >= row.start_date! ? row.end_date : row.start_date!,
    starts_at: null,
    ends_at: null,
  }
  const baseTimed = {
    event_type: eventType,
    title,
    body,
    provider_id: providerId,
    is_all_day: false,
    start_date: null,
    end_date: null,
    starts_at: row.starts_at!,
    ends_at: row.ends_at?.trim() ? row.ends_at : defaultTimedEnd(row.starts_at!),
  }
  const updates = {
    ...(isAllDay ? baseAllDay : baseTimed),
    ...(address !== undefined ? { address } : {}),
  }

  const { error } = await supabase.from('renovation_calendar_events').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_calendar_events').delete().eq('id', id)
  if (error) throw error
}

// --- Gallery tags ---

export async function listGalleryTags(projectId: string): Promise<RenovationGalleryTag[]> {
  const { data, error } = await supabase
    .from('renovation_gallery_tags')
    .select('*')
    .eq('project_id', projectId)
    .order('name')

  if (error) throw error
  return (data || []) as RenovationGalleryTag[]
}

export async function createGalleryTag(projectId: string, name: string): Promise<RenovationGalleryTag> {
  const { data, error } = await supabase
    .from('renovation_gallery_tags')
    .insert({ project_id: projectId, name })
    .select()
    .single()

  if (error) throw error
  return data as RenovationGalleryTag
}

export async function deleteGalleryTag(id: string): Promise<void> {
  const { error } = await supabase.from('renovation_gallery_tags').delete().eq('id', id)
  if (error) throw error
}

async function loadGalleryTagIds(itemIds: string[]): Promise<Map<string, string[]>> {
  if (itemIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('renovation_gallery_item_tags')
    .select('gallery_item_id, tag_id')
    .in('gallery_item_id', itemIds)

  if (error) throw error
  const map = new Map<string, string[]>()
  for (const row of data || []) {
    const id = row.gallery_item_id as string
    const list = map.get(id) || []
    list.push(row.tag_id as string)
    map.set(id, list)
  }
  return map
}

export async function listGalleryItems(projectId: string): Promise<RenovationGalleryItem[]> {
  const { data, error } = await supabase
    .from('renovation_gallery_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  const items = (data || []) as RenovationGalleryItem[]
  const tagMap = await loadGalleryTagIds(items.map((i) => i.id))
  return items.map((i) => ({
    ...i,
    tag_ids: tagMap.get(i.id) || [],
    public_url: renovationPublicUrl(i.storage_path),
  }))
}

export async function createGalleryItem(
  projectId: string,
  row: {
    storage_path: string
    caption?: string | null
    taken_at?: string | null
    room_id?: string | null
    tag_ids?: string[]
  }
): Promise<RenovationGalleryItem> {
  const { data, error } = await supabase
    .from('renovation_gallery_items')
    .insert({
      project_id: projectId,
      storage_path: row.storage_path,
      caption: row.caption ?? null,
      taken_at: row.taken_at ?? null,
      room_id: row.room_id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  const item = data as RenovationGalleryItem
  if (row.tag_ids?.length) {
    await supabase.from('renovation_gallery_item_tags').insert(
      row.tag_ids.map((tag_id) => ({ gallery_item_id: item.id, tag_id }))
    )
  }
  return { ...item, public_url: renovationPublicUrl(item.storage_path) }
}

export async function updateGalleryItem(
  id: string,
  updates: Partial<Pick<RenovationGalleryItem, 'caption' | 'taken_at' | 'room_id'>>,
  tagIds?: string[]
): Promise<void> {
  const { error } = await supabase.from('renovation_gallery_items').update(updates).eq('id', id)
  if (error) throw error
  if (tagIds !== undefined) {
    await supabase.from('renovation_gallery_item_tags').delete().eq('gallery_item_id', id)
    if (tagIds.length) {
      await supabase
        .from('renovation_gallery_item_tags')
        .insert(tagIds.map((tag_id) => ({ gallery_item_id: id, tag_id })))
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateGalleryItemAnnotations(id: string, annotations: any[]): Promise<void> {
  const { error } = await supabase
    .from('renovation_gallery_items')
    .update({ annotations })
    .eq('id', id)
  if (error) throw error
}

export async function deleteGalleryItem(item: RenovationGalleryItem): Promise<void> {
  await supabase.storage.from(BUCKET).remove([item.storage_path])
  const { error } = await supabase.from('renovation_gallery_items').delete().eq('id', item.id)
  if (error) throw error
}

export async function deleteGalleryItems(items: RenovationGalleryItem[]): Promise<void> {
  if (items.length === 0) return
  const paths = items.map(i => i.storage_path)
  const ids = items.map(i => i.id)

  await supabase.storage.from(BUCKET).remove(paths)
  const { error } = await supabase.from('renovation_gallery_items').delete().in('id', ids)
  if (error) throw error
}

export async function bulkAddTagToGalleryItems(itemIds: string[], tagId: string): Promise<void> {
  if (itemIds.length === 0) return
  const inserts = itemIds.map(id => ({ gallery_item_id: id, tag_id: tagId }))
  // Since we might be adding duplicate tags, we ignore unique constraint errors by upserting or just letting onConflict handle it if supported.
  // Wait, `renovation_gallery_item_tags` primary key is `(gallery_item_id, tag_id)`.
  const { error } = await supabase
    .from('renovation_gallery_item_tags')
    .upsert(inserts, { onConflict: 'gallery_item_id, tag_id' })
  if (error) throw error
}

export async function bulkUpdateGalleryItemsRoom(itemIds: string[], roomId: string | null): Promise<void> {
  if (itemIds.length === 0) return
  const { error } = await supabase
    .from('renovation_gallery_items')
    .update({ room_id: roomId })
    .in('id', itemIds)
  if (error) throw error
}

export async function uploadGalleryPhoto(projectId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${projectId}/gallery/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

// --- Project files (renovation-files bucket) ---

export async function listProjectFiles(projectId: string): Promise<RenovationFile[]> {
  const { data, error } = await supabase
    .from('renovation_files')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  const rows = (data || []) as RenovationFile[]
  const rooms = await listRooms(projectId)
  const roomMap = new Map(rooms.map((r) => [r.id, r]))
  return rows.map((f) => ({
    ...f,
    public_url: projectFilePublicUrl(f),
    room: f.room_id ? roomMap.get(f.room_id) ?? null : null,
  }))
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  roomId?: string | null
): Promise<RenovationFile> {
  const safeName = file.name.replace(/[^\w.\-()\s\u0590-\u05FF]+/g, '_').trim() || 'file'
  const ext = safeName.includes('.') ? safeName.split('.').pop() || 'bin' : 'bin'

  if (renovationFilesUseDropbox()) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('projectId', projectId)
    if (roomId) fd.append('roomId', roomId)
    const res = await fetch('/api/renovation/files/upload', { method: 'POST', body: fd })
    if (!res.ok) {
      let msg = await res.text()
      try {
        const j = JSON.parse(msg) as { error?: string }
        if (j.error) msg = j.error
      } catch {
        /* keep text */
      }
      throw new Error(msg || 'Upload failed')
    }
    const meta = (await res.json()) as {
      storage_path: string
      display_name: string
      original_name: string
      mime_type: string | null
      file_size: number
    }
    const { data, error } = await supabase
      .from('renovation_files')
      .insert({
        project_id: projectId,
        storage_path: meta.storage_path,
        display_name: meta.display_name,
        original_name: meta.original_name,
        mime_type: meta.mime_type,
        file_size: meta.file_size,
        room_id: roomId ?? null,
      })
      .select()
      .single()

    if (error) throw error
    const row = data as RenovationFile
    return {
      ...row,
      public_url: projectFilePublicUrl(row),
    }
  }

  const path = `${projectId}/files/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await supabase.storage.from(FILES_BUCKET).upload(path, file, { upsert: false })
  if (upErr) throw upErr

  const displayName = safeName
  const { data, error } = await supabase
    .from('renovation_files')
    .insert({
      project_id: projectId,
      storage_path: path,
      display_name: displayName,
      original_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      room_id: roomId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  const row = data as RenovationFile
  return {
    ...row,
    public_url: projectFilePublicUrl(row),
  }
}

export async function updateProjectFile(
  id: string,
  updates: Partial<Pick<RenovationFile, 'display_name' | 'room_id'>>
): Promise<void> {
  const { error } = await supabase.from('renovation_files').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteProjectFile(file: RenovationFile): Promise<void> {
  if (renovationFilesUseDropbox()) {
    const res = await fetch('/api/renovation/files/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: file.id }),
    })
    if (!res.ok) {
      let msg = await res.text()
      try {
        const j = JSON.parse(msg) as { error?: string }
        if (j.error) msg = j.error
      } catch {
        /* keep */
      }
      throw new Error(msg || 'Delete failed')
    }
    return
  }

  await supabase.storage.from(FILES_BUCKET).remove([file.storage_path])
  const { error } = await supabase.from('renovation_files').delete().eq('id', file.id)
  if (error) throw error
}

export function expensesThisMonth(expenses: RenovationExpense[]): number {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return expenses
    .filter((e) => !expenseIsPlanned(e))
    .filter((e) => e.expense_date != null && e.expense_date !== '')
    .filter((e) => {
      const d = new Date(e.expense_date! + 'T12:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    })
    .reduce((s, e) => s + Number(e.amount), 0)
}
