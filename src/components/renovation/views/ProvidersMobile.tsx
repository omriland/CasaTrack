'use client'

import Link from 'next/link'
import { ProviderFormModal } from '@/components/renovation/ProviderFormModal'
import { MobileStickyFooter } from '@/components/renovation/mobile/MobileStickyFooter'
import { ProvidersGroupedList } from './ProvidersGroupedList'
import { useProvidersPageState } from './useProvidersPageState'

export function ProvidersMobile() {
  const { project, items, loading, search, setSearch, modalOpen, editing, grouped, load, openNew, openEdit, closeModal } =
    useProvidersPageState()

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <Link href="/renovation" className="text-indigo-600 font-medium">
          Create a project first
        </Link>
      </p>
    )
  }

  const hasRows = grouped.some(([, r]) => r.length > 0)

  return (
    <div className="space-y-4 pb-28 animate-fade-in-up">
      <header>
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[#0f172a]">Providers</h1>
        <p className="mt-1 text-[14px] text-[#5f6368]">Service providers and contractors</p>
      </header>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa0a6]">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email, notes..."
          className="min-h-[52px] w-full rounded-lg border border-[#e8eaed] bg-white pl-11 pr-4 text-[16px] font-medium text-[#202124] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-[#9aa0a6] focus:border-[#dadce0] focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="font-bold text-slate-700">No providers yet</p>
          <p className="text-[14px] text-slate-500 mt-1">Add your go-to trades.</p>
          <button
            type="button"
            onClick={openNew}
            className="mt-5 min-h-[48px] rounded-lg bg-[#0f172a] px-6 text-[15px] font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4)]"
          >
            + Add provider
          </button>
        </div>
      ) : !hasRows ? (
        <p className="text-center text-slate-500 py-10 text-[15px]">No matches.</p>
      ) : (
        <ProvidersGroupedList grouped={grouped} onSelect={openEdit} />
      )}

      <MobileStickyFooter>
        <button
          type="button"
          onClick={openNew}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-[16px] font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.4)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add provider
        </button>
      </MobileStickyFooter>

      <ProviderFormModal open={modalOpen} initial={editing} onClose={closeModal} onSaved={load} />
    </div>
  )
}
