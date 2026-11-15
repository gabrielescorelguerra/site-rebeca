import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calendarContent } from '../src/utils/calendar.js'
import { callHasEnded } from '../src/utils/callTime.js'
import { validLink } from '../src/utils/url.js'
import { buildDefaultPlanning, cloneBlock, createBlock, defaultDate, normalizePlanning, BLOCK_TYPES, INTERACTIVE_TYPES } from '../src/data/blocks.js'
import { templates } from '../src/data/templates.js'
import { patternOptions, patternStyle, variants, withAlpha } from '../src/data/visuals.js'

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
