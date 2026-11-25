// Os adesivos da cartela (o desenho de cada um fica em components/StickerArt.jsx).
// size: tamanho base em px na página; scale (salvo no banco) multiplica esse valor.
export const STICKERS = [
  { kind: 'selo-tulipa', label: 'Selo com tulipa', size: 84 },
  { kind: 'lacre', label: 'Lacre de cera', size: 70 },
  { kind: 'flor', label: 'Flor prensada', size: 84 },
  { kind: 'bilhete', label: 'Bilhete “pra sempre”', size: 104 },
  { kind: 'polaroid', label: 'Polaroid', size: 84 },
  { kind: 'coracao', label: 'Coração', size: 66 },
  { kind: 'ingresso', label: 'Ingresso', size: 96 },
  { kind: 'selo-lua', label: 'Selo com lua', size: 80 },
  { kind: 'etiqueta', label: 'Etiqueta “sim!”', size: 78 },
  { kind: 'estrela', label: 'Estrela dourada', size: 62 },
  { kind: 'carta', label: 'Carta', size: 80 },
  { kind: 'tulipa', label: 'Tulipa', size: 76 },
  { kind: 'cereja', label: 'Cerejas', size: 66 },
  { kind: 'cafe', label: 'Café', size: 70 },
  { kind: 'aviao', label: 'Avião de papel', size: 74 },
  { kind: 'sol', label: 'Sol', size: 70 },
  { kind: 'lua', label: 'Lua', size: 62 },
  { kind: 'uau', label: 'Uau!', size: 66 },
]
// Fora da cartela, mas ainda desenhados (adesivos antigos continuam aparecendo).
const LEGACY = [{ kind: 'nuvem', label: 'Nuvem', size: 70 }]

export const STICKER_KINDS = STICKERS.map(sticker => sticker.kind)
const find = kind => STICKERS.find(sticker => sticker.kind === kind) || LEGACY.find(sticker => sticker.kind === kind)
export const stickerLabel = kind => find(kind)?.label || 'Adesivo'
export const stickerSize = kind => find(kind)?.size || 70

// Página de um adesivo: a primeira de cada seção não tem número (compatível com os já colados).
export const pageKey = (base, n = 1) => {
  const root = typeof base === 'number' ? `ano-${base}` : base || 'algum-dia'
  return n > 1 ? `${root}-${n}` : root
}
