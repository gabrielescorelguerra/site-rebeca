// Cálculos puros do modo "canvas livre": cada bloco tem um quadro (x, y, w, h, rot) por dispositivo
// dentro de uma prancheta de largura fixa que é ampliada/reduzida para caber na tela.
export const DESIGN = { desktop: { width: 1200, minHeight: 900 }, mobile: { width: 390, minHeight: 760 } }
export const MIN_SIZE = 24
export const MAX_SCALE = 1.5 // em telas muito largas a prancheta não passa disso
export const DESKTOP_BREAKPOINT = 720 // abaixo disso o convidado vê a versão de celular

export const defaultSizes = {
  heading: { w: 720 }, text: { w: 440 }, date: { w: 420 }, countdown: { w: 360 }, activities: { w: 560 }, links: { w: 320 }, button: { w: 260 },
  calendar: { w: 280 }, note: { w: 460 }, image: { w: 380, h: 285 }, icon: { w: 96 }, divider: { w: 420 }, spacer: { w: 240, h: 40 },
  rsvp: { w: 480 }, poll: { w: 480 }, question: { w: 480 }, checklist: { w: 400 }, reveal: { w: 420 }, quiz: { w: 480 }, surprise: { w: 260 }, shape: { w: 340, h: 220 },
}

// Altura aproximada (só para encaixar blocos sem medida real; a tela mede o DOM quando pode).
export function estimateHeight(block, width = 400) {
  const p = block.props || {}
  const lines = text => Math.max(1, Math.ceil(String(text || '').length * 9 / Math.max(width, 80)))
  switch (block.type) {
    case 'heading': return Math.round((block.style?.size || 64) * 1.15 * lines(p.text) * (width < 500 ? 1 : 0.55 + 0.45 / lines(p.text)))
    case 'text': return 28 * lines(p.text) + 8
    case 'date': return 34
    case 'countdown': return p.variant === 'blocks' ? 96 : 30
    case 'activities': return 40 + (p.items?.length || 1) * 64
    case 'links': return 40 + (p.items?.length || 1) * 46
    case 'button': case 'calendar': return 50
    case 'note': return 120 + 24 * lines(p.text)
    case 'image': return Math.round(width * 0.75)
    case 'icon': return (p.size || 56) + 8
    case 'divider': return 12
    case 'spacer': return p.height || 40
    case 'rsvp': case 'poll': case 'quiz': return 110 + (p.options?.length || 2) * 14
    case 'question': return 200
    case 'checklist': return 60 + (p.items?.length || 2) * 36
    case 'reveal': return 90
    case 'surprise': return 60
    case 'shape': return 220
    default: return 80
  }
}

export const getFrame = (block, device) => block.frame?.[device] || null
export const withFrame = (block, device, patch) => ({ ...block, frame: { ...block.frame, [device]: { ...block.frame?.[device], ...patch } } })
const heightOf = (block, device, measured) => measured?.[block.id] ?? getFrame(block, device)?.h ?? estimateHeight(block, getFrame(block, device)?.w)

export function sizeFor(type) {
  return defaultSizes[type] || { w: 400 }
}

// Distância até o fim do conteúdo (maior y + altura).
export function contentBottom(blocks, device, measured) {
  return blocks.reduce((max, block) => {
    const f = getFrame(block, device)
    return f ? Math.max(max, f.y + heightOf(block, device, measured)) : max
  }, 0)
}

export function artboardSize(planning, device, measured) {
  const base = DESIGN[device]
  const cfg = planning.canvas?.[device] || {}
  const width = Number(cfg.width) || base.width
  const minHeight = Number(cfg.minHeight) || base.minHeight
  return { width, height: Math.max(minHeight, Math.ceil(contentBottom(planning.blocks, device, measured) + 80)) }
}

// Blocos sem quadro (ex.: criados no modo grade) vão para baixo do conteúdo existente.
export function ensureFrames(blocks, device = 'desktop', width = DESIGN.desktop.width) {
  let y = contentBottom(blocks, device)
  y = y ? y + 40 : 60
  return blocks.map(block => {
    if (getFrame(block, device)) return block
    const w = Math.min(sizeFor(block.type).w, width - 80)
    const frame = { x: Math.round((width - w) / 2), y, w, ...(sizeFor(block.type).h ? { h: sizeFor(block.type).h } : {}) }
    y += heightOf({ ...block, frame: { [device]: frame } }, device) + 24
    return withFrame(block, device, frame)
  })
}

// Organiza os blocos em linhas usando as colunas (span) de cada um, como o modo grade fazia.
export function autoArrange(blocks, width = DESIGN.desktop.width, { margin = 80, gap = 24, top = 60 } = {}, measured) {
  const inner = width - margin * 2
  const col = (inner - gap * 11) / 12
  let y = top
  let used = 0
  let rowHeight = 0
  const out = []
  for (const block of blocks) {
    const span = Math.min(12, Math.max(1, block.span || 12))
    if (used + span > 12) { y += rowHeight + gap; used = 0; rowHeight = 0 }
    const w = Math.round(col * span + gap * (span - 1))
    const x = Math.round(margin + used * (col + gap))
    const fixedH = getFrame(block, 'desktop')?.h && ['image', 'shape'].includes(block.type) ? getFrame(block, 'desktop').h : null
    const h = fixedH ?? measured?.[block.id] ?? estimateHeight(block, w)
    out.push(withFrame(block, 'desktop', { x, y: Math.round(y), w, ...(fixedH ? { h: fixedH } : {}) }))
    rowHeight = Math.max(rowHeight, h)
    used += span
  }
  return out
}

// Ordem de leitura (celular em coluna única): de cima para baixo, esquerda para direita.
export function stackOrder(blocks) {
  return blocks
    .map((block, index) => ({ block, index, f: getFrame(block, 'desktop') }))
    .sort((a, b) => ((a.f?.y ?? 1e9) - (b.f?.y ?? 1e9)) || ((a.f?.x ?? 0) - (b.f?.x ?? 0)) || a.index - b.index)
    .map(item => item.block)
}

export const boundsOf = rects => {
  const x1 = Math.min(...rects.map(r => r.x)), y1 = Math.min(...rects.map(r => r.y))
  const x2 = Math.max(...rects.map(r => r.x + r.w)), y2 = Math.max(...rects.map(r => r.y + r.h))
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
}

// Ímã: aproxima bordas e centros do retângulo movido das guias (bordas/centro da prancheta e de outros blocos).
export function snapMove(rect, others, artboard, threshold = 6) {
  const xs = [0, artboard.width / 2, artboard.width]
  const ys = [0, artboard.height / 2, artboard.height]
  for (const o of others) { xs.push(o.x, o.x + o.w / 2, o.x + o.w); ys.push(o.y, o.y + o.h / 2, o.y + o.h) }
  const pick = (own, targets) => {
    let best = null
    for (const value of own) for (const target of targets) {
      const d = target - value
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, pos: target }
    }
    return best
  }
  const sx = pick([rect.x, rect.x + rect.w / 2, rect.x + rect.w], xs)
  const sy = pick([rect.y, rect.y + rect.h / 2, rect.y + rect.h], ys)
  return { dx: sx?.d ?? 0, dy: sy?.d ?? 0, guides: [...(sx ? [{ axis: 'x', pos: sx.pos }] : []), ...(sy ? [{ axis: 'y', pos: sy.pos }] : [])] }
}

// Alinha retângulos entre si (ou à prancheta, se for um só). Devolve { id: { x?, y? } }.
export function alignRects(rects, mode, artboard) {
  const box = rects.length > 1 ? boundsOf(rects) : { x: 0, y: 0, w: artboard.width, h: artboard.height }
  const out = {}
  for (const r of rects) {
    out[r.id] = {
      left: { x: box.x }, center: { x: Math.round(box.x + (box.w - r.w) / 2) }, right: { x: Math.round(box.x + box.w - r.w) },
      top: { y: box.y }, middle: { y: Math.round(box.y + (box.h - r.h) / 2) }, bottom: { y: Math.round(box.y + box.h - r.h) },
    }[mode]
  }
  return out
}

export function distributeRects(rects, axis) {
  if (rects.length < 3) return {}
  const key = axis === 'x' ? 'x' : 'y'
  const size = axis === 'x' ? 'w' : 'h'
  const sorted = [...rects].sort((a, b) => a[key] - b[key])
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const total = last[key] + last[size] - first[key]
  const gap = (total - sorted.reduce((sum, r) => sum + r[size], 0)) / (sorted.length - 1)
  const out = {}
  let pos = first[key]
  for (const r of sorted) { out[r.id] = { [key]: Math.round(pos) }; pos += r[size] + gap }
  return out
}

// Redimensiona pela alça (n, ne, e, se, s, sw, w, nw). dx/dy já estão nos eixos do bloco.
export function resizeRect(rect, handle, dx, dy, { keepAspect = false, min = MIN_SIZE } = {}) {
  let { x, y, w, h } = rect
  const west = handle.includes('w'), east = handle.includes('e'), north = handle.includes('n'), south = handle.includes('s')
  if (east) w += dx
  if (west) { w -= dx; x += dx }
  if (south) h += dy
  if (north) { h -= dy; y += dy }
  if (keepAspect && rect.h > 0 && rect.w > 0 && (east || west) && (north || south)) {
    const ratio = rect.w / rect.h
    const nh = Math.max(min, w / ratio)
    if (north) y += h - nh
    h = nh
  }
  if (w < min) { if (west) x -= min - w; w = min }
  if (h < min) { if (north) y -= min - h; h = min }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
}
