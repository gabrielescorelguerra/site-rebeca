import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calendarContent } from '../src/utils/calendar.js'
import { callHasEnded } from '../src/utils/callTime.js'
import { validLink } from '../src/utils/url.js'
import { buildDefaultPlanning, cloneBlock, createBlock, defaultDate, normalizePlanning, BLOCK_TYPES, INTERACTIVE_TYPES } from '../src/data/blocks.js'
import { templates } from '../src/data/templates.js'
import { DESIGN, alignRects, artboardSize, autoArrange, boundsOf, distributeRects, ensureFrames, resizeRect, snapMove, stackOrder } from '../src/data/canvasLayout.js'
import { patternOptions, patternStyle, shapeDefs, shapeStyle, variants, withAlpha } from '../src/data/visuals.js'

test('validLink aceita só http/https', () => {
  assert.equal(validLink('https://discord.com'), true)
  assert.equal(validLink('http://exemplo.com/a'), true)
  assert.equal(validLink('javascript:alert(1)'), false)
  assert.equal(validLink('data:text/html,x'), false)
  assert.equal(validLink('discord.com'), false)
})

test('calendário usa UID estável e SEQUENCE da revisão', () => {
  const base = { date: '2026-12-01T20:00', title: 'Call; com, vírgula', subtitle: 'linha1\nlinha2', eventDuration: 90, eventId: 'abc', revision: 3 }
  const first = calendarContent(base, new Date('2026-11-01T00:00:00Z'))
  const moved = calendarContent({ ...base, date: '2026-12-02T21:00', revision: 4 }, new Date('2026-11-02T00:00:00Z'))
  assert.match(first, /UID:rebeca-call-abc@nosso-encontro/)
  assert.match(first, /SEQUENCE:3/)
  assert.match(moved, /UID:rebeca-call-abc@nosso-encontro/)
  assert.match(moved, /SEQUENCE:4/)
  assert.match(first, /SUMMARY:Call\x5c; com\x5c, vírgula/)
  assert.match(first, /DESCRIPTION:linha1\\nlinha2/)
  assert.equal(calendarContent({ ...base, date: 'inválida' }), null)
})

test('callHasEnded considera duração + 2h', () => {
  const planning = { date: '2026-10-03T20:00', eventDuration: 60 }
  const start = new Date(planning.date).getTime()
  assert.equal(callHasEnded(planning, start + 60 * 60000), false)
  assert.equal(callHasEnded(planning, start + 3 * 60 * 60000 + 1), true)
  assert.equal(callHasEnded({ date: '' }, Date.now()), false)
})

test('defaultDate é sempre no futuro (amanhã às 20h)', () => {
  const from = new Date(2026, 10, 15, 9, 30)
  assert.equal(defaultDate(from), '2026-11-16T20:00')
})

test('registro antigo (sem blocks) é migrado preservando conteúdo', () => {
  const legacy = {
    title: 'Noite de jogos', subtitle: 'Só nós duas', date: '2026-12-05T21:00', showDate: true, showCountdown: true, countdownStyle: 'blocks',
    showCallButton: true, callUrl: 'https://meet.example.com/x', callButtonLabel: 'Entrar', showCalendar: true,
    showActivities: true, activities: [{ id: 1, name: 'Jogar', duration: '30 min' }], showTools: true, tools: [{ id: 1, name: 'Discord', url: 'https://discord.com' }],
    showNote: true, noteTitle: 'Oi', noteText: 'Saudade', footerMessage: 'te amo', style: 'neon', fontSize: 'custom', customFontSize: 21, textAlign: 'center',
  }
  const result = normalizePlanning(legacy)
  const types = result.blocks.map(b => b.type)
  for (const type of ['heading', 'text', 'date', 'countdown', 'button', 'calendar', 'activities', 'links', 'note']) assert.ok(types.includes(type), type)
  assert.equal(result.blocks.find(b => b.type === 'heading').props.text, 'Noite de jogos')
  assert.equal(result.blocks.find(b => b.type === 'button').props.url, 'https://meet.example.com/x')
  assert.equal(result.blocks.find(b => b.type === 'activities').span, 8)
  assert.equal(result.blocks.find(b => b.type === 'links').span, 4)
  assert.equal(result.style, 'neon')
  assert.equal(result.textAlign, 'center')
  assert.equal(result.baseFontSize, 21)
  assert.equal(result.blockEntrance, 'none')
  assert.equal(result.title, 'Noite de jogos')
})

test('registro novo preserva blocos e completa campos ausentes', () => {
  const block = { id: 'b1', type: 'text', span: 6, props: { text: 'oi' }, style: { size: 30 } }
  const result = normalizePlanning({ blocks: [block, { nada: true }] })
  assert.equal(result.blocks.length, 1)
  assert.equal(result.blocks[0].id, 'b1')
  assert.equal(result.blocks[0].span, 6)
  assert.equal(result.blocks[0].style.size, 30)
  assert.equal(result.accentColor, '#bd7184')
})

test('config vazia vira o padrão com data no futuro', () => {
  const result = normalizePlanning({})
  assert.ok(result.blocks.length > 0)
  assert.ok(new Date(result.date).getTime() > Date.now() - 1000)
  assert.deepEqual(Object.keys(buildDefaultPlanning()).includes('blocks'), true)
})

test('todo tipo de bloco pode ser criado e clonado com ids novos', () => {
  for (const type of BLOCK_TYPES) {
    const block = createBlock(type)
    assert.equal(block.type, type)
    assert.ok(block.span >= 1 && block.span <= 12)
    const copy = cloneBlock(block)
    assert.notEqual(copy.id, block.id)
    if (block.props.items) assert.notEqual(copy.props.items[0].id, block.props.items[0].id)
  }
})

test('blocos interativos: padrões válidos e clone remapeia a resposta certa do quiz', () => {
  for (const type of INTERACTIVE_TYPES) assert.ok(BLOCK_TYPES.includes(type), type)
  const quiz = createBlock('quiz')
  assert.ok(quiz.props.options.some(option => option.id === quiz.props.correctId))
  const copy = cloneBlock(quiz)
  assert.ok(copy.props.options.some(option => option.id === copy.props.correctId))
  assert.notEqual(copy.props.correctId, quiz.props.correctId)
  assert.ok(createBlock('rsvp').props.options.length >= 2)
})

test('modelos de layout só usam tipos e colunas válidos', () => {
  for (const template of Object.values(templates)) {
    for (const block of template.build()) {
      assert.ok(BLOCK_TYPES.includes(block.type))
      assert.ok(block.span >= 1 && block.span <= 12)
    }
  }
})

test('texturas e molduras são CSS válido (sem chaves vazias nem vírgulas faltando)', () => {
  for (const [key] of patternOptions) {
    const css = patternStyle(key, '#bd7184', '#31292d')
    if (key === 'none') { assert.deepEqual(css, {}); continue }
    assert.ok(css.backgroundImage, key)
    // as texturas quebradas antes tinham "cor 1px" sem vírgula dentro de gradientes
    assert.doesNotMatch(css.backgroundImage, /\d(px|%)\s+(transparent|rgba?\(|#)/, key)
    const opens = (css.backgroundImage.match(/\(/g) || []).length
    const closes = (css.backgroundImage.match(/\)/g) || []).length
    assert.equal(opens, closes, `parênteses desbalanceados em ${key}`)
  }
  for (const key of ['minimal', 'soft', 'editorial', 'neon', 'cyberpunk', 'vaporwave', 'glass', 'three-d', 'toy-3d', 'hologram', 'laser', 'matrix', 'sunset', 'bubblegum', 'metal', 'paper-cut', 'terminal', 'custom']) {
    assert.ok(variants[key], `moldura antiga ${key} precisa continuar existindo`)
  }
  assert.equal(withAlpha('#ff0000', 0.5), 'rgba(255, 0, 0, 0.5)')
})

test('formas ajustam o conteúdo: recuo, proporção e centralização acompanham o recorte', () => {
  for (const [key, def] of Object.entries(shapeDefs)) {
    const { css, center, masked } = shapeStyle(key, 24, 0)
    assert.ok(def.radius || def.mask, `${key} precisa de recorte`)
    if (def.mask) { assert.ok(masked && css.maskImage, key); assert.ok(def.pad && def.aspect, `${key} precisa de recuo e proporção`) }
    if (def.pad) assert.match(css.padding, /%/, key)
    if (def.center) assert.equal(css.display, 'flex', key)
    assert.equal(center, Boolean(def.center))
  }
  assert.match(shapeStyle('circle', 0, 10).css.padding, /calc\(15% \+ 10px\)/)
  assert.equal(shapeStyle('custom', 40).css.borderRadius, '40px')
  assert.equal(shapeStyle('inexistente', 0).css.borderRadius, shapeDefs.rounded.radius)
})

const block = (id, type, frame, extra = {}) => ({ id, type, props: {}, style: {}, span: 12, frame: frame ? { desktop: frame } : undefined, ...extra })

test('canvas: ímã encosta em bordas/centros e devolve as guias', () => {
  const board = { width: 1200, height: 900 }
  const near = snapMove({ x: 598, y: 100, w: 100, h: 50 }, [], board, 6) // centro do bloco em 648? borda esquerda perto do centro (600)
  assert.equal(near.dx, 2)
  assert.deepEqual(near.guides[0], { axis: 'x', pos: 600 })
  const far = snapMove({ x: 300, y: 300, w: 100, h: 50 }, [{ x: 800, y: 700, w: 50, h: 50 }], board, 6)
  assert.equal(far.dx, 0); assert.equal(far.dy, 0); assert.deepEqual(far.guides, [])
  const align = snapMove({ x: 497, y: 0, w: 100, h: 40 }, [{ x: 500, y: 200, w: 80, h: 80 }], board, 6)
  assert.equal(align.dx, 3)
})

test('canvas: alinhar e distribuir', () => {
  const rects = [{ id: 'a', x: 100, y: 0, w: 100, h: 50 }, { id: 'b', x: 300, y: 80, w: 200, h: 50 }, { id: 'c', x: 700, y: 20, w: 100, h: 90 }]
  assert.deepEqual(alignRects(rects, 'left', DESIGN.desktop), { a: { x: 100 }, b: { x: 100 }, c: { x: 100 } })
  assert.deepEqual(alignRects(rects, 'right', DESIGN.desktop).b, { x: 600 })
  assert.deepEqual(alignRects([rects[0]], 'center', { width: 1200, height: 900 }), { a: { x: 550 } }) // um só: alinha à prancheta
  const spread = distributeRects(rects, 'x')
  assert.equal(spread.a.x, 100); assert.equal(spread.c.x, 700)
  assert.equal(spread.b.x, 100 + 100 + (700 + 100 - 100 - 400) / 2) // espaços iguais
  assert.deepEqual(distributeRects(rects.slice(0, 2), 'x'), {})
  assert.deepEqual(boundsOf(rects), { x: 100, y: 0, w: 700, h: 130 })
})

test('canvas: redimensionar por alça respeita mínimo e proporção', () => {
  const r = { x: 100, y: 100, w: 200, h: 100 }
  assert.deepEqual(resizeRect(r, 'e', 50, 0), { x: 100, y: 100, w: 250, h: 100 })
  assert.deepEqual(resizeRect(r, 'nw', 20, 10), { x: 120, y: 110, w: 180, h: 90 })
  assert.equal(resizeRect(r, 'e', -500, 0).w, 24)
  const keep = resizeRect(r, 'se', 100, 0, { keepAspect: true })
  assert.equal(keep.w / keep.h, 2)
})

test('canvas: blocos sem quadro vão para baixo; ordem de leitura vem de y e x', () => {
  const blocks = [block('a', 'heading', { x: 100, y: 50, w: 700 }), block('b', 'text', null), block('c', 'image', { x: 20, y: 10, w: 300, h: 200 })]
  const placed = ensureFrames(blocks, 'desktop', 1200)
  assert.ok(placed[1].frame.desktop.y > 50, 'o sem quadro fica abaixo')
  assert.equal(placed[0], blocks[0]) // os que já têm quadro não mudam
  assert.deepEqual(stackOrder(placed).map(b => b.id), ['c', 'a', 'b'])
  const size = artboardSize({ blocks: placed, canvas: { desktop: { width: 1200, minHeight: 100 } } }, 'desktop')
  assert.ok(size.height > placed[1].frame.desktop.y)
})

test('canvas: organizar em linhas usa as colunas e não passa da prancheta', () => {
  const list = [block('a', 'heading', null, { span: 12 }), block('b', 'text', null, { span: 8 }), block('c', 'links', null, { span: 4 }), block('d', 'note', null, { span: 6 })]
  const out = autoArrange(list, 1200, { margin: 80, gap: 24, top: 60 })
  const f = id => out.find(b => b.id === id).frame.desktop
  assert.equal(f('a').x, 80); assert.equal(f('a').w, 1040)
  assert.equal(f('b').y, f('c').y) // 8 + 4 colunas na mesma linha
  assert.ok(f('c').x > f('b').x)
  assert.ok(f('d').y > f('b').y)
  for (const b of out) assert.ok(b.frame.desktop.x + b.frame.desktop.w <= 1200 - 80 + 1)
})

test('canvas: registro com layoutMode canvas ganha quadros ao normalizar', () => {
  const result = normalizePlanning({ layoutMode: 'canvas', blocks: [{ id: 'x', type: 'text', props: { text: 'oi' } }] })
  assert.ok(result.blocks[0].frame.desktop.w > 0)
  assert.equal(result.canvas.mobile.custom, false)
  assert.equal(normalizePlanning({}).layoutMode, 'grid')
})

import { IDEAS, badges, pickIdea, progress, roulettePool, tiltOf } from '../src/data/bucketIdeas.js'

test('lista: sorteio evita ideias já usadas e filtra a roleta', () => {
  const used = IDEAS.slice(1).map(idea => ({ title: idea.text.toUpperCase() }))
  assert.equal(pickIdea(used, null, () => 0).id, 0)
  assert.equal(pickIdea(used, 0, () => 0), null)
  const items = [{ done: false, level: 2, category: 'comida' }, { done: false, level: 5, category: 'comida' }, { done: true, level: 1, category: 'comida' }, { done: false, level: 1, category: 'jogo' }]
  assert.equal(roulettePool(items, { maxLevel: 3 }).length, 2)
  assert.equal(roulettePool(items, { maxLevel: 5, category: 'comida' }).length, 2)
})

test('lista: progresso, conquistas e inclinação estável', () => {
  assert.deepEqual(progress([]), { done: 0, total: 0, percent: 0 })
  const items = [{ done: true, level: 5, category: 'bobagem', photos: [] }, { done: false, level: 1, category: 'sonho', photos: [] }]
  assert.deepEqual(progress(items), { done: 1, total: 2, percent: 50 })
  const earned = Object.fromEntries(badges(items).map(b => [b.key, b.earned]))
  assert.equal(earned.first, true); assert.equal(earned.brave, true); assert.equal(earned.five, false)
  assert.equal(tiltOf('abc'), tiltOf('abc')); assert.ok(Math.abs(tiltOf('xyz')) <= 1.8)
})
