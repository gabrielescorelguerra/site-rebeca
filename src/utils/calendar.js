const escapeText = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function calendarContent(planning) {
  const start = new Date(planning.date)
  if (!Number.isFinite(start.getTime())) return null
  const end = new Date(start.getTime() + (Number(planning.eventDuration) || 60) * 60000)
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rebeca//Nosso encontro//PT', 'BEGIN:VEVENT', `UID:rebeca-call-${start.getTime()}@nosso-encontro`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${escapeText(planning.title)}`, `DESCRIPTION:${escapeText(planning.subtitle)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
}

export function downloadCalendar(planning) {
  const content = calendarContent(planning)
  if (!content) return
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'nosso-encontro.ics'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
