// Os adesivos da cartela (o desenho de cada um fica em components/StickerArt.jsx).
export const STICKERS = [
  { kind: 'coracao', label: 'Coração' },
  { kind: 'tulipa', label: 'Tulipa' },
  { kind: 'estrela', label: 'Estrela' },
  { kind: 'sol', label: 'Sol' },
  { kind: 'lua', label: 'Lua' },
  { kind: 'nuvem', label: 'Nuvem' },
  { kind: 'aviao', label: 'Avião' },
  { kind: 'cafe', label: 'Café' },
  { kind: 'cereja', label: 'Cerejas' },
  { kind: 'carta', label: 'Carta' },
  { kind: 'ingresso', label: 'Ingresso' },
  { kind: 'uau', label: 'Uau!' },
]
export const STICKER_KINDS = STICKERS.map(sticker => sticker.kind)
export const stickerLabel = kind => STICKERS.find(sticker => sticker.kind === kind)?.label || 'Adesivo'
export const pageKey = year => (year ? `ano-${year}` : 'algum-dia')
