import type { TableRow } from './vendor-budget-types'

export type BudgetGridInsertRow = { kind: 'insert'; id: string; afterKey: string | null }

export type BudgetGridBodyRow = {
  kind: 'body'
  id: string
  tableRow: TableRow
  vendor: string
  budget: number
  actual: number
  actualGhost: boolean
}

export type BudgetGridTotalsRow = {
  kind: 'totals'
  id: string
  vendor: string
  budget: number
  actual: number
}

export type BudgetGridRow = BudgetGridInsertRow | BudgetGridBodyRow | BudgetGridTotalsRow

function bodyRowFromTableRow(r: TableRow, rowKeyFn: (r: TableRow) => string): BudgetGridBodyRow {
  if (r.kind === 'draft') {
    return {
      kind: 'body',
      id: rowKeyFn(r),
      tableRow: r,
      vendor: r.draft.vendorInput,
      budget: 0,
      actual: 0,
      actualGhost: false,
    }
  }
  const m = r.model
  const hasReal = m.spentTotal > 0
  return {
    kind: 'body',
    id: rowKeyFn(r),
    tableRow: r,
    vendor: m.displayVendor,
    budget: m.budgetTotal,
    actual: hasReal ? m.spentTotal : m.budgetTotal,
    actualGhost: !hasReal && m.budgetTotal > 0,
  }
}

export function buildBudgetGridRows(tableRows: TableRow[], rowKeyFn: (r: TableRow) => string): BudgetGridRow[] {
  const out: BudgetGridRow[] = []
  out.push({ kind: 'insert', id: 'ins-top', afterKey: null })
  for (const r of tableRows) {
    out.push(bodyRowFromTableRow(r, rowKeyFn))
    out.push({ kind: 'insert', id: `ins-${rowKeyFn(r)}`, afterKey: rowKeyFn(r) })
  }
  return out
}
