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
    <div className="pt-0">
      {grouped.map(([letter, rows]) => (
        <section key={letter} className="border-b border-[#e8eaed] last:border-b-0">
          <div className="py-2.5 text-right" dir="ltr">
            <span className="text-[12px] font-semibold text-[#9aa0a6] tabular-nums" dir="auto">
              {letter}
            </span>
          </div>
          <ul className="border-t border-[#e8eaed]">
            {rows.map((p) => (
              <li key={p.id} className="border-b border-[#e8eaed] last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className="group flex w-full items-center gap-3.5 py-3.5 transition-colors hover:bg-[#f8f9fa] active:bg-[#f1f3f4]"
                >
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-[14px] font-bold tracking-tight"
                    style={{ backgroundColor: avatarTint(p.name), color: avatarTextColor(p.name) }}
                  >
                    {initials(p.name)}
                  </div>
                  <div className="min-w-0 flex-1 text-right" dir="ltr">
                    <p className="text-[15px] font-bold leading-tight text-[#202124]" dir="auto">
                      {p.name}
                    </p>
                    {p.description && (
                      <p
                        className="mt-0.5 line-clamp-2 text-[13px] font-normal leading-snug text-[#5f6368]"
                        dir="auto"
                      >
                        {p.description}
                      </p>
                    )}
                    {(p.phone || p.email) && (
                      <p className="mt-1.5 text-[12px] font-medium text-[#80868b]" dir="auto">
                        {p.phone && <span className="tabular-nums">{p.phone}</span>}
                        {p.phone && p.email && <span className="mx-1.5 text-[#dadce0]">·</span>}
                        {p.email && <span className="break-all">{p.email}</span>}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 self-center text-[#dadce0] transition-colors group-hover:text-[#9aa0a6]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
