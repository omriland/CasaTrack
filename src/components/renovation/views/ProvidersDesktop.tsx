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
      <p className="text-center text-slate-500 py-16">
        <Link href="/renovation" className="text-indigo-600 font-medium">
          Create a project first
        </Link>
      </p>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8 animate-fade-in-up">
      <header className="space-y-1">
        <div className="flex flex-row items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-slate-900">Providers</h1>
            <p className="text-[15px] text-slate-500 mt-0.5 max-w-md">Service providers and contractors</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="h-11 px-5 rounded-full bg-indigo-600 text-white text-[14px] font-bold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all shrink-0"
          >
            + Add provider
          </button>
        </div>
      </header>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email, notes…"
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[4.5rem] bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <p className="font-bold text-slate-700">No providers yet</p>
          <p className="text-[14px] text-slate-500 mt-1">Add plumbers, electricians, and others — then attach them to tasks.</p>
          <button type="button" onClick={openNew} className="mt-6 text-indigo-600 font-bold text-[14px] bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full">
            + Add your first provider
          </button>
        </div>
      ) : grouped.length === 0 || grouped.every(([, r]) => r.length === 0) ? (
        <p className="text-center text-slate-500 py-12 text-[15px]">No matches for “{search.trim()}”.</p>
      ) : (
        <ProvidersGroupedList grouped={grouped} onSelect={openEdit} />
      )}

      <ProviderFormModal open={modalOpen} initial={editing} onClose={closeModal} onSaved={load} />
    </div>
  )
}
