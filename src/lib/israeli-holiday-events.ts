import type { EventInput } from '@fullcalendar/core'
import { Event, flags, HebrewCalendar } from '@hebcal/core'
import { addDays, addMonths, endOfMonth, format, startOfMonth } from 'date-fns'

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

/** Keep calendar rows that are observed in Israel and look like holidays (not parsha/omer/etc.). */
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
  return s.replace(/[^\w\u0590-\u05FF]+/g, '-').slice(0, 48)
}

/**
 * All-day Israeli holiday events (@hebcal/core, il=true). Shown only in the all-day strip in week view;
 * the timed grid stays clear.
 */
export function buildIsraelHolidayEventInputs(rangeCenter: Date): EventInput[] {
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
    const day = format(gd, 'yyyy-MM-dd')
    const title = ev.render('en')
    out.push({
      id: `il-holiday-${day}-${slug(ev.getDesc())}`,
      title,
      allDay: true,
      start: day,
      end: format(addDays(gd, 1), 'yyyy-MM-dd'),
      classNames: ['reno-cal-event', 'reno-cal-il-holiday'],
      editable: false,
      startEditable: false,
      durationEditable: false,
      extendedProps: { kind: 'holiday' as const },
    })
  }
  return out
}
