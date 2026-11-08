import { supabase } from '../lib/supabase'

export function validLink(url) {
  try { return ['http:', 'https:'].includes(new URL(url).protocol) } catch { return false }
}

export async function loadLinks() {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('planning_config').select('config').eq('id', 'relationship-links').maybeSingle()
  if (error) throw error
  return Array.isArray(data?.config?.links) ? data.config.links : []
}

export async function saveLinks(links) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.from('planning_config').upsert({ id: 'relationship-links', config: { links } }, { onConflict: 'id' })
  if (error) throw error
}
