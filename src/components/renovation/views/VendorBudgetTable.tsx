'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import type { RenovationRoom } from '@/types/renovation'
import type { TableRow } from './vendor-budget-types'
import { formatIls } from '@/lib/renovation-format'
import { cn } from '@/utils/common'
import { VendorBudgetProgressBar } from './VendorBudgetProgressBar'

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type VendorTableMeta = {
  rooms: RenovationRoom[]
  roomNameById: Map<string, string>
  paidSumForVendor: (key: string) => number
  onCommitEdit: (row: TableRow, field: 'vendor' | 'budget' | 'actual', value: string) => Promise<void>
  onToggleRoom: (vendorKey: string, roomId: string, checked: boolean) => void
  openRoomsDropdown: (info: RoomsDropdownState) => void
  footerBudget: number
  footerActual: number
  footerPaid: number
}

type RoomsDropdownState = {
  vendorKey: string
  vendorName: string
  selectedIds: string[]
  rect: DOMRect
}

type Props = {
  tableRows: TableRow[]
  rooms: RenovationRoom[]
  roomNameById: Map<string, string>
  paidSumForVendor: (key: string) => number
  onCommitEdit: (row: TableRow, field: 'vendor' | 'budget' | 'actual', value: string) => Promise<void>
  onToggleRoom: (vendorKey: string, roomId: string, checked: boolean) => void
  onContextMenu: (row: TableRow, x: number, y: number) => void
  footerBudget: number
  footerActual: number
  footerPaid: number
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function paidColorClass(pct: number): string {
  if (pct >= 100) return 'text-emerald-600'
  if (pct >= 60) return 'text-blue-600'
  if (pct >= 30) return 'text-amber-600'
  return 'text-rose-600'
}

/* ─── Internal components ────────────────────────────────────────────────────── */

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (!direction) return null
  return (
    <svg className="h-3 w-3 text-indigo-600 shrink-0" viewBox="0 0 14 14" fill="currentColor">
      {direction === 'asc' ? <path d="M7 3L12 10H2L7 3Z" /> : <path d="M7 11L2 4H12L7 11Z" />}
    </svg>
  )
}

function EditableCell({
  value,
  onSave,
  display,
  inputDir,
  inputMode,
  placeholder,
}: {
  value: string
  onSave: (v: string) => void
  display?: React.ReactNode
  inputDir?: string
  inputMode?: 'text' | 'decimal'
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing) {
    return (
      <div
        className="min-h-[28px] flex items-center cursor-text rounded px-1 -mx-1 hover:bg-slate-100/60 transition-colors"
        onClick={() => {
          setEditing(true)
          setDraft(value)
        }}
      >
        {display ?? (
          <span className="text-slate-400 italic">{placeholder ?? 'Click to edit'}</span>
        )}
      </div>
    )
  }

  return (
    <input
      autoFocus
      dir={inputDir}
      inputMode={inputMode}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        onSave(draft)
        setEditing(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSave(draft)
          setEditing(false)
        }
        if (e.key === 'Escape') setEditing(false)
      }}
      className="w-full rounded-lg border border-indigo-300 bg-indigo-50/30 px-2 py-1 text-[14px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/30"
    />
  )
}

function RoomChips({
  names,
  onClick,
}: {
  names: string[]
  onClick: (rect: DOMRect) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const MAX_CHIPS = 2
  const shown = names.slice(0, MAX_CHIPS)
  const overflow = names.length - MAX_CHIPS

  return (
    <div
      ref={ref}
      className="min-h-[28px] flex flex-wrap items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-slate-100/60 transition-colors"
      onClick={() => ref.current && onClick(ref.current.getBoundingClientRect())}
      title={names.length > 0 ? names.join(', ') : undefined}
    >
      {names.length === 0 ? (
        <span className="text-slate-400">—</span>
      ) : (
        <>
          {shown.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 truncate max-w-[90px]"
            >
              {name}
            </span>
          ))}
          {overflow > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
              +{overflow}
            </span>
          )}
        </>
      )}
    </div>
  )
}

function RoomsDropdownPanel({
  rooms,
  selectedIds,
  vendorName,
  rect,
  onToggle,
  onClose,
}: {
  rooms: RenovationRoom[]
  selectedIds: string[]
  vendorName: string
  rect: DOMRect
  onToggle: (roomId: string, checked: boolean) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  const PANEL_W = Math.max(rect.width, 220)
  const PANEL_MAX_H = 288
  const spaceBelow = window.innerHeight - rect.bottom - 8
  const top =
    spaceBelow >= 120
      ? rect.bottom + 4
      : rect.top - Math.min(PANEL_MAX_H, rooms.length * 44 + 44) - 4
  const left = Math.min(rect.left, window.innerWidth - PANEL_W - 8)

  return createPortal(
    <div
      ref={panelRef}
      style={{ top, left, width: PANEL_W, maxHeight: PANEL_MAX_H, zIndex: 260 }}
      className="fixed overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-3 py-2 backdrop-blur-sm">
        <span
          className="text-[12px] font-bold uppercase tracking-wide text-slate-500 truncate block"
          dir="auto"
        >
          {vendorName}
        </span>
      </div>
      {rooms.length === 0 ? (
        <p className="px-3 py-5 text-center text-[13px] text-slate-400">
          No rooms in this project.
        </p>
      ) : (
        rooms.map((r) => (
          <label
            key={r.id}
            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(r.id)}
              onChange={(e) => onToggle(r.id, e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
            />
            <span className="text-[14px] font-medium text-slate-800" dir="auto">
              {r.name}
            </span>
          </label>
        ))
      )}
    </div>,
    document.body
  )
}

/* ─── Column definitions ─────────────────────────────────────────────────────── */

const columnHelper = createColumnHelper<TableRow>()

function buildColumns(
  roomNameByIdRef: React.RefObject<Map<string, string>>,
  paidSumRef: React.RefObject<(key: string) => number>
) {
  return [
    columnHelper.accessor(
      (row) => (row.kind === 'data' ? row.model.displayVendor : row.draft.vendorInput || ''),
      {
        id: 'vendor',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1.5 select-none"
            onClick={column.getToggleSortingHandler()}
          >
            Vendor
            <SortIcon direction={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row, table }) => {
          const meta = table.options.meta as VendorTableMeta
          const r = row.original
          const val =
            r.kind === 'data' ? r.model.displayVendor : r.draft.vendorInput || ''
          const isDraft = r.kind === 'draft'
          return (
            <EditableCell
              value={val}
              onSave={(v) => void meta.onCommitEdit(r, 'vendor', v)}
              display={
                isDraft && !val
                  ? undefined
                  : (
                      <span
                        className={cn(
                          'block truncate',
                          isDraft
                            ? 'italic text-slate-500'
                            : 'font-semibold text-slate-900'
                        )}
                        dir="auto"
                      >
                        {val}
                      </span>
                    )
              }
              placeholder="Click to name"
              inputDir="auto"
            />
          )
        },
        footer: () => <span className="font-bold text-slate-900">Totals</span>,
      }
    ),

    columnHelper.accessor(
      (row) => {
        if (row.kind !== 'data') return ''
        return row.model.room_ids
          .map((id) => roomNameByIdRef.current?.get(id) ?? '')
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'he', { sensitivity: 'base' }))
          .join('\u0000')
      },
      {
        id: 'rooms',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1.5 select-none"
            onClick={column.getToggleSortingHandler()}
          >
            Rooms
            <SortIcon direction={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row, table }) => {
          const meta = table.options.meta as VendorTableMeta
          const r = row.original
          if (r.kind !== 'data')
            return <span className="text-slate-400">—</span>
          const ids = r.model.room_ids
          const names = ids
            .map((id) => meta.roomNameById.get(id) ?? '')
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, 'he', { sensitivity: 'base' }))
          return (
            <RoomChips
              names={names}
              onClick={(rect) =>
                meta.openRoomsDropdown({
                  vendorKey: r.model.key,
                  vendorName: r.model.displayVendor,
                  selectedIds: ids,
                  rect,
                })
              }
            />
          )
        },
        footer: () => null,
      }
    ),

    columnHelper.accessor(
      (row) => (row.kind === 'data' ? row.model.budgetTotal : 0),
      {
        id: 'budget',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1.5 select-none"
            onClick={column.getToggleSortingHandler()}
          >
            Budget
            <SortIcon direction={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row, table }) => {
          const meta = table.options.meta as VendorTableMeta
          const r = row.original
          const raw =
            r.kind === 'data' ? String(Math.round(r.model.budgetTotal)) : '0'
          const formatted =
            r.kind === 'data' && r.model.budgetTotal > 0
              ? formatIls(r.model.budgetTotal)
              : null
          return (
            <EditableCell
              value={raw}
              onSave={(v) => void meta.onCommitEdit(r, 'budget', v)}
              display={
                formatted ? (
                  <span
                    dir="ltr"
                    className="inline-block w-full text-end font-bold text-amber-950 tabular-nums"
                  >
                    {formatted}
                  </span>
                ) : undefined
              }
              placeholder="—"
              inputDir="ltr"
              inputMode="decimal"
            />
          )
        },
        footer: ({ table }) => {
          const meta = table.options.meta as VendorTableMeta
          return (
            <span
              dir="ltr"
              className="inline-block w-full text-end font-bold text-amber-950 tabular-nums"
            >
              {formatIls(meta.footerBudget)}
            </span>
          )
        },
      }
    ),

    columnHelper.accessor(
      (row) => {
        if (row.kind !== 'data') return 0
        return row.model.spentTotal > 0
          ? row.model.spentTotal
          : row.model.budgetTotal
      },
      {
        id: 'actual',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1.5 select-none"
            onClick={column.getToggleSortingHandler()}
          >
            Actual
            <SortIcon direction={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row, table }) => {
          const meta = table.options.meta as VendorTableMeta
          const r = row.original

          if (r.kind === 'draft') {
            return (
              <EditableCell
                value="0"
                onSave={(v) => void meta.onCommitEdit(r, 'actual', v)}
                placeholder="—"
                inputDir="ltr"
                inputMode="decimal"
              />
            )
          }

          const m = r.model
          const hasReal = m.spentTotal > 0
          const display = hasReal ? m.spentTotal : m.budgetTotal
          const isGhost = !hasReal && m.budgetTotal > 0
          const color = (() => {
            if (isGhost) return 'text-slate-400'
            if (m.budgetTotal <= 0) return 'text-slate-900'
            if (display < m.budgetTotal) return 'text-emerald-600'
            if (display > m.budgetTotal) return 'text-rose-600'
            return 'text-slate-900'
          })()
          const raw = hasReal
            ? String(Math.round(m.spentTotal))
            : String(Math.round(m.budgetTotal))

          return (
            <EditableCell
              value={raw}
              onSave={(v) => void meta.onCommitEdit(r, 'actual', v)}
              display={
                display > 0 ? (
                  <span
                    dir="ltr"
                    className={cn(
                      'inline-block w-full text-end tabular-nums font-bold',
                      color
                    )}
                  >
                    {formatIls(display)}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )
              }
              inputDir="ltr"
              inputMode="decimal"
            />
          )
        },
        footer: ({ table }) => {
          const meta = table.options.meta as VendorTableMeta
          return (
            <span
              dir="ltr"
              className="inline-block w-full text-end font-bold text-slate-900 tabular-nums"
            >
              {formatIls(meta.footerActual)}
            </span>
          )
        },
      }
    ),

    columnHelper.accessor(
      (row) =>
        row.kind === 'data' ? paidSumRef.current!(row.model.key) : 0,
      {
        id: 'paid',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1.5 select-none"
            onClick={column.getToggleSortingHandler()}
          >
            Paid
            <SortIcon direction={column.getIsSorted()} />
          </button>
        ),
        cell: ({ row, table }) => {
          const meta = table.options.meta as VendorTableMeta
          const r = row.original
          if (r.kind !== 'data') return null

          const paid = meta.paidSumForVendor(r.model.key)
          if (paid <= 0)
            return <span className="text-slate-400">—</span>

          const effectiveActual =
            r.model.spentTotal > 0
              ? r.model.spentTotal
              : r.model.budgetTotal
          const pct =
            effectiveActual > 0
              ? Math.round((paid / effectiveActual) * 100)
              : 0
          return (
            <span
              dir="ltr"
              className={cn(
                'inline-block w-full text-end tabular-nums font-semibold',
                paidColorClass(pct)
              )}
            >
              {formatIls(paid)} ({pct}%)
            </span>
          )
        },
        footer: ({ table }) => {
          const meta = table.options.meta as VendorTableMeta
          if (meta.footerPaid <= 0) return null
          const pct =
            meta.footerActual > 0
              ? Math.round((meta.footerPaid / meta.footerActual) * 100)
              : 0
          return (
            <span
              dir="ltr"
              className="inline-block w-full text-end font-bold text-slate-900 tabular-nums"
            >
              {formatIls(meta.footerPaid)} ({pct}%)
            </span>
          )
        },
      }
    ),

    columnHelper.display({
      id: 'progress',
      header: 'Progress',
      cell: ({ row, table }) => {
        const meta = table.options.meta as VendorTableMeta
        const r = row.original
        if (r.kind !== 'data') return null
        const m = r.model
        const effectiveActual =
          m.spentTotal > 0 ? m.spentTotal : m.budgetTotal
        const paid = meta.paidSumForVendor(m.key)
        return (
          <VendorBudgetProgressBar
            budget={m.budgetTotal}
            actual={effectiveActual}
            paid={paid}
          />
        )
      },
      footer: ({ table }) => {
        const meta = table.options.meta as VendorTableMeta
        return (
          <VendorBudgetProgressBar
            budget={meta.footerBudget}
            actual={meta.footerActual}
            paid={meta.footerPaid}
          />
        )
      },
      enableSorting: false,
    }),
  ]
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

const COL_HEADER_CLS: Record<string, string> = {
  vendor: 'text-start',
  rooms: 'text-start w-[180px]',
  budget: 'text-end w-[120px]',
  actual: 'text-end w-[120px]',
  paid: 'text-end w-[130px]',
  progress: 'text-center w-[140px] hidden lg:table-cell',
}

const COL_CELL_CLS: Record<string, string> = {
  vendor: 'text-start',
  rooms: 'text-start',
  budget: '',
  actual: '',
  paid: '',
  progress: 'hidden lg:table-cell',
}

export function VendorBudgetTable({
  tableRows,
  rooms,
  roomNameById,
  paidSumForVendor,
  onCommitEdit,
  onToggleRoom,
  onContextMenu,
  footerBudget,
  footerActual,
  footerPaid,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'vendor', desc: false },
  ])
  const [roomsDD, setRoomsDD] = useState<RoomsDropdownState | null>(null)

  const roomNameByIdRef = useRef(roomNameById)
  roomNameByIdRef.current = roomNameById
  const paidSumRef = useRef(paidSumForVendor)
  paidSumRef.current = paidSumForVendor

  const columns = useMemo(
    () => buildColumns(roomNameByIdRef, paidSumRef),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const meta: VendorTableMeta = useMemo(
    () => ({
      rooms,
      roomNameById,
      paidSumForVendor,
      onCommitEdit,
      onToggleRoom,
      openRoomsDropdown: setRoomsDD,
      footerBudget,
      footerActual,
      footerPaid,
    }),
    [
      rooms,
      roomNameById,
      paidSumForVendor,
      onCommitEdit,
      onToggleRoom,
      footerBudget,
      footerActual,
      footerPaid,
    ]
  )

  const table = useReactTable({
    data: tableRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta,
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[min(72vh,760px)] min-h-[320px] overflow-auto">
        <table className="w-full border-collapse">
          {/* ── Head ── */}
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-slate-50/80 border-b border-slate-200">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm px-3 py-3 text-[12px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200',
                      COL_HEADER_CLS[header.id] ?? ''
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* ── Body ── */}
          <tbody>
            {table.getRowModel().rows.map((row, idx) => {
              const r = row.original

              return (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-slate-100 transition-colors hover:bg-blue-50/40',
                    idx % 2 === 1 && 'bg-slate-50/40'
                  )}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    onContextMenu(r, e.clientX, e.clientY)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-3 py-2.5 lg:py-2 text-[14px]',
                        COL_CELL_CLS[cell.column.id] ?? ''
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>

          {/* ── Foot ── */}
          <tfoot>
            {table.getFooterGroups().map((fg) => (
              <tr
                key={fg.id}
                className="sticky bottom-0 bg-slate-50/95 backdrop-blur-sm border-t-2 border-slate-300"
              >
                {fg.headers.map((header) => (
                  <td
                    key={header.id}
                    className={cn(
                      'px-3 py-3 text-[14px]',
                      COL_CELL_CLS[header.id] ?? ''
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                  </td>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {/* Rooms dropdown (portal) */}
      {roomsDD && (
        <RoomsDropdownPanel
          rooms={rooms}
          selectedIds={roomsDD.selectedIds}
          vendorName={roomsDD.vendorName}
          rect={roomsDD.rect}
          onToggle={(roomId, checked) => {
            onToggleRoom(roomsDD.vendorKey, roomId, checked)
            setRoomsDD((prev) =>
              prev
                ? {
                    ...prev,
                    selectedIds: checked
                      ? [...prev.selectedIds, roomId]
                      : prev.selectedIds.filter((id) => id !== roomId),
                  }
                : null
            )
          }}
          onClose={() => setRoomsDD(null)}
        />
      )}
    </div>
  )
}
