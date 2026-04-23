'use client'

import Link from 'next/link'
import { ProviderFormModal } from '@/components/renovation/ProviderFormModal'
import { ProvidersGroupedList } from './ProvidersGroupedList'
import { useProvidersPageState } from './useProvidersPageState'

export function ProvidersDesktop() {
  const { project, items, loading, search, setSearch, modalOpen, editing, grouped, load, openNew, openEdit, closeModal } =
    useProvidersPageState()

  if (!project) {
    return (
      <p className="py-16 text-center text-slate-500">
        <Link href="/renovation" className="font-medium text-indigo-600">
          Create a project first
        </Link>
      </p>
    )
  }

  return (
    <div className="relative min-h-[min(100vh,860px)] w-full max-w-[960px] animate-fade-in-up">
      <header className="flex flex-row items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#0f172a]">Providers</h1>
          <p className="mt-1 text-[15px] leading-snug text-[#5f6368]">Service providers and contractors</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="h-9 shrink-0 rounded-lg bg-[#0f172a] px-4 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.45),0_1px_2px_rgba(0,0,0,0.06)] transition-[transform,box-shadow] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.55),0_2px_8px_rgba(0,0,0,0.08)] active:scale-[0.99]"
        >
          + Add provider
        </button>
      </header>

      <div className="relative mt-6">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa0a6]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email, notes..."
          className="h-12 w-full rounded-lg border border-[#e8eaed] bg-white pl-11 pr-3.5 text-[15px] font-medium text-[#202124] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-shadow placeholder:text-[#9aa0a6] focus:border-[#dadce0] focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="mt-6 min-h-[200px]">
        {loading ? (
          <div className="space-y-0 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 border-b border-[#f1f3f4] py-2">
                <div className="h-3 w-32 rounded bg-[#e8eaed] animate-pulse" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dadce0] bg-white px-8 py-14 text-center">
            <p className="text-[16px] font-bold text-[#3c4043]">No providers yet</p>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f6368]">
              Add plumbers, electricians, and others — then attach them to tasks.
            </p>
            <button
              type="button"
              onClick={openNew}
              className="mt-7 h-9 rounded-lg bg-[#0f172a] px-5 text-[13px] font-semibold text-white"
            >
              + Add your first provider
            </button>
          </div>
        ) : grouped.length === 0 || grouped.every(([, r]) => r.length === 0) ? (
          <p className="py-12 text-center text-[15px] text-[#5f6368]">No matches for &ldquo;{search.trim()}&rdquo;.</p>
        ) : (
          <ProvidersGroupedList grouped={grouped} onSelect={openEdit} />
        )}
      </div>

      <footer className="mt-8 flex flex-col items-center gap-3 border-t border-[#e8eaed] pt-4">
        <p className="w-full text-left text-[12px] font-medium text-[#9aa0a6]">
          {items.length} {items.length === 1 ? 'provider' : 'providers'}
        </p>
        <div className="h-1 w-9 rounded-full bg-[#dadce0]" aria-hidden />
      </footer>

      <ProviderFormModal open={modalOpen} initial={editing} onClose={closeModal} onSaved={load} />
    </div>
  )
}
