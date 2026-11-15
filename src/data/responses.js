import { supabase } from '../lib/supabase'

export async function loadResponses(callKey) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { data, error } = await supabase.from('call_responses').select('block_id, value, updated_at').eq('call_key', callKey)
  if (error) throw error
  return Object.fromEntries((data || []).map(row => [row.block_id, { value: row.value, updatedAt: row.updated_at }]))
}

export async function saveResponse(callKey, blockId, value) {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.from('call_responses').upsert({ call_key: callKey, block_id: blockId, value, updated_at: new Date().toISOString() }, { onConflict: 'call_key,block_id' })
  if (error) throw error
}

export async function clearResponses(callKey, blockIds) {
  if (!supabase) throw new Error('Supabase não configurado.')
  let query = supabase.from('call_responses').delete().eq('call_key', callKey)
  if (blockIds) query = query.in('block_id', blockIds)
  const { error } = await query
  if (error) throw error
}
