import { addDays, addMonths, endOfMonth, format, startOfMonth } from 'date-fns'
import { type Event, flags, HebrewCalendar } from '@hebcal/core'
import type { EventInput } from '@fullcalendar/core'
import type { FcAppEvent } from '@/components/renovation/renovation-fullcalendar-map'

const NOISE_FLAGS =
  flags.PARSHA_HASHAVUA |
  flags.OMER_COUNT |
  flags.ROSH_CHODESH |
  flags.SPECIAL_SHABBAT |
  flags.SHABBAT_MEVARCHIM |
  flags.MOLAD |
  flags.HEBREW_DATE |
  flags.YOM_KIPPUR_KATAN |
  flags.YIZKOR |
  flags.DAF_YOMI

function hasTimedComponent(ev: Event): boolean {
  return 'eventTime' in ev && Boolean((ev as { eventTime?: unknown }).eventTime)
}

function shouldIncludeHebcalEvent(ev: Event): boolean {
  if (!ev.observedInIsrael()) return false
  const m = ev.getFlags()
  if (m & NOISE_FLAGS) return false
  if (hasTimedComponent(ev)) return false
  const desc = ev.getDesc()
  if (/Chanukah:\s*\d+\s+Candles?/i.test(desc)) return false
  return true
}

function slug(s: string): string {
  return s.replace(/[^\w֐-׿]+/g, '-').slice(0, 48)
}

/** Build read-only Israeli holiday chips for a ±1-month window around `rangeCenter`. */
export function buildIsraelHolidayEvents(rangeCenter: Date): EventInput[] {
  const rangeStart = startOfMonth(addMonths(rangeCenter, -1))
  const rangeEnd = endOfMonth(addMonths(rangeCenter, 1))
  const raw = HebrewCalendar.calendar({
    start: rangeStart,
    end: rangeEnd,
    il: true,
    noRoshChodesh: true,
    noSpecialShabbat: true,
  })
  const out: EventInput[] = []
  for (const ev of raw) {
    if (!shouldIncludeHebcalEvent(ev)) continue
    const gd = ev.greg()
    const start = new Date(gd.getFullYear(), gd.getMonth(), gd.getDate())
    const endExclusive = addDays(start, 1)
    const dayKey = format(start, 'yyyy-MM-dd')
    const title = ev.render('en')
    const id = `il-holiday-${dayKey}-${slug(ev.getDesc())}`
    const app: FcAppEvent = {
      id,
      title,
      start,
      end: endExclusive,
      allDay: true,
      kind: 'holiday',
      isDraggable: false,
      isResizable: false,
      isPast: endExclusive < new Date(),
    }
    out.push({
      id,
      title,
      start: dayKey,
      end: format(endExclusive, 'yyyy-MM-dd'),
      allDay: true,
      editable: false,
      startEditable: false,
      durationEditable: false,
      classNames: ['reno-ev', 'reno-ev-kind--holiday'],
      extendedProps: { kind: 'holiday', app },
    })
  }
  return out
}
