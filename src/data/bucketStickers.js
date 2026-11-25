import { supabase } from '../lib/supabase'

const TABLE = 'bucket_stickers'
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
const fromRow = row => ({ id: row.id, kind: row.kind, page: row.page, x: clamp(row.x, 0, 100), y: clamp(row.y, 0, 100), rotation: clamp(row.rotation, -180, 180), scale: clamp(row.scale ?? 1, 0.5, 2.5) || 1, author: row.author })
const toRow = patch => {
  const row = {}
  for (const key of ['kind', 'page', 'author']) if (key in patch) row[key] = patch[key]
  if ('x' in patch) row.x = clamp(patch.x, 0, 100)
  if ('y' in patch) row.y = clamp(patch.y, 0, 100)
  if ('rotation' in patch) row.rotation = clamp(patch.rotation, -180, 180)
  if ('scale' in patch) row.scale = clamp(patch.scale, 0.5, 2.5)
  return row
}
const client = () => { if (!supabase) throw new Error('Supabase não configurado.'); return supabase }

export { pageKey } from './stickerKinds'

export async function listStickers() {
  const { data, error } = await client().from(TABLE).select('*').order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(fromRow)
}
export async function addSticker(sticker) {
  const { data, error } = await client().from(TABLE).insert(toRow(sticker)).select().single()
  if (error) throw error
  return fromRow(data)
}
export async function updateSticker(id, patch) {
  const { data, error } = await client().from(TABLE).update(toRow(patch)).eq('id', id).select().single()
  if (error) throw error
  return fromRow(data)
}
export async function removeSticker(id) {
  const { error } = await client().from(TABLE).delete().eq('id', id)
  if (error) throw error
}
