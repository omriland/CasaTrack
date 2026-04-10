import type { VendorBudgetRowModel } from '@/lib/renovation-vendor-budget'

export function exportVendorBudgetCsv(
  rows: VendorBudgetRowModel[],
  roomNameById: Map<string, string>,
  paidSumForVendor: (key: string) => number
): void {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
  const headers = ['Vendor', 'Rooms', 'Budget', 'Actual', 'Paid', 'Paid %']
  const lines = [headers.join(',')]

  for (const r of rows) {
    const rooms = r.room_ids
      .map((id) => roomNameById.get(id) ?? '')
      .filter(Boolean)
      .join('; ')
    const effectiveActual = r.spentTotal > 0 ? r.spentTotal : r.budgetTotal
    const paid = paidSumForVendor(r.key)
    const pct = effectiveActual > 0 ? Math.round((paid / effectiveActual) * 100) : 0

    lines.push(
      [esc(r.displayVendor), esc(rooms), r.budgetTotal, effectiveActual, paid, `${pct}%`].join(',')
    )
  }

  const blob = new Blob(['\uFEFF' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vendor-budget-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
