'use client'

import {
  memberAvatarChipStyle,
  memberAvatarImageSrc,
  memberAvatarLetter,
  memberAvatarTileStyle,
  memberInitials,
} from '@/lib/member-avatar'
import { cn } from '@/utils/common'

export function MemberAvatarTile({ name, className }: { name: string; className?: string }) {
  const src = memberAvatarImageSrc(name)
  if (src) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* Local static avatars; img keeps bundle simple */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div className={cn('grid place-items-center', className)} style={memberAvatarTileStyle(name)}>
      <span className="leading-none">{memberInitials(name)}</span>
    </div>
  )
}

export function MemberAvatarChip({ name, className }: { name: string; className?: string }) {
  const src = memberAvatarImageSrc(name)
  if (src) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div className={cn('grid place-items-center', className)} style={memberAvatarChipStyle(name)}>
      <span className="leading-none">{memberAvatarLetter(name)}</span>
    </div>
  )
}
