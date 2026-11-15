import { supabase } from '../lib/supabase'
import { buildDefaultPlanning, normalizePlanning } from './blocks'

export const PLANNING_KEY = 'rebecca-call-planning'
export const PLANNING_ROW_ID = 'main'
export const AUTHENTICATED_KEY = 'rebecca-authenticated'
export const ADMIN_AUTHENTICATED_KEY = 'rebecca-admin-authenticated'

export const defaultPlanning = buildDefaultPlanning()

export async function loadPlanningRecord() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }
  const { data, error } = await supabase
    .from('planning_config')
    .select('config, updated_at')
    .eq('id', PLANNING_ROW_ID)
    .maybeSingle()
  if (error) {
    console.error('Não foi possível carregar a configuração do Supabase.', error)
    throw error
  }
  return { planning: normalizePlanning(data?.config), updatedAt: data?.updated_at ?? null }
}

export async function loadPlanning() {
  return (await loadPlanningRecord()).planning
}

// Salva verificando a versão carregada: se alguém salvou antes, lança um erro com code CONFLICT.
export async function savePlanning(planning, { expectedUpdatedAt = null, force = false } = {}) {
  if (!supabase) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  const updatedAt = new Date().toISOString()
  if (force || !expectedUpdatedAt) {
    const { error } = await supabase.from('planning_config').upsert({ id: PLANNING_ROW_ID, config: planning, updated_at: updatedAt }, { onConflict: 'id' })
    if (error) { console.error('Não foi possível salvar a configuração no Supabase.', error); throw error }
    return updatedAt
  }
  const { data, error } = await supabase
    .from('planning_config')
    .update({ config: planning, updated_at: updatedAt })
    .eq('id', PLANNING_ROW_ID)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at')
  if (error) { console.error('Não foi possível salvar a configuração no Supabase.', error); throw error }
  if (!data?.length) { const conflict = new Error('A call foi alterada em outro lugar.'); conflict.code = 'CONFLICT'; throw conflict }
  return updatedAt
}
