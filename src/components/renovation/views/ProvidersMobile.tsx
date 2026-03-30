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
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full min-h-[52px] pl-12 pr-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm text-[16px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
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
          <button type="button" onClick={openNew} className="mt-5 min-h-[48px] px-6 rounded-xl bg-indigo-600 text-white text-[15px] font-bold">
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
          className="w-full min-h-[52px] rounded-2xl bg-indigo-600 text-white text-[16px] font-bold shadow-lg flex items-center justify-center gap-2"
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
