// Lógica pura da lista de desejos (sem Supabase), para poder testar.
// As chaves das categorias vêm do banco; só os rótulos mudam.
export const CATEGORIES = [
  { key: 'sonho', label: 'Sonhos' },
  { key: 'bobagem', label: 'Bobagens' },
  { key: 'comida', label: 'Mesa' },
  { key: 'lugar', label: 'Estrada' },
  { key: 'romantico', label: 'A dois' },
  { key: 'jogo', label: 'Desafios' },
]
export const LEVELS = [
  { value: 1, label: 'Tranquilo' }, { value: 2, label: 'Leve' }, { value: 3, label: 'Animado' }, { value: 4, label: 'Ousado' }, { value: 5, label: 'Insano' },
]
export const MAX_PHOTOS = 4
export const categoryOf = key => CATEGORIES.find(item => item.key === key) || CATEGORIES[1]

export const IDEAS = [
  ['Ter um jardim só nosso, nem que seja de vaso', 'sonho', 3], ['Morar um tempo em outra cidade', 'sonho', 5], ['Aprender um idioma juntas só para viajar', 'sonho', 4],
  ['Fazer uma viagem de trem longa, sem pressa', 'sonho', 3], ['Ter um cachorro e discutir o nome por semanas', 'sonho', 4], ['Montar uma parede da casa só com fotos nossas', 'sonho', 2],
  ['Dublar uma cena de filme e gravar', 'bobagem', 3], ['Dar nome a todas as plantas da casa', 'bobagem', 1], ['Passar uma tarde falando com um sotaque inventado', 'bobagem', 3],
  ['Fazer uma sessão de fotos com roupas de brechó', 'bobagem', 3], ['Montar uma cabana de lençóis e jantar dentro', 'bobagem', 2], ['Desenhar a outra do pior jeito possível e emoldurar', 'bobagem', 1],
  ['Jantar às cegas: uma escolhe, a outra descobre', 'comida', 2], ['Pedir o prato mais estranho do cardápio, dividir e dar nota', 'comida', 3], ['Fazer um bolo sem receita e ver no que dá', 'comida', 2],
  ['Cozinhar um prato de outro país com a playlist dele', 'comida', 2], ['Comer sobremesa antes do jantar, com orgulho', 'comida', 1], ['Provar cinco sabores de pizza e votar no melhor', 'comida', 1],
  ['Pegar um ônibus sem saber para onde ele vai', 'lugar', 4], ['Ver o nascer do sol de algum lugar alto', 'lugar', 3], ['Conhecer o mar juntas', 'lugar', 3],
  ['Dormir numa cidade pequena que ninguém indicou', 'lugar', 4], ['Fazer um piquenique de madrugada na sala', 'lugar', 2], ['Tomar café da manhã em outra cidade', 'lugar', 4],
  ['Escrever uma carta para a gente abrir em 2028', 'romantico', 2], ['Montar a playlist da nossa história, faixa por faixa', 'romantico', 1], ['Voltar ao lugar do nosso primeiro encontro', 'romantico', 2],
  ['Imprimir um álbum de fotos da gente', 'romantico', 1], ['Aprender a tocar uma música nossa', 'romantico', 4], ['Passar um sábado inteiro sem celular', 'romantico', 3],
  ['Maratonar uma saga inteira de filmes num fim de semana', 'jogo', 2], ['Jogar um jogo de tabuleiro valendo prenda', 'jogo', 2], ['Montar um quebra-cabeça de mil peças', 'jogo', 2],
  ['Aprender uma coreografia inteira', 'jogo', 4], ['Um dia em que cada uma escolhe tudo pela outra', 'jogo', 4], ['Escolher um filme pela capa e ver até o fim, mesmo se for péssimo', 'jogo', 2],
].map(([text, category, level], index) => ({ id: index, text, category, level }))

export function pickIdea(items, previousId = null, random = Math.random) {
  const taken = new Set(items.map(item => item.title.trim().toLowerCase()))
  const pool = IDEAS.filter(idea => !taken.has(idea.text.toLowerCase()) && idea.id !== previousId)
  return pool.length ? pool[Math.floor(random() * pool.length)] : null
}

export function roulettePool(items, { maxLevel = 5, category = '' } = {}) {
  return items.filter(item => !item.done && item.level <= maxLevel && (!category || item.category === category))
}

export function counts(items) {
  const byCategory = Object.fromEntries(CATEGORIES.map(category => [category.key, 0]))
  for (const item of items) if (item.category in byCategory) byCategory[item.category] += 1
  const done = items.filter(item => item.done).length
  return { total: items.length, done, todo: items.length - done, byCategory }
}

// Datas do formulário: "2026-11-14" <-> ISO ao meio-dia local, para não mudar de dia por fuso horário.
export function toDateInput(iso) {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export function fromDateInput(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).toISOString() : null
}
