'use client'

/** Right-aligned title + optional address (Hebrew-friendly). */
export function CalendarEventTitleAddress({
  title,
  address,
  className = '',
  titleClassName = 'font-bold leading-snug',
  addressClassName = 'truncate font-normal leading-snug opacity-90',
}: {
  title: string
  address: string | null | undefined
  className?: string
  titleClassName?: string
  addressClassName?: string
}) {
  const a = address?.trim()
  return (
    <span className={`flex w-full min-w-0 flex-col items-stretch text-right ${className}`} dir="auto">
      <span className={titleClassName}>{title}</span>
      {a ? <span className={addressClassName}>{a}</span> : null}
    </span>
  )
}
