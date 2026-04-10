'use client'

import { VendorDetailDrawer } from '@/components/renovation/VendorDetailDrawer'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRenovationMobile } from '@/components/renovation/RenovationViewportContext'
import {
  createVendorPayment,
  deleteExpense,
  deleteVendorBudgetRoomsForVendor,
  listExpenses,
  listRooms,
  listVendorBudgetRoomLinks,
  listVendorPayments,
  renameVendorAcrossExpenses,
  setVendorBudgetRooms,
  setVendorPlannedTotal,
  setVendorSpentTotal,
  updateVendorExpenseMeta,
  vendorRoomLinksByVendorKey,
} from '@/lib/renovation'
import {
  buildVendorBudgetRows,
  type VendorBudgetRowModel,
} from '@/lib/renovation-vendor-budget'
import { formatIls } from '@/lib/renovation-format'
import type { RenovationExpense, RenovationRoom, RenovationVendorPayment } from '@/types/renovation'
import type { DraftRow, TableRow } from './vendor-budget-types'
import { VendorBudgetToolbar } from './VendorBudgetToolbar'
import { VendorBudgetTable } from './VendorBudgetTable'
import { VendorBudgetMobileList } from './VendorBudgetMobileList'
import { exportVendorBudgetCsv } from './vendor-budget-export'

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

const START_KEY = '__start__'

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

/* ─── Payment modal ──────────────────────────────────────────────────────────── */

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
    if (open) { setAmount(''); setNote('') }
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
        <p className="text-sm text-slate-500 mt-1" dir="auto">{vendorLabel}</p>

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
            <label htmlFor="vp-amount" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount</label>
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
            <label htmlFor="vp-note" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Note</label>
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
              if (Number.isNaN(n) || n <= 0) { alert('Enter a positive amount.'); return }
              setSaving(true)
              try { await onAdd(n, note.trim()); onClose() }
              catch (e) { console.error(e); alert('Could not save payment. Run 17_vendor_payments.sql in Supabase.') }
              finally { setSaving(false) }
            }}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-[15px] font-bold text-white disabled:opacity-50"
          >
            {saving ? '…' : 'Add payment'}
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-[15px] font-bold text-slate-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── View payments modal ────────────────────────────────────────────────────── */

function ViewPaymentsModal({
  vendorLabel,
  payments,
  onClose,
}: {
  vendorLabel: string
  payments: RenovationVendorPayment[]
  onClose: () => void
}) {
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0)

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payments</h2>
            <p className="text-sm text-slate-500 mt-0.5" dir="auto">{vendorLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {payments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400 text-center py-6">No payments recorded</p>
        ) : (
          <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            {payments.map((p, i) => (
              <div key={p.id} className="flex items-baseline gap-2 text-[14px]" dir="auto">
                <span className="font-bold text-slate-400 tabular-nums">{i + 1}.</span>
                <span dir="ltr" className="font-bold tabular-nums text-slate-900">{formatIls(Number(p.amount))}</span>
                {p.note?.trim() && <span className="text-slate-600 text-[13px]">{p.note.trim()}</span>}
                <span className="mr-auto text-[11px] text-slate-400 tabular-nums" dir="ltr">
                  {new Date(p.created_at).toLocaleDateString('he-IL')}
                </span>
              </div>
            ))}
          </div>
        )}

        {payments.length > 0 && (
          <div className="mt-3 flex items-baseline justify-between rounded-xl bg-slate-100 px-4 py-2.5">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Total paid</span>
            <span dir="ltr" className="text-[16px] font-bold tabular-nums text-slate-900">{formatIls(totalPaid)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main view ──────────────────────────────────────────────────────────────── */

export function VendorBudgetView({ projectId }: { projectId: string }) {
  const isMobile = useRenovationMobile()

  const [expenses, setExpenses] = useState<RenovationExpense[]>([])
  const [drafts, setDrafts] = useState<DraftRow[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [vendorRoomLinkRows, setVendorRoomLinkRows] = useState<
    Awaited<ReturnType<typeof listVendorBudgetRoomLinks>>
  >([])
  const [payments, setPayments] = useState<RenovationVendorPayment[]>([])
  const [loading, setLoading] = useState(true)

  const [filterRoomIds, setFilterRoomIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [menu, setMenu] = useState<{ x: number; y: number; row: TableRow } | null>(null)
  const [paymentModal, setPaymentModal] = useState<{ vendorKey: string; displayVendor: string } | null>(null)
  const [viewPaymentsModal, setViewPaymentsModal] = useState<{ vendorKey: string; displayVendor: string } | null>(null)
  const [detailVendor, setDetailVendor] = useState<VendorBudgetRowModel | null>(null)

  /* ── Data loading ── */

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ex, pay, rms, vlinks] = await Promise.all([
        listExpenses(projectId),
        listVendorPayments(projectId),
        listRooms(projectId),
        listVendorBudgetRoomLinks(projectId),
      ])
      setExpenses(ex)
      setPayments(pay)
      setRooms(rms)
      setVendorRoomLinkRows(vlinks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void load() }, [load])

  /* ── Derived data ── */

  const vendorRoomMap = useMemo(
    () => vendorRoomLinksByVendorKey(vendorRoomLinkRows),
    [vendorRoomLinkRows]
  )

  const dataModelsWithRooms = useMemo(() => {
    const base = buildVendorBudgetRows(expenses)
    return base.map((m) => ({ ...m, room_ids: vendorRoomMap.get(m.key) ?? [] }))
  }, [expenses, vendorRoomMap])

  const roomNameById = useMemo(
    () => new Map(rooms.map((r) => [r.id, r.name])),
    [rooms]
  )

  const mergedTableRows = useMemo(
    () => mergeTableRows(dataModelsWithRooms, drafts),
    [dataModelsWithRooms, drafts]
  )

  const filterSet = useMemo(() => new Set(filterRoomIds), [filterRoomIds])

  const roomFiltered: TableRow[] = useMemo(() => {
    if (filterSet.size === 0) return mergedTableRows
    return mergedTableRows.filter((r) => {
      if (r.kind === 'draft') return true
      const ids = r.model.room_ids
      if (ids.length === 0) return false
      return ids.some((id) => filterSet.has(id))
    })
  }, [mergedTableRows, filterSet])

  const tableRows: TableRow[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return roomFiltered
    return roomFiltered.filter((r) => {
      const name = r.kind === 'data' ? r.model.displayVendor : r.draft.vendorInput
      return name.toLowerCase().includes(q)
    })
  }, [roomFiltered, searchQuery])

  const visibleDataModels = useMemo(() => {
    return tableRows
      .filter((r): r is TableRow & { kind: 'data' } => r.kind === 'data')
      .map((r) => r.model)
  }, [tableRows])

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
    (vendorKey: string) =>
      (paymentsByVendor.get(vendorKey) ?? []).reduce(
        (s, p) => s + Number(p.amount),
        0
      ),
    [paymentsByVendor]
  )

  const footerBudget = useMemo(
    () => visibleDataModels.reduce((s, m) => s + m.budgetTotal, 0),
    [visibleDataModels]
  )

  const footerActual = useMemo(
    () =>
      visibleDataModels.reduce((sum, m) => {
        const effectiveActual = m.spentTotal > 0 ? m.spentTotal : m.budgetTotal
        return sum + effectiveActual
      }, 0),
    [visibleDataModels]
  )

  const footerPaid = useMemo(
    () => visibleDataModels.reduce((s, m) => s + paidSumForVendor(m.key), 0),
    [visibleDataModels, paidSumForVendor]
  )

  const hasVendorData = dataModelsWithRooms.length > 0

  /* ── Room toggling ── */

  const toggleVendorRoom = useCallback(
    (vendorKey: string, roomId: string, checked: boolean) => {
      setVendorRoomLinkRows((prev) => {
        const currentIds = prev
          .filter((l) => l.vendor_key === vendorKey)
          .map((l) => l.room_id)
        const nextIds = checked
          ? [...new Set([...currentIds, roomId])]
          : currentIds.filter((id) => id !== roomId)
        setVendorBudgetRooms(projectId, vendorKey, nextIds).catch(
          (err: unknown) => {
            const msg = err instanceof Error ? err.message : JSON.stringify(err)
            console.error('[vendor rooms] save failed:', msg)
          }
        )
        return [
          ...prev.filter((l) => l.vendor_key !== vendorKey),
          ...nextIds.map((room_id) => ({ vendor_key: vendorKey, room_id })),
        ]
      })
    },
    [projectId]
  )

  /* ── Commit helpers ── */

  const commitCategory = async (r: TableRow, raw: string) => {
    if (r.kind !== 'data') return
    const next = raw.trim()
    await updateVendorExpenseMeta(projectId, r.model.displayVendor, {
      category: next || null,
    })
    await load()
  }

  const commitVendor = async (r: TableRow, raw: string) => {
    const next = raw.trim()
    if (r.kind === 'draft') {
      setDrafts((prev) =>
        prev.map((d) =>
          d.localKey === r.draft.localKey ? { ...d, vendorInput: next } : d
        )
      )
      return
    }
    if (next === r.model.displayVendor) return
    if (!next) { alert('שם הספק לא יכול להיות ריק.'); return }
    await renameVendorAcrossExpenses(projectId, r.model.key, next)
    await load()
  }

  const commitBudget = async (r: TableRow, raw: string) => {
    const n = parseAmountInput(raw)
    if (n === null) { alert('הזן סכום תקין.'); return }
    if (r.kind === 'draft') {
      const v = r.draft.vendorInput.trim()
      if (!v) { alert('תן שם לספק לפני הזנת תקציב.'); return }
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
    if (n === null) { alert('הזן סכום תקין.'); return }
    if (r.kind === 'draft') {
      const v = r.draft.vendorInput.trim()
      if (!v) { alert('תן שם לספק לפני הזנת תקציב.'); return }
      await setVendorSpentTotal(projectId, v, n)
      setDrafts((prev) => prev.filter((d) => d.localKey !== r.draft.localKey))
      await load()
      return
    }
    await setVendorSpentTotal(projectId, r.model.displayVendor, n)
    await load()
  }

  const handleCommitEdit = useCallback(
    async (row: TableRow, field: 'vendor' | 'category' | 'budget' | 'actual', value: string) => {
      try {
        if (field === 'vendor') await commitVendor(row, value)
        else if (field === 'category') await commitCategory(row, value)
        else if (field === 'budget') await commitBudget(row, value)
        else await commitActual(row, value)
      } catch (err) {
        console.error(err)
        alert('השמירה נכשלה.')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, load]
  )

  /* ── Row management ── */

  const addDraftAfter = useCallback((afterKey: string | null) => {
    setDrafts((prev) => [
      ...prev,
      {
        localKey: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        vendorInput: '',
        insertAfter: afterKey,
      },
    ])
  }, [])

  const handleDeleteRow = useCallback(
    async (row: TableRow) => {
      if (row.kind === 'draft') {
        setDrafts((d) => d.filter((x) => x.localKey !== row.draft.localKey))
        return
      }
      if (
        !confirm(
          `Are you sure you want to delete '${row.model.displayVendor}' and all its associated expenses?`
        )
      )
        return
      try {
        const toDelete = [
          ...row.model.plannedChronological,
          ...row.model.spentChronological,
        ]
        for (const exp of toDelete) {
          await deleteExpense(exp.id)
        }
        await deleteVendorBudgetRoomsForVendor(projectId, row.model.key)
        await load()
      } catch (err) {
        console.error(err)
        alert('Failed to delete vendor row')
      }
    },
    [projectId, load]
  )

  /* ── Context menu ── */

  const onContextMenu = useCallback(
    (tableRow: TableRow, clientX: number, clientY: number) => {
      setMenu({ x: clientX, y: clientY, row: tableRow })
    },
    []
  )

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('[data-vendor-budget-menu="1"]')) return
      setMenu(null)
    }
    const t = setTimeout(() => window.addEventListener('mousedown', close), 0)
    return () => { clearTimeout(t); window.removeEventListener('mousedown', close) }
  }, [menu])

  /* ── Export ── */

  const handleExportCsv = useCallback(() => {
    exportVendorBudgetCsv(visibleDataModels, roomNameById, paidSumForVendor)
  }, [visibleDataModels, roomNameById, paidSumForVendor])

  /* ── Render ── */

  return (
    <div className="space-y-4 pb-24 md:pb-8 animate-fade-in" dir="rtl">
      <header className="flex items-center justify-between" dir="ltr">
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900 md:text-[32px] text-left">
          Budget
        </h1>
      </header>

      {!loading && (hasVendorData || drafts.length > 0) && (
        <VendorBudgetToolbar
          rooms={rooms}
          filterRoomIds={filterRoomIds}
          onFilterRoomIdsChange={setFilterRoomIds}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExportCsv={handleExportCsv}
        />
      )}

      {loading ? (
        <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
      ) : !hasVendorData && drafts.length === 0 ? (
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
      ) : hasVendorData &&
        filterSet.size > 0 &&
        !tableRows.some((r) => r.kind === 'data') ? (
        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-[15px] font-medium text-amber-950"
          dir="ltr"
        >
          No vendor rows include any of the selected rooms. Clear the room
          filter or assign rooms to vendors.
        </div>
      ) : isMobile ? (
        <VendorBudgetMobileList
          tableRows={tableRows}
          rooms={rooms}
          roomNameById={roomNameById}
          paidSumForVendor={paidSumForVendor}
          paymentsByVendor={paymentsByVendor}
          onCommitEdit={handleCommitEdit}
          onToggleRoom={toggleVendorRoom}
          onAddPayment={(vk, dv) => setPaymentModal({ vendorKey: vk, displayVendor: dv })}
          onViewDetail={setDetailVendor}
          onDeleteRow={handleDeleteRow}
          onAddRow={() => addDraftAfter(null)}
          onContextMenu={onContextMenu}
          footerBudget={footerBudget}
          footerActual={footerActual}
          footerPaid={footerPaid}
        />
      ) : (
        <VendorBudgetTable
          tableRows={tableRows}
          rooms={rooms}
          roomNameById={roomNameById}
          paidSumForVendor={paidSumForVendor}
          onCommitEdit={handleCommitEdit}
          onToggleRoom={toggleVendorRoom}
          onContextMenu={onContextMenu}
          footerBudget={footerBudget}
          footerActual={footerActual}
          footerPaid={footerPaid}
        />
      )}

      {/* Context menu */}
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
            onClick={() => {
              setMenu(null)
              void handleDeleteRow(menu.row)
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
        <ViewPaymentsModal
          vendorLabel={viewPaymentsModal.displayVendor}
          payments={paymentsByVendor.get(viewPaymentsModal.vendorKey) ?? []}
          onClose={() => setViewPaymentsModal(null)}
        />
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
