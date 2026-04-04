'use client'

import Link from 'next/link'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { formatIls, formatTaskDue } from '@/lib/renovation-format'
import { profileFirstName, timeGreetingForProfile } from '@/lib/renovation-profile'
import { formatUpcomingEventWhen, useRenovationDashboardPage } from './useRenovationDashboardPage'

export function RenovationDashboardMobile() {
  const {
    project,
    loading,
    activeProfile,
    name,
    setName,
    budget,
    setBudget,
    contingency,
    setContingency,
    creating,
    handleCreate,
    spent,
    dashLoading,
    cap,
    pct,
    over,
    upcoming,
    upcomingEvents,
  } = useRenovationDashboardPage()
  const { isExpenseModalOpen, setIsExpenseModalOpen, isTaskModalOpen, setIsTaskModalOpen } = useRenovation()

  if (loading) return null

  if (!project) {
    return (
      <div className="pb-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-5 shadow-sm ring-1 ring-indigo-100">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900 leading-tight">Start your project</h1>
          <p className="text-[16px] text-slate-500 mt-2 leading-relaxed font-medium px-1">
            Set up your space. You can change details later in Settings.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60">
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Project name</label>
            <input
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dream House Rothschild"
              className="w-full min-h-[52px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[16px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              required
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Budget (₪)</label>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="w-full min-h-[52px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[16px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contingency (₪)</label>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={contingency}
                onChange={(e) => setContingency(e.target.value)}
                placeholder="0"
                className="w-full min-h-[52px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[16px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-full min-h-[52px] rounded-xl bg-indigo-600 text-white text-[16px] font-bold shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Working…
              </>
            ) : (
              'Launch project'
            )}
          </button>
        </form>
      </div>
    )
  }

  const greet = timeGreetingForProfile(activeProfile?.name)
  const greetName = activeProfile ? profileFirstName(activeProfile.name) : null

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      {greetName && (
        <p className="text-[16px] font-semibold text-slate-600" dir="auto">
          <span className="text-slate-400">{greet.label}, </span>
          <span className="text-indigo-600">{greetName}</span>
        </p>
      )}

      {dashLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200/60 rounded-2xl" />
          <div className="h-24 bg-slate-200/60 rounded-2xl" />
          <div className="h-20 bg-slate-200/60 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Budget summary */}
          <section className="rounded-2xl bg-white border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[14px] font-bold text-slate-500 uppercase tracking-wide">Budget</h2>
              <Link
                href="/renovation/budget"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 active:bg-slate-100"
                aria-label="Budget details"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <p className={`text-[28px] font-bold tabular-nums leading-tight ${over ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatIls(cap - spent)}
              <span className="text-[16px] font-semibold text-slate-400 ml-2">remaining</span>
            </p>
            {over && (
              <p className="text-[14px] font-bold text-rose-600 mt-1">Over budget by {formatIls(spent - cap)}</p>
            )}
            <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : pct >= 85 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[14px] font-medium text-slate-500 mt-2 tabular-nums">
              <span>{formatIls(spent)} spent</span>
              <span>{formatIls(cap)} total</span>
            </div>
          </section>

          {/* Upcoming tasks & events */}
          {(upcoming.length > 0 || upcomingEvents.length > 0) && (
            <section className="rounded-2xl bg-white border border-slate-200/60 p-5 shadow-sm">
              <h2 className="text-[18px] font-bold text-slate-900 mb-3">Coming up</h2>
              <ul className="space-y-1">
                {upcoming.map((t) => {
                  const dueMeta = formatTaskDue(t.due_date!, { isDone: false })
                  return (
                    <li key={t.id}>
                      <Link
                        href="/renovation/tasks"
                        className="flex items-center justify-between gap-3 min-h-[48px] py-2.5 border-b border-slate-100 last:border-0 active:bg-slate-50 rounded-lg px-1"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-[16px] font-medium text-slate-800 truncate" dir="auto">
                            {t.title}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 text-[13px] font-bold tabular-nums px-2.5 py-1 rounded-lg ${
                            dueMeta.tone === 'overdue'
                              ? 'bg-rose-50 text-rose-700'
                              : dueMeta.tone === 'soon'
                                ? 'bg-amber-50 text-amber-900'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {dueMeta.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
                {upcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href="/renovation/calendar"
                      className="flex items-center justify-between gap-3 min-h-[48px] py-2.5 border-b border-slate-100 last:border-0 active:bg-slate-50 rounded-lg px-1"
                      dir="auto"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            ev.event_type === 'provider_meeting' ? 'bg-purple-500' : 'bg-sky-500'
                          }`}
                        />
                        <span className="text-[16px] font-medium text-slate-800 truncate">{ev.title}</span>
                      </div>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-500">
                        {formatUpcomingEventWhen(ev)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quick actions */}
          <section className="space-y-2">
            <h2 className="text-[18px] font-bold text-slate-900 mb-1">Quick actions</h2>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex w-full items-center gap-4 min-h-[56px] px-4 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm active:bg-slate-50 transition-colors"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-[16px] font-semibold text-slate-900">Add Expense</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="flex w-full items-center gap-4 min-h-[56px] px-4 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm active:bg-slate-50 transition-colors"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-[16px] font-semibold text-slate-900">Add Task</span>
            </button>

            <Link
              href="/renovation/gallery"
              className="flex w-full items-center gap-4 min-h-[56px] px-4 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm active:bg-slate-50 transition-colors"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[16px] font-semibold text-slate-900">Add Photos</span>
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
