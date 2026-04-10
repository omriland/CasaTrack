'use client'

type Props = {
  budget: number
  /** Effective actual (spentTotal if > 0, else budgetTotal) */
  actual: number
  paid: number
}

export function VendorBudgetProgressBar({ budget, actual, paid }: Props) {
  if (budget <= 0 && actual <= 0 && paid <= 0) return null

  const cap = Math.max(budget, actual, 1)
  const paidW = Math.min(100, (Math.min(paid, cap) / cap) * 100)
  const unpaidInBudget = Math.max(0, Math.min(actual, budget) - paid)
  const amberW = (unpaidInBudget / cap) * 100
  const overAmt = Math.max(0, actual - Math.max(budget, paid))
  const redW = (overAmt / cap) * 100

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      {paidW > 0 && <div className="h-full bg-emerald-500" style={{ width: `${paidW}%` }} />}
      {amberW > 0 && <div className="h-full bg-amber-400" style={{ width: `${amberW}%` }} />}
      {redW > 0 && <div className="h-full bg-rose-500" style={{ width: `${redW}%` }} />}
    </div>
  )
}
