'use client'

import dynamic from 'next/dynamic'
import { VendorDetailDrawer } from '@/components/renovation/VendorDetailDrawer'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useRenovationMobile } from '@/components/renovation/RenovationViewportContext'
import {
  createVendorPayment,
  deleteExpense,
  listExpenses,
  listVendorPayments,
  renameVendorAcrossExpenses,
  setVendorPlannedTotal,
  setVendorSpentTotal,
  sumPlannedExpenses,
} from '@/lib/renovation'
import { buildVendorBudgetRows, type VendorBudgetRowModel } from '@/lib/renovation-vendor-budget'
import { formatIls } from '@/lib/renovation-format'
import type { RenovationExpense, RenovationVendorPayment } from '@/types/renovation'
import { cn } from '@/utils/common'
import type { DraftRow, TableRow } from './vendor-budget-types'

const START_KEY = '__start__'

const VendorBudgetDesktopGrid = dynamic(
  () => import('./VendorBudgetDesktopGrid').then((m) => m.VendorBudgetDesktopGrid),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(72vh,760px)] min-h-[320px] rounded-2xl bg-slate-100 animate-pulse" />
    ),
  }
)

type EditState = {
  rowKey: string
  field: 'vendor' | 'budget' | 'actual'
  value: string
}

function mergeTableRows(dataModels: VendorBudgetRowModel[], drafts: DraftRow[]): TableRow[] {
  const byAfter = new Map<string, DraftRow[]>()
  for (const d of drafts) {
    const parent = d.insertAfter ?? START_KEY
    const list = byAfter.get(parent) ?? []
    list.push(d)
    byAfter.set(parent, list)
  }
  const out: TableRow[] = []
  const emitChain = (parentKey: string) => {
    for (const d of byAfter.get(parentKey) ?? []) {
      out.push({ kind: 'draft', draft: d })
      emitChain(d.localKey)
    }
  }
  emitChain(START_KEY)
  for (const m of dataModels) {
    out.push({ kind: 'data', model: m })
    emitChain(m.key)
  }
  return out
}

function parseAmountInput(raw: string): number | null {
  const n = Number(raw.replace(/,/g, '').replace(/^\s+|\s+$/g, ''))
  if (Number.isNaN(n) || n < 0) return null
  return n
}

/** LTR number / amount cell — keeps digits readable in RTL layout */
function LtrAmount({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span dir="ltr" className={cn('inline-block w-full text-end', className)}>
      {children}
    </span>
  )
}

/** Same “actual” cap as the table column (spent total, or budget mirror when no spend). */
function vendorActualCap(m: VendorBudgetRowModel): number {
  const hasReal = m.spentTotal > 0
  return hasReal ? m.spentTotal : m.budgetTotal
}

function vendorPaidProgress(paidSum: number, m: VendorBudgetRowModel): number {
  const cap = vendorActualCap(m)
  if (cap <= 0) return paidSum > 0 ? 1 : 0
  return Math.min(1, paidSum / cap)
}

/** RTL: paid portion fills from the right (physical start of the row). */
function rowPaidBackgroundStyle(progress: number): CSSProperties {
  const pct = Math.min(100, Math.max(0, progress * 100))
  return {
    background: `linear-gradient(to left, rgb(236 253 245) 0%, rgb(236 253 245) ${pct}%, rgb(248 250 252) ${pct}%, rgb(248 250 252) 100%)`,
  }
}

function VendorPaymentModal({
  open,
  vendorLabel,
  payments,
  onClose,
  onAdd,
}: {
  open: boolean
  vendorLabel: string
  payments: RenovationVendorPayment[]
  onClose: () => void
  onAdd: (amount: number, note: string) => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount('')
      setNote('')
    }
  }, [open])

  if (!open) return null

  const handleAmount = (raw: string) => {
    const v = raw.replace(/[^0-9.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) return
    setAmount(parts.join('.'))
  }

  return (
    <div
      className="fixed inset-0 z-[265] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-xl sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-900">Add payment</h2>
        <p className="text-sm text-slate-500 mt-1" dir="auto">
          {vendorLabel}
        </p>

        {payments.length > 0 && (
          <ol className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[14px]">
            {payments.map((p, i) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-2" dir="auto">
                <span className="font-bold text-slate-500 tabular-nums">{i + 1}.</span>
                <span dir="ltr" className="font-bold tabular-nums text-slate-900">
                  {formatIls(Number(p.amount))}
                </span>
                {p.note?.trim() ? <span className="text-slate-700">{p.note.trim()}</span> : null}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="vp-amount" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Amount
            </label>
            <div className="mt-1 flex items-baseline gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-slate-400">₪</span>
              <input
                id="vp-amount"
                dir="ltr"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmount(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[18px] font-bold tabular-nums outline-none"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label htmlFor="vp-note" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Note
            </label>
            <input
              id="vp-note"
              dir="auto"
              value={note}
              maxLength={120}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Short description"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[15px] font-medium"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2 flex-row-reverse">
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              const n = Number(amount.replace(/,/g, ''))
              if (Number.isNaN(n) || n <= 0) {
                alert('Enter a positive amount.')
                return
              }
              setSaving(true)
              try {
                await onAdd(n, note.trim())
                onClose()
              } catch (e) {
                console.error(e)
                alert('Could not save payment. Run 17_vendor_payments.sql in Supabase.')
              } finally {
                setSaving(false)
              }
            }}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-[15px] font-bold text-white disabled:opacity-50"
          >
            {saving ? '…' : 'Add payment'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-[15px] font-bold text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function MobileRowInsertHandle({ onInsert, label }: { onInsert: () => void; label: string }) {
  return (
    <div className="group/ins relative -my-1 flex h-8 items-center justify-center">
      <button
        type="button"
        aria-label={`Insert row — ${label}`}
        onClick={(e) => {
          e.stopPropagation()
          onInsert()
        }}
        className="absolute inset-x-0 flex h-full w-full items-center justify-center"
      >
        <span className="pointer-events-none absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-transparent transition-colors group-hover/ins:bg-indigo-400" />
        <span className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-full border-2 border-indigo-500 bg-white text-[15px] font-bold text-indigo-600 opacity-0 shadow-sm transition-opacity group-hover/ins:opacity-100">
          +
        </span>
      </button>
    </div>
  )
}

export function VendorBudgetView({ projectId }: { projectId: string }) {
  const isMobile = useRenovationMobile()
  const [expenses, setExpenses] = useState<RenovationExpense[]>([])
  const [drafts, setDrafts] = useState<DraftRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; row: TableRow } | null>(null)
  const [payments, setPayments] = useState<RenovationVendorPayment[]>([])
  const [paymentModal, setPaymentModal] = useState<{ vendorKey: string; displayVendor: string } | null>(null)
  const [viewPaymentsModal, setViewPaymentsModal] = useState<{ vendorKey: string; displayVendor: string } | null>(null)
  const [detailVendor, setDetailVendor] = useState<VendorBudgetRowModel | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTouch = useRef({ x: 0, y: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ex, pay] = await Promise.all([listExpenses(projectId), listVendorPayments(projectId)])
      setExpenses(ex)
      setPayments(pay)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('[data-vendor-budget-menu="1"]')) return
      setMenu(null)
    }
    const t = setTimeout(() => window.addEventListener('mousedown', close), 0)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousedown', close)
    }
  }, [menu])

  const dataModels = useMemo(() => buildVendorBudgetRows(expenses), [expenses])

  const tableRows: TableRow[] = useMemo(() => mergeTableRows(dataModels, drafts), [dataModels, drafts])

  const paymentsByVendor = useMemo(() => {
    const m = new Map<string, RenovationVendorPayment[]>()
    for (const p of payments) {
      const list = m.get(p.vendor_key) ?? []
      list.push(p)
      m.set(p.vendor_key, list)
    }
    return m
  }, [payments])

  const paidSumForVendor = useCallback(
    (vendorKey: string) => (paymentsByVendor.get(vendorKey) ?? []).reduce((s, p) => s + Number(p.amount), 0),
    [paymentsByVendor]
  )

  const dataRowSurfaceStyle = useCallback(
    (r: TableRow): CSSProperties | undefined => {
      if (r.kind !== 'data') return undefined
      const paid = paidSumForVendor(r.model.key)
      const progress = vendorPaidProgress(paid, r.model)
      return rowPaidBackgroundStyle(progress)
    },
    [paidSumForVendor]
  )

  const addDraftAfter = useCallback((afterKey: string | null) => {
    setDrafts((prev) => [
      ...prev,
      { localKey: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, vendorInput: '', insertAfter: afterKey },
    ])
  }, [])

  const footerBudget = sumPlannedExpenses(expenses)
  // Effective actual total: real spent if entered, otherwise fallback to budget
  const footerActual = useMemo(() => {
    return dataModels.reduce((sum, m) => {
      const effectiveActual = m.spentTotal > 0 ? m.spentTotal : m.budgetTotal
      return sum + effectiveActual
    }, 0)
  }, [dataModels])

  const rowKey = (r: TableRow) => (r.kind === 'draft' ? r.draft.localKey : r.model.key)

  const vendorLabelForRow = (r: TableRow) =>
    r.kind === 'draft' ? r.draft.vendorInput.trim() || 'New vendor' : r.model.displayVendor

  const commitVendor = async (r: TableRow, raw: string) => {
    const next = raw.trim()
    if (r.kind === 'draft') {
      setDrafts((prev) => prev.map((d) => (d.localKey === r.draft.localKey ? { ...d, vendorInput: next } : d)))
      return
    }
    if (next === r.model.displayVendor) return
    if (!next) {
      alert('שם הספק לא יכול להיות ריק.')
      return
    }
    await renameVendorAcrossExpenses(projectId, r.model.key, next)
    await load()
  }

  const commitBudget = async (r: TableRow, raw: string) => {
    const n = parseAmountInput(raw)
    if (n === null) {
      alert('הזן סכום תקין.')
      return
    }
    if (r.kind === 'draft') {
      const v = r.draft.vendorInput.trim()
      if (!v) {
        alert('תן שם לספק (לחיצה כפולה על עמודת הספק).')
        return
      }
      await setVendorPlannedTotal(projectId, v, n)
      setDrafts((prev) => prev.filter((d) => d.localKey !== r.draft.localKey))
      await load()
      return
    }
    await setVendorPlannedTotal(projectId, r.model.displayVendor, n)
    await load()
  }

  const commitActual = async (r: TableRow, raw: string) => {
    const n = parseAmountInput(raw)
    if (n === null) {
      alert('הזן סכום תקין.')
      return
    }
    if (r.kind === 'draft') {
      const v = r.draft.vendorInput.trim()
      if (!v) {
        alert('תן שם לספק (לחיצה כפולה על עמודת הספק).')
        return
      }
      await setVendorSpentTotal(projectId, v, n)
      setDrafts((prev) => prev.filter((d) => d.localKey !== r.draft.localKey))
      await load()
      return
    }
    await setVendorSpentTotal(projectId, r.model.displayVendor, n)
    await load()
  }

  const onGridBodyContextMenu = useCallback((tableRow: TableRow, clientX: number, clientY: number) => {
    setMenu({ x: clientX, y: clientY, row: tableRow })
  }, [])

  const getPaidSum = useCallback(
    (tableRow: TableRow): number => {
      if (tableRow.kind !== 'data') return 0
      return paidSumForVendor(tableRow.model.key)
    },
    [paidSumForVendor]
  )

  const handleGridCellValueChanged = async (tableRow: TableRow, field: 'vendor' | 'budget' | 'actual', newValue: string, revert: () => void) => {
    try {
      if (field === 'vendor') {
        const s = newValue;
        if (tableRow.kind === 'data' && !s.trim()) {
          revert()
          alert('שם הספק לא יכול להיות ריק.')
          return
        }
        await commitVendor(tableRow, s)
        return
      }
      if (field === 'budget') {
        if (parseAmountInput(newValue) === null) {
          revert()
          alert('הזן סכום תקין.')
          return
        }
        if (tableRow.kind === 'draft' && (!tableRow.draft.vendorInput || !tableRow.draft.vendorInput.trim())) {
          revert()
          alert('תן שם לספק לפני הזנת תקציב.')
          return
        }
        await commitBudget(tableRow, newValue)
        return
      }
      if (field === 'actual') {
        if (parseAmountInput(newValue) === null) {
          revert()
          alert('הזן סכום תקין.')
          return
        }
        if (tableRow.kind === 'draft' && (!tableRow.draft.vendorInput || !tableRow.draft.vendorInput.trim())) {
          revert()
          alert('תן שם לספק לפני הזנת תקציב.')
          return
        }
        await commitActual(tableRow, newValue)
      }
    } catch (err) {
      console.error(err)
      revert()
      alert('השמירה נכשלה.')
    }
  }

  const finishEdit = async () => {
    if (!editing) return
    const r = tableRows.find((x) => rowKey(x) === editing.rowKey)
    if (!r) {
      setEditing(null)
      return
    }
    try {
      if (editing.field === 'vendor') await commitVendor(r, editing.value)
      else if (editing.field === 'budget') await commitBudget(r, editing.value)
      else await commitActual(r, editing.value)
    } catch (e) {
      console.error(e)
      alert('השמירה נכשלה.')
    }
    setEditing(null)
  }

  const startEdit = (r: TableRow, field: EditState['field']) => {
    if (r.kind === 'draft') {
      if (field === 'vendor') setEditing({ rowKey: r.draft.localKey, field, value: r.draft.vendorInput })
      if (field === 'budget') setEditing({ rowKey: r.draft.localKey, field, value: '0' })
      if (field === 'actual') setEditing({ rowKey: r.draft.localKey, field, value: '0' })
      return
    }
    const m = r.model
    if (field === 'vendor') setEditing({ rowKey: m.key, field, value: m.displayVendor })
    if (field === 'budget') setEditing({ rowKey: m.key, field, value: String(Math.round(m.budgetTotal)) })
    if (field === 'actual') {
      const hasReal = m.spentTotal > 0
      const show = hasReal ? m.spentTotal : m.budgetTotal
      setEditing({ rowKey: m.key, field, value: String(Math.round(show)) })
    }
  }

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const renderCell = (r: TableRow, field: 'vendor' | 'budget' | 'actual') => {
    const key = rowKey(r)
    const isEditing = editing?.rowKey === key && editing?.field === field
    const numInputCls =
      'w-full rounded-lg border border-indigo-300 px-2 py-1 tabular-nums font-bold text-end'

    if (r.kind === 'draft') {
      if (field === 'vendor') {
        if (isEditing) {
          return (
            <input
              autoFocus
              dir="auto"
              value={editing?.value || ''}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))}
              onBlur={() => void finishEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void finishEdit()
                if (e.key === 'Escape') setEditing(null)
              }}
              className="w-full min-w-0 rounded-lg border border-indigo-300 px-2 py-1 text-[14px] font-semibold"
            />
          )
        }
        return (
          <span className={cn('block truncate', !r.draft.vendorInput.trim() && 'text-slate-400 italic')}>
            {r.draft.vendorInput.trim() || 'Double-click to name'}
          </span>
        )
      }
      if (field === 'budget') {
        if (isEditing) {
          return (
            <input
              autoFocus
              dir="ltr"
              inputMode="decimal"
              value={editing?.value || ''}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))}
              onBlur={() => void finishEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void finishEdit()
                if (e.key === 'Escape') setEditing(null)
              }}
              className={numInputCls}
            />
          )
        }
        return (
          <LtrAmount className="text-slate-400">
            {formatIls(0)}
          </LtrAmount>
        )
      }
      if (field === 'actual') {
        if (isEditing) {
          return (
            <input
              autoFocus
              dir="ltr"
              inputMode="decimal"
              value={editing?.value || ''}
              onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))}
              onBlur={() => void finishEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void finishEdit()
                if (e.key === 'Escape') setEditing(null)
              }}
              className={numInputCls}
            />
          )
        }
        return (
          <LtrAmount className="text-slate-400">
            {formatIls(0)}
          </LtrAmount>
        )
      }
      return null
    }

    const m = r.model
    const hasRealSpent = m.spentTotal > 0
    const displayActual = hasRealSpent ? m.spentTotal : m.budgetTotal
    const actualGhost = !hasRealSpent && m.budgetTotal > 0

    if (field === 'vendor') {
      if (isEditing) {
        return (
          <input
            autoFocus
            dir="auto"
            value={editing?.value || ''}
            onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))}
            onBlur={() => void finishEdit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void finishEdit()
              if (e.key === 'Escape') setEditing(null)
            }}
            className="w-full min-w-0 rounded-lg border border-indigo-300 px-2 py-1 text-[14px] font-semibold"
          />
        )
      }
      return <span className="block truncate font-semibold text-slate-900">{m.displayVendor}</span>
    }
    if (field === 'budget') {
      if (isEditing) {
        return (
          <input
            autoFocus
            dir="ltr"
            inputMode="decimal"
            value={editing?.value || ''}
            onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))}
            onBlur={() => void finishEdit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void finishEdit()
              if (e.key === 'Escape') setEditing(null)
            }}
            className={numInputCls}
          />
        )
      }
      return (
        <LtrAmount className="font-bold text-amber-950">
          {formatIls(m.budgetTotal)}
        </LtrAmount>
      )
    }
    if (field === 'actual') {
      if (isEditing) {
        return (
          <input
            autoFocus
            dir="ltr"
            inputMode="decimal"
            value={editing?.value || ''}
            onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : null))}
            onBlur={() => void finishEdit()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void finishEdit()
              if (e.key === 'Escape') setEditing(null)
            }}
            className={numInputCls}
          />
        )
      }
      return (
        <LtrAmount
          className={cn(
            'font-bold',
            actualGhost ? 'text-slate-400' : 'text-slate-900',
            !hasRealSpent && m.budgetTotal === 0 && m.spentTotal === 0 && 'text-slate-400 font-medium'
          )}
        >
          {m.budgetTotal === 0 && m.spentTotal === 0 ? '—' : formatIls(displayActual)}
        </LtrAmount>
      )
    }
    return null
  }



  return (
    <div className="space-y-4 pb-24 md:pb-8 animate-fade-in" dir="rtl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Budget</h1>
        <button
          type="button"
          onClick={() => addDraftAfter(null)}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-[15px] font-bold text-white shadow-sm"
        >
          + Add row at top
        </button>
      </header>

      {loading ? (
        <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
      ) : tableRows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-4">
          <p className="font-semibold text-slate-700">No vendors yet</p>
          <button
            type="button"
            onClick={() => addDraftAfter(null)}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[15px] font-bold text-white"
          >
            + Add first row
          </button>
        </div>
      ) : isMobile ? (
        <div className="space-y-0">
          <MobileRowInsertHandle onInsert={() => addDraftAfter(null)} label="Before all rows" />
          {tableRows.map((r) => (
            <Fragment key={rowKey(r)}>
              <div
                className={cn(
                  'rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 mb-2',
                  r.kind === 'draft' && 'bg-white'
                )}
                style={r.kind === 'data' ? dataRowSurfaceStyle(r) : undefined}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenu({ x: e.clientX, y: e.clientY, row: r })
                }}
                onTouchStart={(e) => {
                  const t = e.touches[0]
                  if (t) lastTouch.current = { x: t.clientX, y: t.clientY }
                  clearLongPress()
                  longPressTimer.current = setTimeout(() => {
                    setMenu({ x: lastTouch.current.x, y: lastTouch.current.y, row: r })
                  }, 500)
                }}
                onTouchEnd={clearLongPress}
                onTouchMove={clearLongPress}
              >
                <div className="min-h-[44px] flex items-center" onDoubleClick={() => startEdit(r, 'vendor')}>
                  {renderCell(r, 'vendor')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase text-amber-800/80">Budget</p>
                    <div className="mt-1 min-h-[44px] flex items-center" onDoubleClick={() => startEdit(r, 'budget')}>
                      {renderCell(r, 'budget')}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase text-slate-500">Actual</p>
                    <div className="mt-1 min-h-[44px] flex items-center" onDoubleClick={() => startEdit(r, 'actual')}>
                      {renderCell(r, 'actual')}
                    </div>
                  </div>
                </div>
              </div>
              <MobileRowInsertHandle
                onInsert={() => addDraftAfter(rowKey(r))}
                label={`After ${vendorLabelForRow(r)}`}
              />
            </Fragment>
          ))}
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3 flex justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase text-amber-800">Σ Budget</p>
              <p className="text-lg font-bold tabular-nums text-amber-950">
                <span dir="ltr" className="inline-block">
                  {formatIls(footerBudget)}
                </span>
              </p>
            </div>
            <div className="text-end">
              <p className="text-[11px] font-bold uppercase text-slate-600">Σ Actual</p>
              <p className="text-lg font-bold tabular-nums text-slate-900">
                <span dir="ltr" className="inline-block">
                  {formatIls(footerActual)}
                </span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <VendorBudgetDesktopGrid
          tableRows={tableRows}
          footerBudget={footerBudget}
          footerActual={footerActual}
          onCellValueChanged={handleGridCellValueChanged}
          onBodyContextMenu={onGridBodyContextMenu}
          addDraftAfter={addDraftAfter}
          getPaidSum={getPaidSum}
        />
      )}

      {menu && (
        <div
          data-vendor-budget-menu="1"
          role="menu"
          dir="ltr"
          className="fixed z-[270] min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-start"
          style={{
            left: Math.min(menu.x, typeof window !== 'undefined' ? window.innerWidth - 220 : menu.x),
            top: Math.min(menu.y, typeof window !== 'undefined' ? window.innerHeight - 200 : menu.y),
          }}
        >
          {/* Add row below */}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-start text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => {
              const r = menu.row
              const afterKey = r.kind === 'draft' ? r.draft.localKey : r.model.key
              setMenu(null)
              addDraftAfter(afterKey)
            }}
          >
            Add row below
          </button>
          {/* Separator */}
          <div className="my-1 border-t border-slate-100" />
          {menu.row.kind === 'data' && (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-start text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => {
                const rw = menu.row
                if (rw.kind !== 'data') return
                setMenu(null)
                setPaymentModal({ vendorKey: rw.model.key, displayVendor: rw.model.displayVendor })
              }}
            >
              Add payment
            </button>
          )}
          {menu.row.kind === 'data' && (paymentsByVendor.get(menu.row.model.key)?.length ?? 0) > 0 && (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-start text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => {
                const rw = menu.row
                if (rw.kind !== 'data') return
                setMenu(null)
                setViewPaymentsModal({ vendorKey: rw.model.key, displayVendor: rw.model.displayVendor })
              }}
            >
              View payments
            </button>
          )}
          {menu.row.kind === 'data' && (
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-start text-[14px] font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => {
                const rw = menu.row
                if (rw.kind !== 'data') return
                setMenu(null)
                setDetailVendor(rw.model)
              }}
            >
              Info
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-start text-[14px] font-semibold text-rose-600 hover:bg-slate-50 border-t border-slate-100 mt-1"
            onClick={async () => {
              const rw = menu.row
              setMenu(null)
              if (rw.kind === 'draft') {
                setDrafts(d => d.filter(x => x.localKey !== rw.draft.localKey))
                return
              }
              if (!confirm(`Are you sure you want to delete '${rw.model.displayVendor}' and all its associated expenses?`)) return
              
              try {
                const toDelete = [...rw.model.plannedChronological, ...rw.model.spentChronological]
                for (const exp of toDelete) {
                  await deleteExpense(exp.id)
                }
                await load()
              } catch (err) {
                console.error(err)
                alert('Failed to delete vendor row')
              }
            }}
          >
            Delete row
          </button>
        </div>
      )}

      <VendorPaymentModal
        open={!!paymentModal}
        vendorLabel={paymentModal?.displayVendor ?? ''}
        payments={paymentModal ? (paymentsByVendor.get(paymentModal.vendorKey) ?? []) : []}
        onClose={() => setPaymentModal(null)}
        onAdd={async (amount, note) => {
          if (!paymentModal) return
          await createVendorPayment(projectId, paymentModal.vendorKey, { amount, note: note || null })
          await load()
        }}
      />

      {viewPaymentsModal && (
        <div
          className="fixed inset-0 z-[265] flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4"
          dir="rtl"
          onClick={() => setViewPaymentsModal(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-xl sm:p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Payments</h2>
                <p className="text-sm text-slate-500 mt-0.5" dir="auto">
                  {viewPaymentsModal.displayVendor}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewPaymentsModal(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {(() => {
              const vendorPayments = paymentsByVendor.get(viewPaymentsModal.vendorKey) ?? []
              const totalPaid = vendorPayments.reduce((s, p) => s + Number(p.amount), 0)
              return (
                <>
                  {vendorPayments.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-400 text-center py-6">No payments recorded</p>
                  ) : (
                    <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      {vendorPayments.map((p, i) => (
                        <div key={p.id} className="flex items-baseline gap-2 text-[14px]" dir="auto">
                          <span className="font-bold text-slate-400 tabular-nums">{i + 1}.</span>
                          <span dir="ltr" className="font-bold tabular-nums text-slate-900">
                            {formatIls(Number(p.amount))}
                          </span>
                          {p.note?.trim() && (
                            <span className="text-slate-600 text-[13px]">{p.note.trim()}</span>
                          )}
                          <span className="mr-auto text-[11px] text-slate-400 tabular-nums" dir="ltr">
                            {new Date(p.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {vendorPayments.length > 0 && (
                    <div className="mt-3 flex items-baseline justify-between rounded-xl bg-slate-100 px-4 py-2.5">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Total paid</span>
                      <span dir="ltr" className="text-[16px] font-bold tabular-nums text-slate-900">
                        {formatIls(totalPaid)}
                      </span>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {detailVendor && (
        <VendorDetailDrawer
          projectId={projectId}
          vendorRow={detailVendor}
          onClose={() => setDetailVendor(null)}
          onSaved={() => void load()}
        />
      )}
    </div>
  )
}
