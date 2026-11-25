import { supabase } from '../lib/supabase'

// Estado compartilhado do Caderno de sonhos (por enquanto, só o marcador de página),
// guardado no registro "caderno-de-sonhos" de planning_config.
const ROW_ID = 'caderno-de-sonhos'
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))
const validPage = page => typeof page === 'string' && /^(algum-dia|ano-[0-9]{4})(-[0-9]{1,3})?$/.test(page)

export const cleanBookmark = value => (value && validPage(value.page) ? { page: value.page, x: clamp(value.x, 0, 100), y: clamp(value.y, 0, 100) } : null)

export async function loadBookmark() {
  if (!supabase) return null
  const { data, error } = await supabase.from('planning_config').select('config').eq('id', ROW_ID).maybeSingle()
  if (error) throw error
  return cleanBookmark(data?.config?.bookmark)
}

export async function saveBookmark(bookmark) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.from('planning_config').upsert({ id: ROW_ID, config: { bookmark: cleanBookmark(bookmark) }, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) throw error
}
