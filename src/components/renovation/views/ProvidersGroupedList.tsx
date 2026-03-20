'use client'

import type { RenovationProvider } from '@/types/renovation'
import { avatarTextColor, avatarTint, initials } from '@/components/renovation/providers-shared'

export function ProvidersGroupedList({
  grouped,
  onSelect,
}: {
  grouped: [string, RenovationProvider[]][]
  onSelect: (p: RenovationProvider) => void
}) {
  return (
    <div className="space-y-6 pt-1">
      {grouped.map(([letter, rows]) => (
        <section key={letter}>
          <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 mb-2">
            <span className="text-[13px] font-extrabold text-indigo-600 tabular-nums">{letter}</span>
          </div>
          <ul className="space-y-2">
            {rows.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className="w-full text-left flex items-stretch gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:border-indigo-200 hover:shadow-[0_8px_24px_-8px_rgba(79,70,229,0.15)] active:scale-[0.99] transition-all group min-h-[72px]"
                >
                  <div
                    className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-[15px] font-extrabold tracking-tight shadow-inner"
                    style={{ backgroundColor: avatarTint(p.name), color: avatarTextColor(p.name) }}
                  >
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-[16px] font-bold text-slate-900 truncate" dir="auto">
                      {p.name}
                    </p>
                    {p.description && (
                      <p className="text-[13px] text-slate-500 line-clamp-2 mt-0.5" dir="auto">
                        {p.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[12px] font-semibold">
                      {p.phone && (
                        <a
                          href={`tel:${p.phone.replace(/\s/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-500 tabular-nums inline-flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {p.phone}
                        </a>
                      )}
                      {p.email && (
                        <a
                          href={`mailto:${p.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-500 truncate max-w-[200px]"
                        >
                          {p.email}
                        </a>
                      )}
                    </div>
                    {p.additional_info && (
                      <p className="text-[11px] text-slate-400 mt-1.5 font-medium line-clamp-1" dir="auto">
                        {p.additional_info}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 self-center text-slate-300 group-hover:text-indigo-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
