'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronUp, Check } from 'lucide-react'
import { MemberAvatarTile } from '@/components/renovation/MemberAvatar'

export interface ProfileSelectorProfile {
  id: string
  name: string
}

interface ProfileSelectorProps {
  profiles: ProfileSelectorProfile[]
  activeProfileId: string
  onSelect: (id: string) => void
  collapsed?: boolean
}

function Avatar({
  name,
  size = 32,
  radius = 7,
  ring = false,
}: {
  name: string
  size?: number
  radius?: number
  ring?: boolean
}) {
  return (
    <div
      className="shrink-0 border border-black/[0.07] overflow-hidden"
      style={
        {
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${radius}px`,
          outline: ring ? '2px solid oklch(0.13 0 0)' : 'none',
          outlineOffset: ring ? '2px' : '0px',
          transition: 'outline 120ms ease',
        }
      }
    >
      <MemberAvatarTile name={name} className="h-full w-full rounded-[inherit]" />
    </div>
  )
}

export function ProfileSelector({
  profiles,
  activeProfileId,
  onSelect,
  collapsed = false,
}: ProfileSelectorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? profiles[0],
    [activeProfileId, profiles],
  )

  if (!activeProfile) return null

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          className={`absolute z-50 overflow-hidden rounded-[10px] border border-black/[0.08] bg-white ${
            collapsed ? 'left-1/2 w-[220px] -translate-x-1/2' : 'left-0 right-0'
          }`}
          style={{
            bottom: 'calc(100% + 6px)',
            animation: 'profileSelectorIn 200ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <div className="flex items-center justify-between border-b border-black/[0.05] px-[14px] pt-[11px] pb-[9px]">
            <span className="font-[family-name:var(--font-varela-round)] text-[10px] uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">
              Switch profile
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer p-[2px] text-[oklch(0.60_0_0)] transition-colors hover:text-[oklch(0.13_0_0)]"
              aria-label="Close profile selector"
            >
              <ChevronUp size={13} strokeWidth={2} />
            </button>
          </div>

          <div className="py-1">
            {profiles.map((profile, i) => {
              const isActive = profile.id === activeProfileId
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    onSelect(profile.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-[10px] px-[14px] py-[7px] text-left transition-colors ${
                    isActive ? 'bg-[oklch(0.97_0_0)]' : 'bg-transparent hover:bg-[oklch(0.98_0_0)]'
                  }`}
                  style={{
                    animation: `profileItemIn 180ms cubic-bezier(0.16,1,0.3,1) ${i * 30}ms both`,
                  }}
                >
                  <Avatar name={profile.name} size={32} radius={7} ring={isActive} />
                  <span
                    className={`flex-1 font-[family-name:var(--font-varela-round)] text-[13px] tracking-[-0.01em] ${
                      isActive ? 'text-[oklch(0.13_0_0)]' : 'text-[oklch(0.40_0_0)]'
                    }`}
                  >
                    {profile.name}
                  </span>
                  {isActive && <Check size={13} strokeWidth={2.5} className="text-[oklch(0.13_0_0)]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {collapsed ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer"
          aria-label="Switch profile"
        >
          <Avatar name={activeProfile.name} size={28} radius={6} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-[9px] px-[10px] py-2 rounded-[6px] border cursor-pointer text-left transition-[filter,background,border-color] duration-[120ms]"
          style={{
            borderColor: open ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)',
            background: open ? 'oklch(0.94 0 0)' : 'oklch(0.97 0 0)',
          }}
          onMouseEnter={(e) => {
            if (!open) e.currentTarget.style.filter = 'brightness(0.97)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = ''
          }}
        >
          <Avatar name={activeProfile.name} size={28} radius={6} />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate font-[family-name:var(--font-varela-round)] text-[13px] tracking-[-0.01em] text-[oklch(0.13_0_0)]">
              {activeProfile.name}
            </p>
            <p className="m-0 mt-[1px] font-[family-name:var(--font-varela-round)] text-[11px] text-[oklch(0.60_0_0)]">
              Switch profile
            </p>
          </div>
          <div
            className="flex text-[oklch(0.60_0_0)]"
            style={{
              transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <ChevronUp size={12} strokeWidth={2} />
          </div>
        </button>
      )}

      <style>{`
        @keyframes profileSelectorIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes profileItemIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
