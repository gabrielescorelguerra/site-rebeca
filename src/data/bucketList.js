import { supabase } from '../lib/supabase'
import { MAX_PHOTOS } from './bucketIdeas'
import { validLink } from '../utils/url'

const TABLE = 'bucket_items'

const fromRow = row => ({
  id: row.id, title: row.title, note: row.note || '', category: row.category, level: Number(row.level) || 1, author: row.author,
  done: Boolean(row.done), doneAt: row.done_at, memory: row.memory || '', createdAt: row.created_at,
  photos: (Array.isArray(row.photos) ? row.photos : []).filter(validLink).slice(0, MAX_PHOTOS),
})
const toRow = patch => {
  const map = { title: 'title', note: 'note', category: 'category', level: 'level', done: 'done', doneAt: 'done_at', memory: 'memory', photos: 'photos', author: 'author' }
  return Object.fromEntries(Object.entries(patch).filter(([key]) => map[key]).map(([key, value]) => [map[key], value]))
}
const client = () => { if (!supabase) throw new Error('Supabase não configurado.'); return supabase }

export async function listItems() {
  const { data, error } = await client().from(TABLE).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromRow)
}
export async function addItem(item) {
  const { data, error } = await client().from(TABLE).insert(toRow(item)).select().single()
  if (error) throw error
  return fromRow(data)
}
export async function updateItem(id, patch) {
  const { data, error } = await client().from(TABLE).update(toRow(patch)).eq('id', id).select().single()
  if (error) throw error
  return fromRow(data)
}
export async function removeItem(id) {
  const { error } = await client().from(TABLE).delete().eq('id', id)
  if (error) throw error
}
