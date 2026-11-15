// A call é considerada encerrada 2 h depois do fim reservado.
export function callHasEnded(planning, now = Date.now()) {
  const start = new Date(planning.date).getTime()
  if (!Number.isFinite(start)) return false
  return now > start + ((Number(planning.eventDuration) || 60) + 120) * 60000
}
