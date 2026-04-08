'use client'

import Link from 'next/link'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { formatIls, formatTaskDue } from '@/lib/renovation-format'
import { profileFirstName, timeGreetingForProfile } from '@/lib/renovation-profile'
import { formatUpcomingEventWhen, useRenovationDashboardPage } from './useRenovationDashboardPage'

export function RenovationDashboardDesktop() {
  const { openExpenseModal } = useRenovation()
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
    plannedTotal,
    recentPayments,
    gallery,
    dashLoading,
    cap,
    committedTotal,
    over,
    spentBarPct,
    plannedBarPct,
    remainingBalance,
    remainingExcludingPlanned,
    budgetOverAmount,
    openTasks,
    overdue,
    upcoming,
    upcomingEvents,
  } = useRenovationDashboardPage()

  if (loading) return null

  if (!project) {
    return (
      <div className="max-w-xl mx-auto pt-16 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded bg-indigo-50 text-indigo-600 mb-6 shadow-sm ring-1 ring-indigo-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-slate-900">Start your project</h1>
          <p className="text-[16px] text-slate-500 mt-3 px-4 leading-relaxed font-medium">
            Set up your main project space. You can archive it later and start fresh.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 bg-white/70 backdrop-blur-xl rounded p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50">
          <div>
            <label className="block text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">Project name</label>
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
              <label className="block text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">Budget (₪)</label>
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
              <label className="block text-[13px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-1">Contingency (₪)</label>
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
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing...
              </>
            ) : (
              'Launch Project'
            )}
          </button>
        </form>
      </div>
    )
  }

  const greet = timeGreetingForProfile(activeProfile?.name)
  const greetName = activeProfile ? profileFirstName(activeProfile.name) : null

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-row items-end justify-between gap-4">
        <div>
          {greetName ? (
            <p className="text-[19px] font-semibold text-indigo-600 mb-2" dir="auto">
              {greet.label}, {greetName}
            </p>
          ) : (
            <p className="text-[19px] font-semibold text-slate-500 mb-2">{greet.label}</p>
          )}
          <h1 className="text-[32px] font-bold tracking-tight text-slate-900" dir="auto">
            {project.name}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => openExpenseModal()}
            className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded text-[14px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            + Add Expense
          </button>
        </div>
      </header>

      {dashLoading ? (
        <div className="space-y-4 animate-pulse pt-4">
          <div className="h-44 bg-slate-200/50 rounded-md" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-slate-200/50 rounded-md" />
            <div className="h-48 bg-slate-200/50 rounded-md" />
          </div>
        </div>
      ) : (
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded shadow-xl text-white">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none text-white">
              <svg className="w-64 h-64 -mt-16 -mr-16 transform rotate-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>

            <div className="relative p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[13px] text-slate-300 font-semibold uppercase tracking-widest flex items-center gap-2">Remaining Balance</span>
                <Link
                  href="/renovation/budget"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="flex flex-row items-end justify-between gap-6">
                <div className="flex min-w-0 flex-col items-stretch">
                  <div className="flex flex-col items-start" dir="ltr">
                    <p
                      className={`w-fit max-w-full text-5xl font-bold tracking-tight tabular-nums mt-1 ${over ? 'text-rose-400' : 'text-white'}`}
                    >
                      {formatIls(remainingBalance)}
                    </p>
                    {plannedTotal > 0 && (
                      <div className="mt-2 w-fit max-w-full space-y-0.5">
                        <p className="text-[12px] font-medium text-slate-400">Excluding planned</p>
                        <p className="w-fit max-w-full text-[12px] font-semibold tabular-nums text-slate-300">
                          {formatIls(remainingExcludingPlanned)}
                        </p>
                      </div>
                    )}
                  </div>
                  {over && (
                    <p className="inline-block mt-2 px-2.5 py-1 bg-rose-500/20 text-rose-300 text-[13px] font-bold rounded backdrop-blur-md">
                      Exceeded by {formatIls(budgetOverAmount)}
                    </p>
                  )}
                </div>

                <div className="flex-1 max-w-sm w-full bg-slate-800/50 rounded p-4 backdrop-blur-md border border-white/5">
                  <div className="flex justify-between text-[13px] font-medium text-slate-300 mb-2 tabular-nums gap-2">
                    <span className="min-w-0">
                      {plannedTotal > 0 ? (
                        <>
                          <span className="text-white/90">{formatIls(committedTotal)}</span>
                          <span className="text-slate-400"> committed</span>
                          <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                            {formatIls(spent)} spent · {formatIls(plannedTotal)} planned
                          </span>
                        </>
                      ) : (
                        <span>{formatIls(spent)} spent</span>
                      )}
                    </span>
                    <span className="shrink-0">{formatIls(cap)} budget</span>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-900/50 ring-1 ring-inset ring-white/10">
                    {spentBarPct > 0 && (
                      <div
                        className="relative h-full shrink-0 overflow-hidden bg-emerald-400 transition-[width] duration-1000 ease-out"
                        style={{ width: `${spentBarPct}%` }}
                      >
                        <div className="absolute inset-0 w-full animate-[shimmer_2s_infinite] bg-white/20" />
                      </div>
                    )}
                    {plannedBarPct > 0 && (
                      <div
                        className="relative h-full shrink-0 overflow-hidden bg-yellow-400 transition-[width] duration-1000 ease-out"
                        style={{ width: `${plannedBarPct}%` }}
                      >
                        <div className="absolute inset-0 w-full animate-[shimmer_2s_infinite] bg-white/15" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </section>

          <section className="grid grid-cols-2 gap-5">
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
                            <div
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${t.urgency === 'high' || t.urgency === 'critical' ? 'bg-amber-500' : 'bg-slate-300'}`}
                            />
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
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-white rounded border border-slate-200/60 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded text-emerald-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-[20px] font-bold text-slate-900">Recent Payments</h2>
                </div>
                <Link href="/renovation/budget" className="text-[14px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors active:scale-95">
                  View Budget
                </Link>
              </div>

              {recentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-[15px] font-medium text-slate-500">No payments logged yet</p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {recentPayments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between p-3 rounded hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 text-[14px] font-bold uppercase">
                          {(p.vendor_key || 'X')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-[15px] truncate" dir="auto">
                            {p.vendor_key || 'General'}
                          </p>
                          {p.note && (
                            <p className="text-[12px] text-slate-500 font-medium truncate mt-0.5" dir="auto">{p.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-slate-900 tabular-nums text-[15px]">{formatIls(Number(p.amount))}</span>
                        <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                          {new Date(p.created_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="bg-white rounded border border-slate-200/60 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 rounded text-sky-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-[20px] font-bold text-slate-900">Upcoming events</h2>
              </div>
              <Link
                href="/renovation/calendar"
                className="text-[14px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-4 py-2 rounded-full transition-colors active:scale-95"
              >
                Calendar
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-[15px] font-medium text-slate-500">Nothing on the calendar ahead</p>
                <Link
                  href="/renovation/calendar"
                  className="mt-3 text-[14px] font-bold text-indigo-600 hover:underline"
                >
                  Open calendar
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href="/renovation/calendar"
                      className="group flex items-center justify-between gap-4 rounded-lg border border-transparent p-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-50"
                      dir="auto"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                            ev.event_type === 'provider_meeting' ? 'bg-[#9333ea]' : 'bg-[#1a73e8]'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-slate-800 group-hover:text-indigo-700">
                            {ev.title}
                          </p>
                          {ev.address?.trim() ? (
                            <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">{ev.address}</p>
                          ) : null}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md border border-slate-200/80 bg-white px-2.5 py-1 text-[12px] font-semibold tabular-nums text-slate-600 group-hover:border-slate-300">
                        {formatUpcomingEventWhen(ev)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

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
                <Link href="/renovation/gallery" className="mt-3 text-indigo-600 text-sm font-bold hover:underline">
                  Upload your first photo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-3">
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
    </div>
  )
}
