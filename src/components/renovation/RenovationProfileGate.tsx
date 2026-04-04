'use client'

import { MemberAvatarTile } from '@/components/renovation/MemberAvatar'
import type { RenovationTeamMember } from '@/types/renovation'

export function RenovationProfileGate({
  members,
  onSelect,
}: {
  members: RenovationTeamMember[]
  onSelect: (m: RenovationTeamMember) => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="w-full max-w-sm md:max-w-3xl rounded-[2rem] bg-white shadow-2xl border border-slate-200/80 overflow-hidden animate-fade-in-up">
        <div className="px-8 pt-10 pb-2 text-center bg-gradient-to-b from-indigo-50/80 to-white">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
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
        </div>
        <ul className="grid grid-cols-1 gap-3 px-4 pb-8 pt-6 md:grid-cols-2 md:gap-4 max-h-[min(60vh,520px)] overflow-y-auto">
          {members.map((m) => (
            <li key={m.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="flex h-full w-full min-w-0 flex-col items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 py-6 px-3 hover:bg-indigo-50/80 hover:border-indigo-200 active:scale-[0.99] transition-all group md:gap-2 md:py-3 md:px-2"
              >
                <MemberAvatarTile
                  name={m.name}
                  className="h-28 w-28 shrink-0 rounded-2xl text-[20px] font-extrabold shadow-md ring-1 ring-black/[0.04] md:h-36 md:w-36 md:text-[22px]"
                />
                <p
                  className="w-full max-w-full truncate text-center text-[17px] font-bold leading-tight text-slate-900 px-1"
                  dir="auto"
                  title={m.name}
                >
                  {m.name}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
