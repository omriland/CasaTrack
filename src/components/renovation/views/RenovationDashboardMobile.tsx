'use client'

import Link from 'next/link'
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
    monthSpend,
    recentExpenses,
    gallery,
    dashLoading,
    cap,
    pct,
    over,
    openTasks,
    overdue,
    upcoming,
    upcomingEvents,
  } = useRenovationDashboardPage()

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
          <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-tight">Start your project</h1>
          <p className="text-[15px] text-slate-500 mt-2 leading-relaxed font-medium px-1">
            Set up your space. You can change details later in Settings.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Project name</label>
            <input
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dream House Rothschild"
              className="w-full min-h-[52px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[17px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Budget (₪)</label>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="w-full min-h-[52px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[17px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
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
                className="w-full min-h-[52px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[17px] font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
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
    <div className="space-y-4 pb-2">
      {/* Shell already shows project name — keep one compact greeting row */}
      <div className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-sm">
        <div className="min-w-0">
          {greetName ? (
            <p className="text-[14px] font-semibold text-slate-800" dir="auto">
              <span className="text-slate-500">{greet.label}, </span>
              <span className="text-indigo-600">{greetName}</span>
            </p>
          ) : (
            <p className="text-[14px] font-semibold text-slate-600">{greet.label}</p>
          )}
        </div>
      </div>

      {dashLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 bg-slate-200/60 rounded-2xl" />
          <div className="h-32 bg-slate-200/60 rounded-2xl" />
        </div>
      ) : (
        <>
          <section className="sticky top-0 z-20 -mx-1">
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-800/50">
              <div className="p-3">
                <div className="flex justify-between items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining</span>
                  <Link
                    href="/renovation/budget"
                    className="min-w-[40px] min-h-[40px] -mr-1 flex shrink-0 items-center justify-center rounded-lg bg-white/10 active:bg-white/20"
                    aria-label="Budget details"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <p className={`text-[26px] font-bold tabular-nums leading-none ${over ? 'text-rose-400' : 'text-white'}`}>
                  {formatIls(cap - spent)}
                </p>
                {over && (
                  <p className="text-[11px] font-bold text-rose-300 mt-0.5">Over by {formatIls(spent - cap)}</p>
                )}
                <div className="mt-2 h-1.5 bg-slate-900/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${over ? 'bg-rose-500' : pct >= 85 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1.5 tabular-nums">
                  <span>{formatIls(spent)} spent</span>
                  <span>{formatIls(cap)} cap</span>
                </div>
              </div>
              <div className="px-3 py-2 bg-white/5 border-t border-white/10 flex justify-between items-center text-[12px]">
                <span className="text-slate-400 font-medium">This month</span>
                <span className="font-bold tabular-nums">{formatIls(monthSpend)}</span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/renovation/tasks"
              className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{openTasks}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">Open tasks</p>
              {overdue > 0 && <p className="text-[11px] font-bold text-rose-600 mt-2">{overdue} overdue</p>}
            </Link>
            <Link
              href="/renovation/expenses"
              className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{recentExpenses.length}</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">Recent items</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-2">View spend →</p>
            </Link>
          </div>

          {upcoming.length > 0 && (
            <section className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[15px] font-bold text-slate-900">Due soon</h2>
                <Link href="/renovation/tasks" className="text-[13px] font-bold text-indigo-600">
                  All tasks
                </Link>
              </div>
              <ul className="space-y-2">
                {upcoming.map((t) => {
                  const dueMeta = formatTaskDue(t.due_date!, { isDone: false })
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
                      <span className="text-[14px] font-semibold text-slate-800 truncate min-w-0" dir="auto">
                        {t.title}
                      </span>
                      <span
                        className={`shrink-0 text-[12px] font-bold tabular-nums px-2 py-1 rounded-lg ${
                          dueMeta.tone === 'overdue'
                            ? 'bg-rose-50 text-rose-700'
                            : dueMeta.tone === 'soon'
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {dueMeta.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[15px] font-bold text-slate-900">Upcoming events</h2>
              <Link href="/renovation/calendar" className="text-[13px] font-bold text-sky-600">
                Calendar
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="py-4 text-center text-[14px] font-medium text-slate-500">Nothing scheduled ahead</p>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href="/renovation/calendar"
                      className="flex items-start justify-between gap-2 border-b border-slate-100 py-2.5 last:border-0 active:bg-slate-50"
                      dir="auto"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <div
                          className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                            ev.event_type === 'provider_meeting' ? 'bg-[#9333ea]' : 'bg-[#1a73e8]'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-slate-800">{ev.title}</p>
                          {ev.address?.trim() ? (
                            <p className="mt-0.5 truncate text-[12px] text-slate-500">{ev.address}</p>
                          ) : null}
                        </div>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-600">
                        {formatUpcomingEventWhen(ev)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[15px] font-bold text-slate-900">Latest photos</h2>
              <Link href="/renovation/gallery" className="text-[13px] font-bold text-pink-600">
                Open gallery
              </Link>
            </div>
            {gallery.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80">
                <p className="text-[14px] text-slate-500 font-medium">No photos yet</p>
                <Link href="/renovation/gallery" className="inline-block mt-3 text-[14px] font-bold text-indigo-600">
                  Add photos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((item) => (
                  <Link key={item.id} href="/renovation/gallery" className="aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/80 active:scale-95 transition-transform">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.public_url} alt="" className="w-full h-full object-cover" />
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
