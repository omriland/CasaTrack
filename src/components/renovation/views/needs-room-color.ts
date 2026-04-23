import { stringAvatarHue } from '@/lib/avatar-hue'

/** Accent color for a room (matches Needs.html pill / dot styling). */
export function needRoomOklch(roomName: string): string {
  const h = stringAvatarHue(roomName)
  return `oklch(0.55 0.18 ${h})`
}
