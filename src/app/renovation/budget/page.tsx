'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createBudgetLine,
  deleteBudgetLine,
  effectiveBudget,
  listBudgetLines,
  listExpenses,
  updateBudgetLine,
  updateProject,
} from '@/lib/renovation'
import { formatIls } from '@/lib/renovation-format'
import type { RenovationBudgetLine } from '@/types/renovation'

export default function BudgetPage() {
  const { project, refresh } = useRenovation()
  const [lines, setLines] = useState<RenovationBudgetLine[]>([])
  const [spent, setSpent] = useState(0)
  const [total, setTotal] = useState('')
  const [cont, setCont] = useState('')
  const [loading, setLoading] = useState(true)
  const [newCat, setNewCat] = useState('')
  const [newAmt, setNewAmt] = useState('')

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [l, ex] = await Promise.all([listBudgetLines(project.id), listExpenses(project.id)])
      setLines(l)
      setSpent(ex.reduce((s, e) => s + Number(e.amount), 0))
      setTotal(String(project.total_budget))
      setCont(String(project.contingency_amount))
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const saveTotals = async () => {
    if (!project) return
    try {
      await updateProject(project.id, {
        total_budget: Number(total) || 0,
        contingency_amount: Number(cont) || 0,
      })
      await refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to save')
    }
  }

  const addLine = async () => {
    if (!project || !newCat.trim()) return
    try {
      await createBudgetLine(project.id, newCat.trim(), Number(newAmt) || 0)
      setNewCat('')
      setNewAmt('')
      await load()
    } catch (e) {
      console.error(e)
      alert('Failed')
    }
  }

  const lineSum = lines.reduce((s, l) => s + Number(l.amount_allocated), 0)
  const cap = project ? effectiveBudget({ ...project, total_budget: Number(total) || 0, contingency_amount: Number(cont) || 0 }) : 0

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
    <div className="space-y-6 max-w-xl">
      <header>
        <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide">Plan</p>
        <h1 className="text-[28px] font-semibold tracking-tight">Budget</h1>
      </header>

      <section className="bg-white rounded-md border border-black/[0.06] p-5 space-y-4">
        <h2 className="text-[17px] font-semibold">Totals</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] text-black/45">Budget (₪)</label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              onBlur={saveTotals}
              className="mt-1 w-full h-11 px-3 rounded-md border border-black/[0.12] text-[17px] tabular-nums"
            />
          </div>
          <div>
            <label className="text-[13px] text-black/45">Contingency (₪)</label>
            <input
              type="number"
              value={cont}
              onChange={(e) => setCont(e.target.value)}
              onBlur={saveTotals}
              className="mt-1 w-full h-11 px-3 rounded-md border border-black/[0.12] text-[17px] tabular-nums"
            />
          </div>
        </div>
        <p className="text-[15px] text-black/45">
          Effective cap: <span className="font-semibold text-[#1C1C1E] tabular-nums">{formatIls(cap)}</span>
        </p>
        <p className="text-[15px] text-black/45">
          Spent so far: <span className="font-semibold text-[#1C1C1E] tabular-nums">{loading ? '…' : formatIls(spent)}</span>
        </p>
      </section>

      <section className="bg-white rounded-md border border-black/[0.06] overflow-hidden">
        <div className="p-4 border-b border-black/[0.06] flex justify-between items-center">
          <h2 className="text-[17px] font-semibold">By category</h2>
          {lineSum > 0 && cap > 0 && lineSum !== cap && (
            <span className="text-[13px] text-[#FF9500]">Lines ≠ total</span>
          )}
        </div>
        {loading ? (
          <div className="p-8 text-center text-black/45">Loading…</div>
        ) : (
          <div className="divide-y divide-black/[0.06]">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center gap-2 p-4">
                <input
                  dir="auto"
                  defaultValue={line.category_name}
                  onBlur={async (e) => {
                    const v = e.target.value.trim()
                    if (v && v !== line.category_name) await updateBudgetLine(line.id, { category_name: v })
                    await load()
                  }}
                  className="flex-1 min-w-0 h-10 px-2 rounded-md border border-transparent hover:border-black/[0.08] text-[15px]"
                />
                <input
                  type="number"
                  defaultValue={line.amount_allocated}
                  onBlur={async (e) => {
                    const v = Number(e.target.value)
                    if (!Number.isNaN(v)) await updateBudgetLine(line.id, { amount_allocated: v })
                    await load()
                  }}
                  className="w-28 h-10 px-2 rounded-md border border-black/[0.12] text-[15px] tabular-nums text-right"
                />
                <button type="button" onClick={() => deleteBudgetLine(line.id).then(load)} className="text-[#FF3B30] text-[13px] px-2">
                  Remove
                </button>
              </div>
            ))}
            <div className="p-4 flex gap-2 flex-wrap">
              <input
                dir="auto"
                placeholder="Category name"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="flex-1 min-w-[120px] h-10 px-3 rounded-md border border-black/[0.12] text-[15px]"
              />
              <input
                type="number"
                placeholder="₪"
                value={newAmt}
                onChange={(e) => setNewAmt(e.target.value)}
                className="w-24 h-10 px-3 rounded-md border border-black/[0.12] text-[15px]"
              />
              <button type="button" onClick={addLine} className="h-10 px-4 rounded-md bg-[#007AFF] text-white text-[15px] font-semibold">
                Add
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
