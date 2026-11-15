import { supabase } from '../lib/supabase'
import { validLink } from '../utils/url'

export { validLink }

const ROW_ID = 'relationship-links'

export async function loadLinks() {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('planning_config').select('config, updated_at').eq('id', ROW_ID).maybeSingle()
  if (error) throw error
  return { links: Array.isArray(data?.config?.links) ? data.config.links : [], updatedAt: data?.updated_at ?? null }
}

// Salva com verificação de versão: se outra pessoa/aba salvou antes, lança CONFLICT.
export async function saveLinks(links, { expectedUpdatedAt = null, force = false } = {}) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const updatedAt = new Date().toISOString()
  if (force || !expectedUpdatedAt) {
    const { error } = await supabase.from('planning_config').upsert({ id: ROW_ID, config: { links }, updated_at: updatedAt }, { onConflict: 'id' })
    if (error) throw error
    return updatedAt
  }
  const { data, error } = await supabase.from('planning_config').update({ config: { links }, updated_at: updatedAt }).eq('id', ROW_ID).eq('updated_at', expectedUpdatedAt).select('updated_at')
  if (error) throw error
  if (!data?.length) { const conflict = new Error('Os links foram alterados em outro lugar.'); conflict.code = 'CONFLICT'; throw conflict }
  return updatedAt
}
