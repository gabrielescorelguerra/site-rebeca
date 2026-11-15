const escapeText = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

// O UID é estável (eventId) para que mudar o horário atualize o evento na agenda
// em vez de duplicá-lo; SEQUENCE sobe a cada publicação.
export function calendarContent(planning, now = new Date()) {
  const start = new Date(planning.date)
  if (!Number.isFinite(start.getTime())) return null
  const end = new Date(start.getTime() + (Number(planning.eventDuration) || 60) * 60000)
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rebeca//Nosso encontro//PT', 'BEGIN:VEVENT', `UID:rebeca-call-${planning.eventId || 'main'}@nosso-encontro`, `SEQUENCE:${Number(planning.revision) || 0}`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${escapeText(planning.title)}`, `DESCRIPTION:${escapeText(planning.subtitle)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
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
