export type WishlistTotalInput = {
  id: string
  unit_price: number | null
  quantity: number | null
}

export type WishlistSummary = {
  rowTotals: Record<string, number>
  total: number
}

export function calculateWishlistSummary(items: WishlistTotalInput[]): WishlistSummary {
  return items.reduce<WishlistSummary>(
    (summary, item) => {
      const unitPrice = item.unit_price ?? 0
      const quantity = item.quantity ?? 0
      const rowTotal = unitPrice * quantity

      summary.rowTotals[item.id] = rowTotal
      summary.total += rowTotal

      return summary
    },
    { rowTotals: {}, total: 0 }
  )
}
