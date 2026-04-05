import type { RenovationExpense } from '@/types/renovation'

export const EMPTY_VENDOR_KEY = '__none__'

export function normalizeVendorKey(vendor: string | null | undefined): string {
  const t = (vendor ?? '').trim()
  return t.length === 0 ? EMPTY_VENDOR_KEY : t.toLowerCase()
}

export type VendorBudgetRowModel = {
  key: string
  displayVendor: string
  budgetTotal: number
  spentTotal: number
  plannedIds: string[]
  spentIds: string[]
  /** Oldest first — kept when merging spent rows */
  spentChronological: RenovationExpense[]
  plannedChronological: RenovationExpense[]
}

export function buildVendorBudgetRows(expenses: RenovationExpense[]): VendorBudgetRowModel[] {
  const byKey = new Map<
    string,
    {
      displayVendor: string
      planned: RenovationExpense[]
      spent: RenovationExpense[]
    }
  >()

  for (const e of expenses) {
    const k = normalizeVendorKey(e.vendor)
    const display = (e.vendor ?? '').trim() || '(No vendor)'
    const g = byKey.get(k)
    if (!g) {
      byKey.set(k, { displayVendor: display, planned: [], spent: [] })
    } else {
      if (g.displayVendor === '(No vendor)' && display !== '(No vendor)') {
        g.displayVendor = display
      }
    }
    const grp = byKey.get(k)!
    if (e.is_planned === true) grp.planned.push(e)
    else grp.spent.push(e)
  }

  const rows: VendorBudgetRowModel[] = []
  for (const [key, g] of byKey) {
    const spentChronological = [...g.spent].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const plannedChronological = [...g.planned].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    rows.push({
      key,
      displayVendor: g.displayVendor,
      budgetTotal: g.planned.reduce((s, x) => s + Number(x.amount), 0),
      spentTotal: g.spent.reduce((s, x) => s + Number(x.amount), 0),
      plannedIds: g.planned.map((x) => x.id),
      spentIds: g.spent.map((x) => x.id),
      spentChronological,
      plannedChronological,
    })
  }

  rows.sort((a, b) => a.displayVendor.localeCompare(b.displayVendor, undefined, { sensitivity: 'base' }))
  return rows
}

/** Prefer spent row for attachments; else planned; else null */
export function pickAttachmentTargetExpenseId(row: VendorBudgetRowModel): string | null {
  if (row.spentChronological.length > 0) return row.spentChronological[0]!.id
  if (row.plannedChronological.length > 0) return row.plannedChronological[0]!.id
  return null
}
