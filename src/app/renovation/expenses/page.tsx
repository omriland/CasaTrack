'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  deleteExpense,
  listExpenses,
  updateExpense,
  uploadReceipt,
} from '@/lib/renovation'
import { ExpenseModal } from '@/components/renovation/ExpenseModal'
import { formatDateDisplay, formatIls } from '@/lib/renovation-format'
import type { RenovationExpense } from '@/types/renovation'

export default function ExpensesPage() {
  const { project } = useRenovation()
  const [list, setList] = useState<RenovationExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [editing, setEditing] = useState<RenovationExpense | null>(null)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      setList(await listExpenses(project.id))
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setSheet(true)
  }

  const openEdit = (e: RenovationExpense) => {
    setEditing(e)
    setSheet(true)
  }

  const attachReceipt = async (exp: RenovationExpense, file: File) => {
    try {
      const path = await uploadReceipt(project!.id, file)
      await updateExpense(exp.id, { receipt_storage_path: path })
      await load()
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    await load()
  }

  if (!project) {
    return (
      <p className="text-center text-black/45 py-16">
        <a href="/renovation" className="text-[#007AFF]">
          Create a project first
        </a>
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide">Expenses</p>
          <h1 className="text-[28px] font-semibold tracking-tight">Spend</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="h-10 px-4 rounded-md bg-[#007AFF] text-white text-[15px] font-semibold active:scale-[0.98]"
        >
          Add
        </button>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-md border border-black/[0.06]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-md border border-black/[0.06] p-10 text-center">
          <p className="text-[15px] text-black/45">No expenses yet</p>
          <button type="button" onClick={openNew} className="mt-4 text-[#007AFF] font-semibold text-[17px]">
            Add expense
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-black/[0.06] overflow-hidden divide-y divide-black/[0.06]">
          {list.map((row) => (
            <div key={row.id} className="flex items-center gap-3 p-4 active:bg-black/[0.02]">
              <button type="button" onClick={() => openEdit(row)} className="flex-1 text-left min-w-0">
                <p className="text-[15px] font-medium truncate" dir="auto">
                  {row.vendor || row.category || 'Expense'}
                </p>
                <p className="text-[13px] text-black/45 tabular-nums">{formatDateDisplay(row.expense_date)}</p>
              </button>
              <span className="text-[17px] font-semibold tabular-nums shrink-0">{formatIls(Number(row.amount))}</span>
              <label className="shrink-0 text-[13px] text-[#007AFF] cursor-pointer">
                receipt
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(ev) => {
                    const f = ev.target.files?.[0]
                    if (f) attachReceipt(row, f)
                    ev.target.value = ''
                  }}
                />
              </label>
              <button type="button" onClick={() => remove(row.id)} className="text-[#FF3B30] text-[13px] px-1">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {sheet && (
        <ExpenseModal
          editing={editing}
          onClose={() => setSheet(false)}
          onSave={() => {
            setSheet(false)
            load()
          }}
        />
      )}
    </div>
  )
}
