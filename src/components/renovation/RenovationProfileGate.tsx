'use client'

import type { RenovationTeamMember } from '@/types/renovation'
import { memberAvatarTileStyle, memberInitials } from '@/lib/member-avatar'

export function RenovationProfileGate({
  members,
  onSelect,
}: {
  members: RenovationTeamMember[]
  onSelect: (m: RenovationTeamMember) => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2rem] bg-white shadow-2xl border border-slate-200/80 overflow-hidden animate-fade-in-up">
        <div className="px-8 pt-10 pb-6 text-center bg-gradient-to-b from-indigo-50/80 to-white">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Who’s here?</h2>
          <p className="text-[14px] text-slate-500 mt-2 leading-relaxed">
            Choose your profile so we can greet you and keep things personal. This matches your{' '}
            <span className="font-semibold text-slate-700">team / assignee</span> list.
          </p>
        </div>
        <ul className="px-4 pb-8 max-h-[min(52vh,420px)] overflow-y-auto space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-indigo-50/80 hover:border-indigo-200 active:scale-[0.99] transition-all text-left group"
              >
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl text-[14px] font-extrabold shrink-0 shadow-inner"
                  style={memberAvatarTileStyle(m.name)}
                >
                  <span className="leading-none">{memberInitials(m.name)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-bold text-slate-900 truncate" dir="auto">
                    {m.name}
                  </p>
                  {(m.phone || m.email) && (
                    <p className="text-[12px] text-slate-400 truncate mt-0.5">
                      {[m.phone, m.email].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <svg
                  className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <p className="px-8 pb-6 text-center text-[12px] text-slate-400 leading-relaxed">
          Manage this list under <span className="font-semibold text-slate-500">Settings → Team</span>.
        </p>
      </div>
    </div>
  )
}
