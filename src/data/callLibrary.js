import { supabase } from '../lib/supabase'
import { newId, normalizePlanning } from './blocks'

// Cards de call guardados para ativar depois. Ficam no registro "call-library" de planning_config;
// a call publicada continua no registro "main".
export const LIBRARY_ROW_ID = 'call-library'

const clean = value => (typeof value === 'string' ? value.trim().slice(0, 80) : '')

// Um card guarda a call sem identidade de agenda: ao ativar, ganha um eventId novo (agenda e respostas separadas).
export function toCard(planning, name, existing = {}) {
  const { eventId, revision, ...rest } = structuredClone(planning)
  void eventId; void revision
  return { id: existing.id || newId(), name: clean(name) || clean(planning.title) || 'Call sem nome', savedAt: new Date().toISOString(), planning: rest }
}

export function fromCard(card) {
  return normalizePlanning({ ...card.planning, eventId: newId(), revision: 0 })
}

const readCards = config => (Array.isArray(config?.cards) ? config.cards.filter(card => card && card.id && card.planning) : [])

export async function loadLibrary() {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('planning_config').select('config, updated_at').eq('id', LIBRARY_ROW_ID).maybeSingle()
  if (error) throw error
  return { cards: readCards(data?.config), updatedAt: data?.updated_at ?? null }
}

async function write(cards, expectedUpdatedAt) {
  const updatedAt = new Date().toISOString()
  if (!expectedUpdatedAt) {
    const { error } = await supabase.from('planning_config').upsert({ id: LIBRARY_ROW_ID, config: { cards }, updated_at: updatedAt }, { onConflict: 'id' })
    if (error) throw error
    return updatedAt
  }
  const { data, error } = await supabase.from('planning_config').update({ config: { cards }, updated_at: updatedAt }).eq('id', LIBRARY_ROW_ID).eq('updated_at', expectedUpdatedAt).select('updated_at')
  if (error) throw error
  if (!data?.length) { const conflict = new Error('A biblioteca mudou em outro lugar.'); conflict.code = 'CONFLICT'; throw conflict }
  return updatedAt
}

// Lê a versão mais recente, aplica a mudança e grava; se outra aba gravou no meio, tenta de novo.
export async function updateLibrary(change) {
  if (!supabase) throw new Error('Supabase não configurado.')
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { cards, updatedAt } = await loadLibrary()
    const next = change(cards)
    try { return { cards: next, updatedAt: await write(next, updatedAt) } } catch (err) { if (err.code !== 'CONFLICT' || attempt === 2) throw err }
  }
  return null
}
