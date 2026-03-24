'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { MobileStickyFooter } from '@/components/renovation/mobile/MobileStickyFooter'
import type { RenovationNeed, RenovationRoom } from '@/types/renovation'
import { NeedDoneToggle } from './needs-shared'
import { useNeedsPageState } from './useNeedsPageState'

type RoomPickTarget = { kind: 'new' } | { kind: 'edit'; need: RenovationNeed }

export function NeedsMobile() {
  const {
    project,
    items,
    rooms,
    loading,
    newTitle,
    setNewTitle,
    newRoomId,
    setNewRoomId,
    adding,
    addItem,
    saveTitle,
    saveRoom,
    remove,
    toggleCompleted,
  } = useNeedsPageState()

  const [roomPick, setRoomPick] = useState<RoomPickTarget | null>(null)

  const closeRoomPick = () => setRoomPick(null)

  const applyRoomChoice = (roomId: string) => {
    if (!roomPick) return
    if (roomPick.kind === 'new') {
      setNewRoomId(roomId)
    } else {
      void saveRoom(roomPick.need, roomId)
    }
    closeRoomPick()
  }

  const roomLabel = (room: RenovationRoom | null | undefined, emptyLabel: string) =>
    room?.name?.trim() ? room.name : emptyLabel

  if (!project) {
    return (
      <p className="py-16 text-center text-slate-500">
        <Link href="/renovation" className="font-semibold text-indigo-600">
          Create a project first
        </Link>
      </p>
    )
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden pb-28 animate-fade-in-up">
      <header className="min-w-0 px-0.5" dir="rtl">
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Needs</h1>
        <p className="mt-0.5 text-right text-[14px] font-medium leading-snug text-slate-500">
          רשימת קניות והערות לדירה — אפשר לשייך פריט לחדר.
        </p>
      </header>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] rounded-[6px] border border-[#dfe1e6] bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm"
          dir="rtl"
        >
          <p className="text-[16px] font-bold text-slate-700">אין פריטים עדיין</p>
          <p className="mt-1 text-[14px] text-slate-500">הוסיפו מהרשימה למטה.</p>
        </div>
      ) : (
        <ul className="min-w-0 space-y-2">
          {items.map((need: RenovationNeed) => (
            <li
              key={need.id}
              className={`rounded-[6px] border border-[#dfe1e6] bg-white p-3 shadow-sm transition-colors ${
                need.completed ? 'bg-slate-50/80 opacity-80' : ''
              }`}
            >
              <div className="flex flex-row items-start gap-2" dir="rtl">
                <NeedDoneToggle mobile completed={need.completed} onToggle={() => toggleCompleted(need)} />
                <input
                  dir="auto"
                  defaultValue={need.title}
                  key={`${need.id}-${need.title}-${need.completed}`}
                  onBlur={(e) => saveTitle(need, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  className={`min-h-[44px] min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-1.5 text-right text-[16px] font-semibold leading-snug text-[#172b4d] outline-none ring-0 focus:ring-2 focus:ring-indigo-500/25 ${
                    need.completed ? 'text-slate-400 line-through decoration-slate-300' : ''
                  }`}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-end gap-2" dir="rtl">
                {rooms.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRoomPick({ kind: 'edit', need })}
                    className={`min-h-[40px] max-w-full shrink rounded-full border px-3.5 text-[13px] font-bold transition-colors ${
                      need.room_id
                        ? 'border-[#dfe1e6] bg-[#f4f5f7] text-[#42526e]'
                        : 'border-dashed border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    <span className="truncate" dir="auto">
                      {roomLabel(need.room, 'ללא חדר')}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(need.id)}
                  className="min-h-[40px] shrink-0 rounded-full bg-rose-50 px-3.5 text-[13px] font-bold text-rose-600 active:bg-rose-100"
                >
                  הסר
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MobileStickyFooter>
        <form
          onSubmit={addItem}
          className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
          dir="rtl"
        >
          <input
            dir="auto"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="פריט חדש…"
            className="box-border min-h-[48px] w-full min-w-0 rounded-xl border border-slate-200 px-3.5 text-right text-[16px] font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          {rooms.length > 0 && (
            <button
              type="button"
              onClick={() => setRoomPick({ kind: 'new' })}
              className={`box-border flex min-h-[48px] w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-right text-[15px] font-semibold transition-colors ${
                newRoomId
                  ? 'border-slate-200 bg-slate-50 text-slate-800'
                  : 'border-dashed border-slate-300 bg-white text-slate-500'
              }`}
            >
              <span className="truncate" dir="auto">
                {roomLabel(rooms.find((r) => r.id === newRoomId), 'ללא חדר')}
              </span>
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="min-h-[50px] w-full rounded-xl bg-indigo-600 text-[16px] font-bold text-white shadow-md shadow-indigo-600/20 transition-transform active:scale-[0.99] disabled:opacity-50"
          >
            {adding ? 'מוסיפים…' : 'הוספה לרשימה'}
          </button>
        </form>
      </MobileStickyFooter>

      <MobileBottomSheet open={roomPick !== null} onClose={closeRoomPick} title="חדר">
        <div className="space-y-2 px-1 pb-2" dir="rtl">
          <button
            type="button"
            onClick={() => applyRoomChoice('')}
            className={`flex min-h-[48px] w-full items-center rounded-xl border px-4 text-right text-[15px] font-semibold transition-colors ${
              (roomPick?.kind === 'new' && !newRoomId) ||
              (roomPick?.kind === 'edit' && !roomPick.need.room_id)
                ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
            }`}
          >
            ללא חדר
          </button>
          {rooms.map((r) => {
            const selected =
              roomPick?.kind === 'new'
                ? newRoomId === r.id
                : roomPick?.kind === 'edit' && roomPick.need.room_id === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => applyRoomChoice(r.id)}
                className={`flex min-h-[48px] w-full items-center rounded-xl border px-4 text-right text-[15px] font-semibold transition-colors ${
                  selected ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-800 active:bg-slate-50'
                }`}
                dir="auto"
              >
                {r.name}
              </button>
            )
          })}
        </div>
      </MobileBottomSheet>
    </div>
  )
}
