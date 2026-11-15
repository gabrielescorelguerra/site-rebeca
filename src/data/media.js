import { supabase } from '../lib/supabase'

const BUCKET = 'call-media'
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
export const MAX_IMAGE_MB = 5

// Envia a imagem para o Supabase Storage e devolve a URL pública (em vez de embutir base64 no JSON).
export async function uploadImage(file) {
  if (!supabase) throw new Error('Supabase não configurado.')
  if (!TYPES[file.type]) throw new Error('Escolha uma imagem JPG, PNG, WebP ou GIF.')
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`A imagem deve ter até ${MAX_IMAGE_MB} MB.`)
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${TYPES[file.type]}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false })
  if (error) throw new Error('Não foi possível enviar a imagem. Confira se o bucket "call-media" foi criado (veja supabase-schema.sql).')
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
