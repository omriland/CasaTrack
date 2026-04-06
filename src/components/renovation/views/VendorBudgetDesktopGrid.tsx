'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'
import type { TableRow } from './vendor-budget-types'

type Props = {
  tableRows: TableRow[]
  footerBudget: number
  footerActual: number
  onCellValueChanged: (
    row: TableRow,
    field: 'vendor' | 'budget' | 'actual',
    newValue: string,
    revert: () => void
  ) => Promise<void>
  onBodyContextMenu: (tableRow: TableRow, clientX: number, clientY: number) => void
  addDraftAfter: (afterKey: string | null) => void
  /** Returns the total paid sum for a given row */
  getPaidSum: (tableRow: TableRow) => number
}

const FIELD_MAP: Record<number, 'vendor' | 'budget' | 'actual'> = {
  0: 'vendor',
  1: 'budget',
  2: 'actual',
}

export function VendorBudgetDesktopGrid({
  tableRows,
  footerBudget,
  footerActual,
  onCellValueChanged,
  onBodyContextMenu,
  addDraftAfter,
  getPaidSum,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hotInstanceRef = useRef<any>(null)

  // Keep refs to latest callbacks to avoid stale closures
  const onCellValueChangedRef = useRef(onCellValueChanged)
  onCellValueChangedRef.current = onCellValueChanged
  const onBodyContextMenuRef = useRef(onBodyContextMenu)
  onBodyContextMenuRef.current = onBodyContextMenu
  const addDraftAfterRef = useRef(addDraftAfter)
  addDraftAfterRef.current = addDraftAfter
  const getPaidSumRef = useRef(getPaidSum)
  getPaidSumRef.current = getPaidSum

  // Format a number with commas and ₪ sign
  const fmtNIS = (v: string | number): string => {
    const n = typeof v === 'string' ? Number(v.toString().replace(/,/g, '')) : v
    if (isNaN(n) || n === 0) return ''
    return `₪ ${n.toLocaleString('en-US')}`
  }

  // Get color for paid percentage
  const paidColor = (pct: number): string => {
    if (pct >= 100) return '#00a53c'
    if (pct >= 60) return '#0443f1'
    if (pct >= 30) return '#ff9800'
    return '#ff273b'
  }

  // Build a simple 2D array — 4 columns: Vendor, Budget, Actual, Paid
  const { data, rowMeta } = useMemo(() => {
    const rows: (string | number)[][] = []
    const meta: (TableRow | null)[] = []
    let totalPaid = 0

    for (const r of tableRows) {
      const paid = getPaidSum(r)
      totalPaid += paid

      if (r.kind === 'draft') {
        rows.push([r.draft.vendorInput || '', '', '', ''])
        meta.push(r)
      } else {
        const m = r.model
        const hasReal = m.spentTotal > 0
        const effectiveActual = hasReal ? m.spentTotal : m.budgetTotal
        const pct = effectiveActual > 0 ? Math.round((paid / effectiveActual) * 100) : 0

        rows.push([
          m.displayVendor,
          m.budgetTotal || 0,
          hasReal ? m.spentTotal : '',
          paid > 0 ? `₪ ${paid.toLocaleString('en-US')} (${pct}%)` : '',
        ])
        meta.push(r)
      }
    }

    // Totals row
    const overallPct = footerActual > 0 ? Math.round((totalPaid / footerActual) * 100) : 0
    rows.push([
      'Totals',
      footerBudget,
      footerActual,
      totalPaid > 0 ? `₪ ${totalPaid.toLocaleString('en-US')} (${overallPct}%)` : '',
    ])
    meta.push(null)

    return { data: rows, rowMeta: meta, footerPaid: totalPaid, footerPaidPct: overallPct }
  }, [tableRows, footerBudget, footerActual, getPaidSum])

  const rowMetaRef = useRef(rowMeta)
  rowMetaRef.current = rowMeta

  const dataRef = useRef(data)
  dataRef.current = data

  // Imperatively mount Handsontable
  useEffect(() => {
    let hot: any = null
    let destroyed = false

    async function init() {
      const Handsontable = (await import('handsontable')).default
      const { registerAllModules } = await import('handsontable/registry')
      registerAllModules()

      if (destroyed || !containerRef.current) return

      // Custom renderer for budget column — centered
      const currencyRenderer = function (
        _instance: any, td: HTMLTableCellElement, _row: number, _col: number,
        _prop: any, value: any, _cellProperties: any
      ) {
        td.textContent = fmtNIS(value)
        td.style.textAlign = 'center'
        td.dir = 'ltr'
      }

      // Custom renderer for actual column — color-coded vs budget
      const actualRenderer = function (
        _instance: any, td: HTMLTableCellElement, row: number, _col: number,
        _prop: any, value: any, _cellProperties: any
      ) {
        td.style.textAlign = 'center'
        td.dir = 'ltr'

        const tableRow = rowMetaRef.current[row]
        const hasRealValue = value !== '' && value !== null && value !== undefined && value !== 0
        const numValue = hasRealValue ? (typeof value === 'string' ? Number(value.toString().replace(/,/g, '')) : Number(value)) : 0

        if (hasRealValue) {
          td.textContent = fmtNIS(value)
          // Color based on comparison with budget
          if (tableRow && tableRow.kind === 'data') {
            const budget = tableRow.model.budgetTotal
            if (budget > 0) {
              if (numValue < budget) {
                td.style.color = '#16a34a' // green — under budget
              } else if (numValue > budget) {
                td.style.color = '#dc2626' // red — over budget
              } else {
                td.style.color = '#1e293b' // dark slate — equal
              }
            } else {
              td.style.color = '#1e293b'
            }
          } else {
            td.style.color = '#1e293b'
          }
        } else {
          // No real actual — show budget fallback in gray
          if (tableRow && tableRow.kind === 'data' && tableRow.model.budgetTotal > 0) {
            td.textContent = fmtNIS(tableRow.model.budgetTotal)
            td.style.color = '#94a3b8' // light gray — fallback
          } else {
            td.textContent = ''
            td.style.color = ''
          }
        }
      }

      // Custom renderer for Paid column — color-coded by percentage
      const paidRenderer = function (
        _instance: any, td: HTMLTableCellElement, row: number, _col: number,
        _prop: any, value: any, _cellProperties: any
      ) {
        td.style.textAlign = 'center'
        td.dir = 'ltr'
        td.textContent = value || ''

        const totalRowIdx = dataRef.current.length - 1

        if (!value || value === '') {
          td.style.color = ''
          return
        }

        // Extract percentage from "₪ X,XXX (YY%)"
        const pctMatch = String(value).match(/\((\d+)%\)/)
        const pct = pctMatch ? parseInt(pctMatch[1], 10) : 0

        // Apply color using setProperty to beat global CSS
        const color = paidColor(pct)
        td.style.setProperty('color', color, 'important')

        if (row === totalRowIdx) {
          td.style.fontWeight = '700'
        } else {
          td.style.fontWeight = '600'
        }
      }

      hot = new Handsontable(containerRef.current, {
        data: dataRef.current.map((row) => [...row]),
        licenseKey: 'non-commercial-and-evaluation',
        colHeaders: ['Vendor', 'Budget', 'Actual', 'Paid'],
        rowHeaders: false,
        manualColumnResize: true,
        stretchH: 'all',
        width: '100%',
        height: '100%',
        layoutDirection: 'rtl',
        colWidths: [300, 130, 130, 130],
        columns: [
          { type: 'text' },
          { type: 'numeric', renderer: currencyRenderer },
          { type: 'numeric', renderer: actualRenderer },
          { type: 'text', renderer: paidRenderer, readOnly: true },
        ],
        // Disable Handsontable's built-in context menu — we use a unified custom one
        contextMenu: false,
        // Click-to-edit: single click enters edit, Enter confirms
        enterBeginsEditing: true,
        afterChange(changes: any[] | null, source: string) {
          if (source === 'loadData' || source === 'revert' || !changes) return

          for (const [rowIdx, colIdx, oldValue, newValue] of changes) {
            if (oldValue === newValue) continue
            const tableRow = rowMetaRef.current[rowIdx]
            if (!tableRow) continue

            const field = FIELD_MAP[colIdx as number]
            if (!field) continue

            const revert = () => {
              hot?.setDataAtCell(rowIdx, colIdx as number, oldValue, 'revert')
            }
            void onCellValueChangedRef.current(tableRow, field, String(newValue ?? ''), revert)
          }
        },
        // Single right-click handler → fires the unified parent context menu
        afterOnCellContextMenu(event: MouseEvent, coords: any) {
          event.preventDefault()
          if (coords.row >= 0 && coords.row < rowMetaRef.current.length) {
            const tableRow = rowMetaRef.current[coords.row]
            if (tableRow) {
              onBodyContextMenuRef.current(tableRow, event.clientX, event.clientY)
            }
          }
        },
        cells(row: number, col: number) {
          const cellProps: any = {}
          const totalRowIdx = dataRef.current.length - 1

          if (row === totalRowIdx) {
            cellProps.readOnly = true
            cellProps.className = 'htCenter htBold ht-totals-row'
          } else {
            // Paid column is always read-only
            if (col === 3) {
              cellProps.readOnly = true
              cellProps.className = 'htCenter'
            } else {
              cellProps.readOnly = false
              if (col === 1 || col === 2) {
                cellProps.className = 'htCenter'
              }
            }

            const tableRow = rowMetaRef.current[row]
            if (tableRow) {
              if (col === 0 && tableRow.kind === 'draft' && !tableRow.draft.vendorInput.trim()) {
                cellProps.className = 'ht-draft-placeholder'
              }
            }
          }
          return cellProps
        },
        // Force font on every cell
        afterRenderer(td: HTMLTableCellElement) {
          const fontStack = "'Open Sans', Calibri, Arial, sans-serif"
          td.style.setProperty('font-family', fontStack, 'important')
          td.style.setProperty('font-size', '14px', 'important')
        },
        // Force font on column headers too
        afterInit() {
          const container = containerRef.current
          if (!container) return
          const fontStack = "'Open Sans', Calibri, Arial, sans-serif"
          container.querySelectorAll<HTMLElement>('th').forEach((th) => {
            th.style.setProperty('font-family', fontStack, 'important')
          })
        },
        // Force font on editor input when editing begins
        afterBeginEditing() {
          const fontStack = "'Open Sans', Calibri, Arial, sans-serif"
          setTimeout(() => {
            document.querySelectorAll<HTMLElement>('.handsontableInput').forEach((el) => {
              el.style.setProperty('font-family', fontStack, 'important')
              el.style.setProperty('font-size', '14px', 'important')
            })
          }, 0)
        },
      })

      hotInstanceRef.current = hot
    }

    init()

    return () => {
      destroyed = true
      if (hot && !hot.isDestroyed) {
        hot.destroy()
      }
      hotInstanceRef.current = null
    }
  }, [])

  // Update data when it changes
  useEffect(() => {
    if (!hotInstanceRef.current || hotInstanceRef.current.isDestroyed) return
    hotInstanceRef.current.loadData(data.map((row) => [...row]))
  }, [data])

  return (
    <div className="w-full overflow-hidden border border-slate-200 bg-white shadow-sm rounded-lg">
      <style>{`
        /* Force font via the CSS variable that Handsontable reads */
        [class*=ht-theme-main] {
          --ht-font-family: 'Open Sans', Calibri, Arial, sans-serif !important;
        }
        [class*=ht-theme-main] .handsontable,
        [class*=ht-theme-main] .handsontable td,
        [class*=ht-theme-main] .handsontable th,
        [class*=ht-theme-main] .handsontable input,
        [class*=ht-theme-main] .handsontable textarea {
          font-family: 'Open Sans', Calibri, Arial, sans-serif !important;
        }
        .ht-ghost-actual { color: #94a3b8 !important; }
        .ht-draft-placeholder { color: #94a3b8 !important; font-style: italic !important; }
        .htBold { font-weight: 700 !important; }
        .ht-totals-row { background-color: #f1f5f9 !important; border-top: 2px solid #cbd5e1 !important; }

        /* Alternating row colors (zebra stripes) */
        .ht-theme-main .handsontable tbody tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .ht-theme-main .handsontable tbody tr:nth-child(odd) td {
          background-color: #ffffff;
        }

        /* Row hover highlight */
        .ht-theme-main .handsontable tbody tr:hover td {
          background-color: rgba(219, 234, 254, 0.5) !important;
          transition: background-color 0.12s ease;
        }

        /* Active cell editing — blue outline, no shadow */
        [class*=ht-theme-main] .handsontable td.current {
          outline: 2px solid #3b82f6 !important;
          outline-offset: -2px;
        }
        /* Editor input styling */
        [class*=ht-theme-main] .handsontableInput {
          font-family: 'Open Sans', Calibri, Arial, sans-serif !important;
          font-size: 14px !important;
          padding: 6px 8px !important;
          box-shadow: inset 0 0 0 2px #3b82f6 !important;
          border: none !important;
          background: #eff6ff !important;
        }

        /* Remove scrollbar gutter completely */
        .ht-theme-main .wtHolder {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .ht-theme-main .wtHolder::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="ht-theme-main"
        style={{
          height: 'min(72vh, 760px)',
          minHeight: 320,
          width: '100%',
        }}
      />
    </div>
  )
}
