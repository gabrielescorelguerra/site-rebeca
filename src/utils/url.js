export function validLink(url) {
  try { return ['http:', 'https:'].includes(new URL(url).protocol) } catch { return false }
}
