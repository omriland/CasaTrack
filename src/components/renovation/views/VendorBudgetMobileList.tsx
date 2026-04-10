'use client'

import { useCallback, useRef, useState } from 'react'
import type { RenovationRoom, RenovationVendorPayment } from '@/types/renovation'
import type { VendorBudgetRowModel } from '@/lib/renovation-vendor-budget'
import type { TableRow } from './vendor-budget-types'
import { formatIls } from '@/lib/renovation-format'
import { cn } from '@/utils/common'
import { VendorBudgetProgressBar } from './VendorBudgetProgressBar'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type Props = {
  tableRows: TableRow[]
  rooms: RenovationRoom[]
  roomNameById: Map<string, string>
  paidSumForVendor: (key: string) => number
  paymentsByVendor: Map<string, RenovationVendorPayment[]>
  onCommitEdit: (
    row: TableRow,
    field: 'vendor' | 'category' | 'budget' | 'actual',
    value: string
  ) => Promise<void>
  onToggleRoom: (vendorKey: string, roomId: string, checked: boolean) => void
  onAddPayment: (vendorKey: string, displayVendor: string) => void
  onViewDetail: (model: VendorBudgetRowModel) => void
  onDeleteRow: (row: TableRow) => void
  onAddRow: () => void
  onContextMenu: (row: TableRow, x: number, y: number) => void
  footerBudget: number
  footerActual: number
  footerPaid: number
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function rowKey(r: TableRow) {
  return r.kind === 'draft' ? r.draft.localKey : r.model.key
}

function effectiveActual(r: TableRow): number {
  if (r.kind !== 'data') return 0
  return r.model.spentTotal > 0 ? r.model.spentTotal : r.model.budgetTotal
}

/* ─── Editable field in bottom sheet ─────────────────────────────────────────── */

function SheetField({
  label,
  value,
  onCommit,
  dir,
  inputMode,
}: {
  label: string
  value: string
  onCommit: (v: string) => void
  dir?: string
  inputMode?: 'text' | 'decimal'
}) {
  const [draft, setDraft] = useState(value)
  const committedRef = useRef(false)

  const commit = () => {
    if (committedRef.current) return
    committedRef.current = true
    if (draft !== value) onCommit(draft)
  }

  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        dir={dir}
        inputMode={inputMode}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          committedRef.current = false
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[15px] font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
      />
    </div>
  )
}

/* ─── Detail bottom sheet ────────────────────────────────────────────────────── */

function VendorDetailSheet({
  row,
  rooms,
  paidSum,
  payments,
  onCommitEdit,
  onToggleRoom,
  onAddPayment,
  onViewDetail,
  onDelete,
  onClose,
}: {
  row: TableRow
  rooms: RenovationRoom[]
  paidSum: number
  payments: RenovationVendorPayment[]
  onCommitEdit: Props['onCommitEdit']
  onToggleRoom: Props['onToggleRoom']
  onAddPayment: Props['onAddPayment']
  onViewDetail: Props['onViewDetail']
  onDelete: () => void
  onClose: () => void
}) {
  const isData = row.kind === 'data'
  const model = isData ? row.model : null
  const vendorName =
    isData ? model!.displayVendor : row.draft.vendorInput || ''
  const categoryStr = isData ? (model!.displayCategory ?? '') : ''
  const budgetStr = isData ? String(Math.round(model!.budgetTotal)) : '0'
  const actualStr = isData
    ? String(
        Math.round(
          model!.spentTotal > 0 ? model!.spentTotal : model!.budgetTotal
        )
      )
    : '0'

  return (
    <MobileBottomSheet open title={vendorName || 'New vendor'} onClose={onClose}>
      <div className="space-y-5 pb-4" dir="rtl">
        {/* Title (vendor db field) */}
        <SheetField
          label="Title"
          value={vendorName}
          onCommit={(v) => void onCommitEdit(row, 'vendor', v)}
          dir="auto"
        />

        {/* Vendor (category db field) */}
        {isData && (
          <SheetField
            label="Vendor"
            value={categoryStr}
            onCommit={(v) => void onCommitEdit(row, 'category', v)}
            dir="auto"
          />
        )}

        {/* Budget + Actual side by side */}
        <div className="grid grid-cols-2 gap-3">
          <SheetField
            label="Budget"
            value={budgetStr}
            onCommit={(v) => void onCommitEdit(row, 'budget', v)}
            dir="ltr"
            inputMode="decimal"
          />
          <SheetField
            label="Actual"
            value={actualStr}
            onCommit={(v) => void onCommitEdit(row, 'actual', v)}
            dir="ltr"
            inputMode="decimal"
          />
        </div>

        {/* Rooms */}
        {isData && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Rooms
            </p>
            {rooms.length === 0 ? (
              <p className="text-[13px] text-slate-400">No rooms yet</p>
            ) : (
              <div className="space-y-1">
                {rooms.map((rm) => (
                  <label
                    key={rm.id}
                    className="flex items-center gap-2.5 min-h-[44px]"
                  >
                    <input
                      type="checkbox"
                      checked={model!.room_ids.includes(rm.id)}
                      onChange={(e) =>
                        onToggleRoom(model!.key, rm.id, e.target.checked)
                      }
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600"
                    />
                    <span
                      className="text-[15px] font-medium text-slate-800"
                      dir="auto"
                    >
                      {rm.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payments */}
        {isData && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Payments
            </p>
            {payments.length === 0 ? (
              <p className="text-[13px] text-slate-400 mb-2">
                No payments recorded
              </p>
            ) : (
              <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 mb-2">
                {payments.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-baseline gap-2 text-[14px]"
                    dir="auto"
                  >
                    <span className="font-bold text-slate-400 tabular-nums">
                      {i + 1}.
                    </span>
                    <span
                      dir="ltr"
                      className="font-bold tabular-nums text-slate-900"
                    >
                      {formatIls(Number(p.amount))}
                    </span>
                    {p.note?.trim() && (
                      <span className="text-slate-600 text-[13px]">
                        {p.note.trim()}
                      </span>
                    )}
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[13px]">
                  <span className="font-bold text-slate-500">Total paid</span>
                  <span
                    dir="ltr"
                    className="font-bold tabular-nums text-slate-900"
                  >
                    {formatIls(paidSum)}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => onAddPayment(model!.key, model!.displayVendor)}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-[14px] font-bold text-indigo-700 active:bg-indigo-100"
            >
              + Add payment
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isData && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onViewDetail(model!)
              }}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-[14px] font-bold text-slate-700 active:bg-slate-50"
            >
              Info
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose()
              onDelete()
            }}
            className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-3 text-[14px] font-bold text-rose-600 active:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>
    </MobileBottomSheet>
  )
}

/* ─── Mobile list ────────────────────────────────────────────────────────────── */

export function VendorBudgetMobileList({
  tableRows,
  rooms,
  roomNameById,
  paidSumForVendor,
  paymentsByVendor,
  onCommitEdit,
  onToggleRoom,
  onAddPayment,
  onViewDetail,
  onDeleteRow,
  onAddRow,
  onContextMenu,
  footerBudget,
  footerActual,
  footerPaid,
}: Props) {
  const [openRow, setOpenRow] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTouch = useRef({ x: 0, y: 0 })

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const openRowData = openRow
    ? tableRows.find((r) => rowKey(r) === openRow) ?? null
    : null

  const footerPaidPct =
    footerActual > 0 ? Math.round((footerPaid / footerActual) * 100) : 0

  return (
    <div className="space-y-3">
      {tableRows.map((r) => {
        const key = rowKey(r)
        const isData = r.kind === 'data'
        const m = isData ? r.model : null
        const vendorLabel = isData
          ? m!.displayVendor
          : r.draft.vendorInput.trim() || 'New vendor'
        const ea = effectiveActual(r)
        const paid = isData ? paidSumForVendor(m!.key) : 0
        const paidPct = ea > 0 ? Math.round((paid / ea) * 100) : 0
        const budget = isData ? m!.budgetTotal : 0
        const roomNames = isData
          ? m!.room_ids
              .map((id) => roomNameById.get(id) ?? '')
              .filter(Boolean)
              .sort((a, b) =>
                a.localeCompare(b, 'he', { sensitivity: 'base' })
              )
          : []

        return (
          <div
            key={key}
            className={cn(
              'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50/60 transition-colors',
              r.kind === 'draft' && 'border-dashed'
            )}
            onClick={() => setOpenRow(key)}
            onContextMenu={(e) => {
              e.preventDefault()
              onContextMenu(r, e.clientX, e.clientY)
            }}
            onTouchStart={(e) => {
              const t = e.touches[0]
              if (t) lastTouch.current = { x: t.clientX, y: t.clientY }
              clearLongPress()
              longPressTimer.current = setTimeout(() => {
                onContextMenu(r, lastTouch.current.x, lastTouch.current.y)
              }, 500)
            }}
            onTouchEnd={clearLongPress}
            onTouchMove={clearLongPress}
          >
            {/* Row 1: vendor + room chips */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className={cn(
                  'text-[15px] font-semibold text-slate-900 truncate',
                  r.kind === 'draft' && 'italic text-slate-500'
                )}
                dir="auto"
              >
                {vendorLabel}
              </span>
              {roomNames.length > 0 && (
                <div className="flex shrink-0 flex-wrap gap-1 justify-end max-w-[40%]">
                  {roomNames.slice(0, 2).map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 truncate max-w-[70px]"
                    >
                      {name}
                    </span>
                  ))}
                  {roomNames.length > 2 && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      +{roomNames.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: budget / actual / paid% */}
            <div className="flex items-baseline gap-4 text-[13px] mb-2" dir="ltr">
              <div>
                <span className="text-slate-500 mr-1">Budget:</span>
                <span className="font-bold text-amber-950 tabular-nums">
                  {budget > 0 ? formatIls(budget) : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 mr-1">Actual:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {ea > 0 ? formatIls(ea) : '—'}
                </span>
              </div>
              {paid > 0 && (
                <span
                  className={cn(
                    'ml-auto font-bold tabular-nums',
                    paidPct >= 100
                      ? 'text-emerald-600'
                      : paidPct >= 60
                        ? 'text-blue-600'
                        : paidPct >= 30
                          ? 'text-amber-600'
                          : 'text-rose-600'
                  )}
                >
                  {paidPct}%
                </span>
              )}
            </div>

            {/* Row 3: progress bar */}
            {isData && (
              <VendorBudgetProgressBar
                budget={budget}
                actual={ea}
                paid={paid}
              />
            )}
          </div>
        )
      })}

      {/* Add vendor button */}
      <button
        type="button"
        onClick={onAddRow}
        className="w-full rounded-2xl border-2 border-dashed border-indigo-300 py-4 text-[15px] font-bold text-indigo-600 active:bg-indigo-50"
      >
        + Add vendor
      </button>

      {/* Footer totals */}
      <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3">
        <div className="flex justify-between gap-4 mb-2">
          <div>
            <p className="text-[11px] font-bold uppercase text-amber-800">
              Budget
            </p>
            <p className="text-lg font-bold tabular-nums text-amber-950">
              <span dir="ltr" className="inline-block">
                {formatIls(footerBudget)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-600">
              Actual
            </p>
            <p className="text-lg font-bold tabular-nums text-slate-900">
              <span dir="ltr" className="inline-block">
                {formatIls(footerActual)}
              </span>
            </p>
          </div>
          <div className="text-end">
            <p className="text-[11px] font-bold uppercase text-slate-600">
              Paid
            </p>
            <p className="text-lg font-bold tabular-nums text-slate-900">
              <span dir="ltr" className="inline-block">
                {formatIls(footerPaid)} ({footerPaidPct}%)
              </span>
            </p>
          </div>
        </div>
        <VendorBudgetProgressBar
          budget={footerBudget}
          actual={footerActual}
          paid={footerPaid}
        />
      </div>

      {/* Detail bottom sheet */}
      {openRowData && (
        <VendorDetailSheet
          row={openRowData}
          rooms={rooms}
          paidSum={
            openRowData.kind === 'data'
              ? paidSumForVendor(openRowData.model.key)
              : 0
          }
          payments={
            openRowData.kind === 'data'
              ? paymentsByVendor.get(openRowData.model.key) ?? []
              : []
          }
          onCommitEdit={onCommitEdit}
          onToggleRoom={onToggleRoom}
          onAddPayment={onAddPayment}
          onViewDetail={onViewDetail}
          onDelete={() => onDeleteRow(openRowData)}
          onClose={() => setOpenRow(null)}
        />
      )}
    </div>
  )
}
