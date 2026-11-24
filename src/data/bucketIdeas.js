// Lógica pura da lista de desejos (sem Supabase), para poder testar.
export const CATEGORIES = [
  { key: 'sonho', emoji: '🌙', label: 'Sonho grande' },
  { key: 'bobagem', emoji: '🤪', label: 'Bobagem' },
  { key: 'comida', emoji: '🍕', label: 'Comida' },
  { key: 'lugar', emoji: '✈️', label: 'Lugar' },
  { key: 'romantico', emoji: '💌', label: 'Romântico' },
  { key: 'jogo', emoji: '🎮', label: 'Jogo' },
]
export const LEVELS = [
  { value: 1, label: 'Tranquilo' }, { value: 2, label: 'Leve' }, { value: 3, label: 'Animado' }, { value: 4, label: 'Ousado' }, { value: 5, label: 'Insano' },
]
export const MAX_PHOTOS = 4
export const categoryOf = key => CATEGORIES.find(item => item.key === key) || CATEGORIES[1]

export const IDEAS = [
  ['Ver o nascer do sol juntas', 'romantico', 2], ['Comer pizza de cinco sabores diferentes', 'comida', 1], ['Escrever cartas para abrir daqui a um ano', 'romantico', 1],
  ['Fazer uma refeição às cegas, uma escolhe pela outra', 'comida', 2], ['Montar um quebra-cabeça enorme', 'jogo', 1], ['Dançar na chuva', 'bobagem', 3],
  ['Viajar para um lugar que nenhuma das duas conhece', 'lugar', 4], ['Fazer um piquenique de madrugada na sala', 'bobagem', 2], ['Aprender uma música no violão ou ukulele', 'sonho', 3],
  ['Plantar uma tulipa e cuidar até florir', 'romantico', 2], ['Gravar um vídeo dublando uma cena de filme', 'bobagem', 3], ['Passar um dia inteiro sem celular', 'sonho', 3],
  ['Conhecer o mar juntas', 'lugar', 3], ['Fazer um bolo sem receita e ver no que dá', 'comida', 2], ['Ver todos os filmes de uma saga em uma maratona', 'jogo', 2],
  ['Ter um pet nosso', 'sonho', 4], ['Tirar fotos de fotomatic em uma cabine', 'bobagem', 1], ['Fazer um mapa dos lugares que queremos conhecer', 'sonho', 1],
  ['Acampar e olhar as estrelas', 'lugar', 3], ['Jogar um jogo de tabuleiro valendo prenda', 'jogo', 2], ['Comer sobremesa antes do jantar', 'comida', 1],
  ['Fazer uma playlist da nossa história', 'romantico', 1], ['Andar de bicicleta sem destino', 'lugar', 2], ['Se fantasiar e sair assim mesmo', 'bobagem', 4],
  ['Ir a um show juntas', 'lugar', 3], ['Cozinhar um prato de outro país', 'comida', 2], ['Dormir em um lugar diferente a cada mês por um ano', 'sonho', 5],
  ['Fazer cócegas no ponto mais sério possível', 'bobagem', 1], ['Pular de paraquedas ou fazer algo de arrepiar', 'sonho', 5], ['Inventar um idioma só nosso e falar por um dia', 'bobagem', 3],
  ['Fazer um álbum de fotos da gente', 'romantico', 1], ['Ir ao cinema e escolher o filme na sorte', 'jogo', 1], ['Aprender a dançar uma coreografia inteira', 'jogo', 4],
  ['Escrever uma história com a gente de personagens', 'sonho', 2], ['Ter uma casa com um cantinho de plantas', 'sonho', 4], ['Tomar café da manhã em outra cidade', 'lugar', 4],
].map(([text, category, level], index) => ({ id: index, text, category, level }))

export function pickIdea(items, previousId = null, random = Math.random) {
  const taken = new Set(items.map(item => item.title.trim().toLowerCase()))
  const pool = IDEAS.filter(idea => !taken.has(idea.text.toLowerCase()) && idea.id !== previousId)
  return pool.length ? pool[Math.floor(random() * pool.length)] : null
}

export function roulettePool(items, { maxLevel = 5, category = '' } = {}) {
  return items.filter(item => !item.done && item.level <= maxLevel && (!category || item.category === category))
}

export function progress(items) {
  const done = items.filter(item => item.done).length
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 }
}

export function badges(items) {
  const done = items.filter(item => item.done)
  const doneIn = key => done.filter(item => item.category === key).length
  return [
    { key: 'first', emoji: '🌱', label: 'Primeira aventura', earned: done.length >= 1 },
    { key: 'five', emoji: '🌷', label: 'Cinco riscadas', earned: done.length >= 5 },
    { key: 'ten', emoji: '💐', label: 'Dez feitas', earned: done.length >= 10 },
    { key: 'silly', emoji: '🤪', label: 'Mestras da bobagem', earned: doneIn('bobagem') >= 3 },
    { key: 'dreamers', emoji: '🌙', label: 'Sonhadoras', earned: items.filter(item => item.category === 'sonho').length >= 5 },
    { key: 'brave', emoji: '🔥', label: 'Sem medo', earned: done.some(item => item.level === 5) },
    { key: 'memories', emoji: '📸', label: 'Álbum começando', earned: done.filter(item => item.photos.length).length >= 3 },
  ]
}

// Inclinação estável (−1,8° a 1,8°) para o efeito de papel colado.
export function tiltOf(id) {
  let hash = 0
  for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return ((Math.abs(hash) % 37) - 18) / 10
}
