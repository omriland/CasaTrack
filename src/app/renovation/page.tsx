'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createProject,
  effectiveBudget,
  listExpenses,
  listGalleryItems,
  listTasks,
  expensesThisMonth,
} from '@/lib/renovation'
import { formatIls, formatTaskDue, taskDueCalendarDiffDays } from '@/lib/renovation-format'
import type { RenovationExpense, RenovationGalleryItem, RenovationTask } from '@/types/renovation'

export default function RenovationDashboardPage() {
  const { project, loading, refresh, setExpenseModalOpen } = useRenovation()
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [contingency, setContingency] = useState('')
  const [creating, setCreating] = useState(false)
  const [spent, setSpent] = useState(0)
  const [monthSpend, setMonthSpend] = useState(0)
  const [recentExpenses, setRecentExpenses] = useState<RenovationExpense[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [gallery, setGallery] = useState<RenovationGalleryItem[]>([])
  const [dashLoading, setDashLoading] = useState(false)

  const loadDash = useCallback(async () => {
    if (!project) return
    setDashLoading(true)
    try {
      const [ex, t, g] = await Promise.all([
        listExpenses(project.id),
        listTasks(project.id),
        listGalleryItems(project.id),
      ])
      setSpent(ex.reduce((s, e) => s + Number(e.amount), 0))
      setMonthSpend(expensesThisMonth(ex))
      setRecentExpenses(ex.slice(0, 5))
      setTasks(t)
      setGallery(g.slice(0, 6))
    } catch (e) {
      console.error(e)
    } finally {
      setDashLoading(false)
    }
  }, [project])

  useEffect(() => {
    loadDash()
  }, [loadDash])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      await createProject({
        name: name.trim(),
        total_budget: Number(budget) || 0,
        contingency_amount: Number(contingency) || 0,
      })
      await refresh()
      setName('')
      setBudget('')
      setContingency('')
    } catch (err) {
      console.error(err)
      alert('Could not create project. Did you run the SQL migration in Supabase?')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return null

  if (!project) {
    return (
      <div className="max-w-xl mx-auto pt-8 md:pt-16 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded bg-indigo-50 text-indigo-600 mb-6 shadow-sm ring-1 ring-indigo-100">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Start your project
          </h1>
          <p className="text-[16px] text-slate-500 mt-3 px-4 leading-relaxed font-medium">
            Set up your main project space. You can archive it later and start fresh.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 bg-white/70 backdrop-blur-xl rounded p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50">
          <div>
            <label className="block text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
              Project name
            </label>
            <input
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dream House Rothschild"
              className="w-full h-14 px-4 rounded bg-white border border-slate-200 text-slate-900 text-lg shadow-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
                Budget (₪)
              </label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="w-full h-14 px-4 rounded bg-white border border-slate-200 text-slate-900 text-lg shadow-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">
                Contingency (₪)
              </label>
              <input
                type="number"
                min={0}
                value={contingency}
                onChange={(e) => setContingency(e.target.value)}
                placeholder="0"
                className="w-full h-14 px-4 rounded bg-white border border-slate-200 text-slate-900 text-lg shadow-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full h-14 mt-4 rounded bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-lg font-bold shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                 Initializing...
               </>
            ) : 'Launch Project'}
          </button>
        </form>
      </div>
    )
  }

  const cap = effectiveBudget(project)
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0
  const over = spent > cap && cap > 0
  const openTasks = tasks.filter((t) => t.status !== 'done').length
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false
    return taskDueCalendarDiffDays(t.due_date) < 0
  }).length
  const upcoming = tasks
    .filter((t) => t.due_date && t.status !== 'done')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 4)

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             Active Phase
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900" dir="auto">
            {project.name}
          </h1>
        </div>
        <div className="hidden md:flex gap-3">
           <button onClick={() => setExpenseModalOpen(true)} className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded text-[14px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
              + Add Expense
           </button>
        </div>
      </header>

      {dashLoading ? (
        <div className="space-y-4 animate-pulse pt-4">
          <div className="h-44 bg-slate-200/50 rounded-md" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-48 bg-slate-200/50 rounded-md" />
            <div className="h-48 bg-slate-200/50 rounded-md" />
          </div>
        </div>
      ) : (
        <>
          {/* Main Budget Card */}
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded shadow-xl text-white">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none text-white">
               <svg className="w-64 h-64 -mt-16 -mr-16 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            </div>
            
            <div className="relative p-5 sm:p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[13px] text-slate-300 font-semibold uppercase tracking-widest flex items-center gap-2">
                  Remaining Balance
                </span>
                <Link href="/renovation/budget" className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95">
                  <svg className="w-5 h-5 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <p className={`text-4xl md:text-5xl font-bold tracking-tight tabular-nums mt-1 ${over ? 'text-rose-400' : 'text-white'}`}>
                    {formatIls(cap - spent)}
                  </p>
                  {over && <p className="inline-block mt-2 px-2.5 py-1 bg-rose-500/20 text-rose-300 text-[13px] font-bold rounded backdrop-blur-md">Exceeded by {formatIls(spent - cap)}</p>}
                </div>
                
                <div className="flex-1 max-w-sm w-full bg-slate-800/50 rounded p-4 backdrop-blur-md border border-white/5">
                  <div className="flex justify-between text-[13px] font-medium text-slate-300 mb-2 tabular-nums">
                    <span>{formatIls(spent)} spent</span>
                    <span>{formatIls(cap)} budget</span>
                  </div>
                  <div className="h-2.5 bg-slate-900/50 rounded-full overflow-hidden ring-1 ring-inset ring-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${over ? 'bg-rose-500' : pct >= 85 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 md:px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[14px]">
              <span className="text-slate-400 font-medium">This month</span>
              <span className="font-semibold tabular-nums text-white bg-white/10 px-3 py-1 rounded-full">{formatIls(monthSpend)}</span>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-5">
            {/* Tasks Widget */}
            <div className="bg-white rounded border border-slate-200/60 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-[20px] font-bold text-slate-900">Task Center</h2>
                </div>
                <Link href="/renovation/tasks" className="text-[14px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-colors active:scale-95">
                  View All
                </Link>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-slate-50 rounded p-4 border border-slate-100 text-center">
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{openTasks}</p>
                  <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500 mt-1">Open</p>
                </div>
                <div className="flex-1 bg-rose-50/50 rounded p-4 border border-rose-100 text-center">
                  <p className={`text-3xl font-extrabold tabular-nums ${overdue ? 'text-rose-600' : 'text-slate-700'}`}>{overdue}</p>
                  <p className="text-[12px] font-bold uppercase tracking-widest text-rose-500/70 mt-1">Overdue</p>
                </div>
              </div>
              
              {upcoming.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Upcoming Deadlines</p>
                  <ul className="space-y-2">
                    {upcoming.map((t) => {
                      const dueMeta = formatTaskDue(t.due_date!, { isDone: false })
                      return (
                      <li key={t.id} className="group flex items-center justify-between p-3 rounded hover:bg-slate-50 transition-colors text-[14px]">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.urgency === 'high' || t.urgency === 'critical' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                          <span className="font-medium text-slate-800 truncate" dir="auto">
                            {t.title}
                          </span>
                        </div>
                        <span
                          title={dueMeta.title}
                          className={`font-medium tabular-nums ml-4 text-[13px] px-2 py-0.5 rounded group-hover:bg-white transition-colors border ${
                            dueMeta.tone === 'overdue'
                              ? 'text-rose-600 bg-rose-50 border-rose-200/80'
                              : dueMeta.tone === 'soon'
                                ? 'text-amber-900 bg-amber-50 border-amber-200/70'
                                : 'text-slate-500 bg-slate-100 border-slate-200'
                          }`}
                        >
                          {dueMeta.label}
                        </span>
                      </li>
                    )})}
                  </ul>
                </div>
              )}
            </div>

            {/* Expenses Widget */}
            <div className="bg-white rounded border border-slate-200/60 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded text-emerald-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-[20px] font-bold text-slate-900">Recent Spend</h2>
                </div>
                <Link href="/renovation/expenses" className="text-[14px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors active:scale-95">
                  View All
                </Link>
              </div>
              
              {recentExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </div>
                  <p className="text-[15px] font-medium text-slate-500">No expenses logged yet</p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {recentExpenses.map((e) => (
                    <li key={e.id} className="flex items-center justify-between p-3 rounded hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 text-[14px] font-bold uppercase">
                          {(e.vendor || e.category || 'X')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-[15px] truncate" dir="auto">
                            {e.vendor || e.category || 'General Expense'}
                          </p>
                          {e.vendor && e.category && (
                            <p className="text-[12px] text-slate-500 font-medium truncate mt-0.5">{e.category}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums ml-4 text-[15px]">
                        {formatIls(Number(e.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Gallery Snapshot */}
          <section className="bg-white rounded border border-slate-200/60 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-pink-50 rounded text-pink-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-[18px] font-bold text-slate-900">Latest Photos</h2>
               </div>
              <Link href="/renovation/gallery" className="text-[13px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-full transition-colors">
                Gallery
              </Link>
            </div>
            
            {gallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50/50 rounded border border-dashed border-slate-200">
                <p className="text-[15px] font-medium text-slate-500">No photos added yet</p>
                <Link href="/renovation/gallery" className="mt-3 text-indigo-600 text-sm font-bold hover:underline">Upload your first photo</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {gallery.map((item) => (
                  <Link
                    key={item.id}
                    href="/renovation/gallery"
                    className="group relative aspect-square rounded overflow-hidden bg-slate-100 transform active:scale-95 transition-all shadow-sm ring-1 ring-slate-900/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.public_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      
      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setExpenseModalOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(79,70,229,0.4)] hover:bg-indigo-700 active:scale-90 transition-all"
          aria-label="Add Expense"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
