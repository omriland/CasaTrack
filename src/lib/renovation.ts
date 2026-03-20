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
} from '@/types/renovation'

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

export async function listBudgetLines(projectId: string): Promise<RenovationBudgetLine[]> {
  const { data, error } = await supabase
    .from('renovation_budget_lines')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order')

  if (error) throw error
  return (data || []) as RenovationBudgetLine[]
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
  return data as RenovationBudgetLine
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

export async function listExpenses(projectId: string): Promise<RenovationExpense[]> {
  const { data, error } = await supabase
    .from('renovation_expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as RenovationExpense[]
}

export async function sumExpenses(projectId: string): Promise<number> {
  const expenses = await listExpenses(projectId)
  return expenses.reduce((s, e) => s + Number(e.amount), 0)
}

export async function createExpense(
  projectId: string,
  row: {
    amount: number
    expense_date?: string
    vendor?: string | null
    category?: string | null
    notes?: string | null
    payment_method?: string | null
    receipt_storage_path?: string | null
  }
): Promise<RenovationExpense> {
  const { data, error } = await supabase
    .from('renovation_expenses')
    .insert({
      project_id: projectId,
      amount: row.amount,
      expense_date: row.expense_date || new Date().toISOString().slice(0, 10),
      vendor: row.vendor ?? null,
      category: row.category ?? null,
      notes: row.notes ?? null,
      payment_method: row.payment_method ?? null,
      receipt_storage_path: row.receipt_storage_path ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as RenovationExpense
}

export async function updateExpense(
  id: string,
  updates: Partial<
    Pick<
      RenovationExpense,
      'amount' | 'expense_date' | 'vendor' | 'category' | 'notes' | 'payment_method' | 'receipt_storage_path'
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
    provider_id: t.provider_id ?? null,
    assignee: t.assignee_id ? memberMap.get(t.assignee_id) ?? null : null,
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

export async function createRoom(projectId: string, name: string, notes?: string | null): Promise<RenovationRoom> {
  const { data, error } = await supabase
    .from('renovation_rooms')
    .insert({ project_id: projectId, name, notes: notes ?? null })
    .select()
    .single()

  if (error) throw error
  return data as RenovationRoom
}

export async function updateRoom(
  id: string,
  updates: Partial<Pick<RenovationRoom, 'name' | 'notes'>>
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
  updates: Partial<Pick<RenovationNeed, 'title' | 'room_id' | 'sort_order'>>
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
    public_url: renovationFilesPublicUrl(f.storage_path),
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
    public_url: renovationFilesPublicUrl(row.storage_path),
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
  await supabase.storage.from(FILES_BUCKET).remove([file.storage_path])
  const { error } = await supabase.from('renovation_files').delete().eq('id', file.id)
  if (error) throw error
}

export function expensesThisMonth(expenses: RenovationExpense[]): number {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return expenses
    .filter((e) => {
      const d = new Date(e.expense_date + 'T12:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    })
    .reduce((s, e) => s + Number(e.amount), 0)
}
