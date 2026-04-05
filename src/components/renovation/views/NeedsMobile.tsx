'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { MobileStickyFooter } from '@/components/renovation/mobile/MobileStickyFooter'
import type { RenovationNeed, RenovationRoom } from '@/types/renovation'
import { NeedDoneToggle, NeedsCopyListButton } from './needs-shared'
import { groupNeedsByRoom } from './needs-page-shared'
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

  const pending = useMemo(() => items.filter((i) => !i.completed), [items])
  const completed = useMemo(() => items.filter((i) => i.completed), [items])
  const pendingGroups = useMemo(() => groupNeedsByRoom(pending, rooms), [pending, rooms])
  const [showCompleted, setShowCompleted] = useState(false)

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
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden pb-28 animate-fade-in">
      <header className="flex min-w-0 flex-row items-start justify-between gap-3" dir="rtl">
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Needs</h1>
          <p className="mt-1 text-right text-[14px] font-medium leading-snug text-slate-500">
            רשימת קניות והערות לדירה
          </p>
        </div>
        <NeedsCopyListButton
          items={items}
          rooms={rooms}
          disabled={loading || items.length === 0}
          label="העתק רשימה"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold text-slate-700 shadow-sm active:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
        />
      </header>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-slate-200/50" />
          ))}
        </div>
      ) : pending.length === 0 && completed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm" dir="rtl">
          <p className="text-[16px] font-bold text-slate-700">אין פריטים עדיין</p>
          <p className="mt-1 text-[14px] text-slate-500">הוסיפו מהרשימה למטה.</p>
        </div>
      ) : (
        <div className="min-w-0 space-y-5">
          {/* Pending items grouped by room */}
          {pendingGroups.map((group) => (
            <section key={group.kind === 'room' ? group.roomId : 'unassigned'} className="min-w-0 space-y-2">
              {rooms.length > 0 && (
                <h2 className="px-0.5 text-[13px] font-extrabold uppercase tracking-widest text-slate-400" dir="auto">
                  {group.kind === 'room' ? group.name : 'ללא חדר'}
                </h2>
              )}
              <ul className="min-w-0 space-y-2">
                {group.needs.map((need: RenovationNeed) => (
                  <NeedRow
                    key={need.id}
                    need={need}
                    rooms={rooms}
                    onToggle={() => toggleCompleted(need)}
                    onSaveTitle={(val) => saveTitle(need, val)}
                    onPickRoom={() => setRoomPick({ kind: 'edit', need })}
                    onRemove={() => remove(need.id)}
                    roomLabel={roomLabel}
                  />
                ))}
              </ul>
            </section>
          ))}

          {/* Completed section */}
          {completed.length > 0 && (
            <section className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 px-0.5 min-h-[44px] text-[14px] font-bold text-slate-400 active:text-slate-600"
              >
                <svg className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Completed ({completed.length})
              </button>
              {showCompleted && (
                <ul className="min-w-0 space-y-2">
                  {completed.map((need) => (
                    <NeedRow
                      key={need.id}
                      need={need}
                      rooms={rooms}
                      onToggle={() => toggleCompleted(need)}
                      onSaveTitle={(val) => saveTitle(need, val)}
                      onPickRoom={() => setRoomPick({ kind: 'edit', need })}
                      onRemove={() => remove(need.id)}
                      roomLabel={roomLabel}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      <MobileStickyFooter>
        <form
          onSubmit={addItem}
          className="space-y-2.5 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
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
              className={`box-border flex min-h-[48px] w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-right text-[16px] font-semibold transition-colors ${newRoomId
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
            className="min-h-[52px] w-full rounded-xl bg-indigo-600 text-[16px] font-bold text-white shadow-md shadow-indigo-600/20 transition-transform active:scale-[0.99] disabled:opacity-50"
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
            className={`flex min-h-[48px] w-full items-center rounded-xl border px-4 text-right text-[16px] font-semibold transition-colors ${(roomPick?.kind === 'new' && !newRoomId) ||
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
                className={`flex min-h-[48px] w-full items-center rounded-xl border px-4 text-right text-[16px] font-semibold transition-colors ${selected ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-800 active:bg-slate-50'}`}
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

function NeedRow({
  need,
  rooms,
  onToggle,
  onSaveTitle,
  onPickRoom,
  onRemove,
  roomLabel,
}: {
  need: RenovationNeed
  rooms: RenovationRoom[]
  onToggle: () => void
  onSaveTitle: (val: string) => void
  onPickRoom: () => void
  onRemove: () => void
  roomLabel: (room: RenovationRoom | null | undefined, empty: string) => string
}) {
  return (
    <li className={`rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm transition-colors ${need.completed ? 'bg-slate-50/80 opacity-70' : ''}`}>
      <div className="flex flex-row items-start gap-2" dir="rtl">
        <NeedDoneToggle mobile completed={need.completed} onToggle={onToggle} />
        <input
          dir="auto"
          defaultValue={need.title}
          key={`${need.id}-${need.title}-${need.completed}`}
          onBlur={(e) => onSaveTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          className={`min-h-[44px] min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-1.5 text-right text-[16px] font-semibold leading-snug text-slate-900 outline-none ring-0 focus:ring-2 focus:ring-indigo-500/25 ${need.completed ? 'text-slate-400 line-through decoration-slate-300' : ''}`}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-2" dir="rtl">
        {rooms.length > 0 && (
          <button
            type="button"
            onClick={onPickRoom}
            className={`min-h-[44px] max-w-full shrink rounded-full border px-4 text-[14px] font-bold transition-colors ${need.room_id
              ? 'border-slate-200 bg-slate-50 text-slate-700'
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
          onClick={onRemove}
          className="min-h-[44px] shrink-0 rounded-full bg-rose-50 px-4 text-[14px] font-bold text-rose-600 active:bg-rose-100"
        >
          הסר
        </button>
      </div>
    </li>
  )
}
