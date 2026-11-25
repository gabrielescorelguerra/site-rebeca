// Lógica pura dos cursores compartilhados (sem React nem Supabase), para poder testar.
export const PALETTE = ['#bd7184', '#3f8c87', '#8b7bb8', '#c4952b', '#c46f4e', '#4f7fc4', '#6e9b57', '#31292d']
export const STORAGE_KEY = 'rebeca-presence-profile'
export const MOVE_INTERVAL = 120
export const HELLO_INTERVAL = 3000
export const PEER_TTL = 9000
export const MOUSE_IDLE = 25000
export const TOUCH_IDLE = 3500

export const defaultProfile = role => (role === 'admin' ? { name: 'Amor', color: '#3f8c87' } : { name: 'Rebeca', color: '#bd7184' })
export const cleanName = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 18)
export const validColor = value => /^#[0-9a-f]{6}$/i.test(String(value))

export function readProfile(role, storage) {
  const base = defaultProfile(role)
  try {
    const saved = JSON.parse(storage.getItem(`${STORAGE_KEY}:${role}`))
    return { name: cleanName(saved?.name) || base.name, color: validColor(saved?.color) ? saved.color : base.color }
  } catch { return base }
}
export function saveProfile(role, profile, storage) {
  try { storage.setItem(`${STORAGE_KEY}:${role}`, JSON.stringify({ name: cleanName(profile.name), color: profile.color })) } catch { /* sem armazenamento: vale só nesta sessão */ }
}

// Cor do texto sobre a cor do cursor.
export function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16)
  const lin = c => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const lum = 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255)
  return lum > 0.4 ? '#31292d' : '#ffffff'
}

// x vai como fração da largura (telas diferentes), y como posição na página.
export const toWire = (clientX, clientY, scrollY, width) => ({ x: Math.round(Math.min(1, Math.max(0, clientX / Math.max(1, width))) * 10000) / 10000, y: Math.round(clientY + scrollY) })
export const fromWire = (wire, width, scrollY) => ({ left: wire.x * width, top: wire.y - scrollY })

export const isFresh = (peer, now) => now - peer.seen <= PEER_TTL
export function isCursorVisible(peer, now, path) {
  if (peer.path !== path || peer.x === undefined || !isFresh(peer, now)) return false
  return now - peer.moved <= (peer.kind === 'touch' ? TOUCH_IDLE : MOUSE_IDLE)
}
export function prune(peers, now) {
  const keep = Object.entries(peers).filter(([, peer]) => isFresh(peer, now))
  return keep.length === Object.keys(peers).length ? peers : Object.fromEntries(keep)
}
