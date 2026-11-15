// Modelo de blocos — funções puras (sem React/Supabase) para poder testar.
export const BLOCK_TYPES = ['heading', 'text', 'date', 'countdown', 'activities', 'links', 'button', 'calendar', 'note', 'image', 'icon', 'divider', 'spacer']

export const newId = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`)

export function defaultDate(from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + 1)
  d.setHours(20, 0, 0, 0)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const TYPE_DEFAULTS = {
  heading: () => ({ span: 12, props: { text: 'Nossa próxima call', level: 1 }, style: { size: 64, weight: 400, spacing: -0.04, lineHeight: 1.08, fontFamily: 'inherit' } }),
  text: () => ({ span: 12, props: { text: 'Escreva aqui uma mensagem, um detalhe ou uma surpresa.', icon: '' }, style: {} }),
  date: () => ({ span: 12, props: { format: 'full', prefix: '' }, style: { size: 15, opacity: 0.75 } }),
  countdown: () => ({ span: 12, props: { variant: 'text', finished: 'Tá na hora da nossa call!' }, style: {} }),
  activities: () => ({
    span: 12,
    props: { label: 'o que vamos fazer', layout: 'list', numbered: true, showDurations: true, gap: 12, items: [{ id: newId(), name: 'Conversar sem pressa', duration: '30 min', description: '' }] },
    style: {},
  }),
  links: () => ({ span: 12, props: { label: 'vamos usar', layout: 'list', items: [{ id: newId(), name: 'Discord', url: 'https://discord.com' }] }, style: {} }),
  button: () => ({ span: 12, props: { label: 'Entrar na nossa call', url: '', look: 'filled' }, style: {} }),
  calendar: () => ({ span: 12, props: { label: 'Adicionar ao calendário', eventTitle: '' }, style: {} }),
  note: () => ({ span: 12, props: { title: 'Um lembrete para você', text: 'Tava com saudade de conversar com você.', icon: 'heart' }, style: { variant: 'tint', padding: 24 } }),
  image: () => ({ span: 6, props: { url: '', alt: '', fit: 'cover', ratio: '4/3', caption: '' }, style: { shape: 'rounded' } }),
  icon: () => ({ span: 3, props: { icon: 'heart', size: 56 }, style: { align: 'center', color: undefined } }),
  divider: () => ({ span: 12, props: { look: 'line' }, style: { opacity: 0.6 } }),
  spacer: () => ({ span: 12, props: { height: 40 }, style: {} }),
}

export function createBlock(type) {
  const base = (TYPE_DEFAULTS[type] || TYPE_DEFAULTS.text)()
  return { id: newId(), type: TYPE_DEFAULTS[type] ? type : 'text', span: base.span, props: base.props, style: base.style }
}

export function cloneBlock(block) {
  const copy = structuredClone(block)
  copy.id = newId()
  for (const key of ['items']) if (Array.isArray(copy.props?.[key])) copy.props[key] = copy.props[key].map(item => ({ ...item, id: newId() }))
  return copy
}

const LEGACY_SIZES = { micro: 10, tiny: 13, compact: 15, medium: 17, large: 19, huge: 22, poster: 26, hero: 32, responsive: 20, maximum: 40, cinema: 28, book: 18, banner: 34, mobile: 16, xl: 40, xxl: 60 }

export function legacyBaseSize(p) {
  if (p.fontSize === 'custom') return Number(p.customFontSize) || 18
  return LEGACY_SIZES[p.fontSize] || 18
}

// Converte o formato antigo (campos soltos) em blocos equivalentes, preservando o conteúdo.
export function migrateLegacy(p) {
  const blocks = []
  const add = (type, patch = {}) => {
    const block = createBlock(type)
    block.span = patch.span ?? block.span
    block.props = { ...block.props, ...patch.props }
    block.style = { ...block.style, ...patch.style }
    blocks.push(block)
    return block
  }
  if (p.showPlanningLabel !== false && p.planningLabel) {
    add('text', { props: { text: p.planningLabel, icon: p.gameIcon || 'blocks' }, style: { size: 12, uppercase: true, spacing: 0.2, color: p.planningLabelColor || undefined, opacity: 1 } })
  }
  add('heading', { props: { text: p.title || 'Nossa próxima call', level: 1 }, style: { size: Number(p.titleSize) || 72, weight: Number(p.titleWeight) || 400, spacing: Number.isFinite(Number(p.titleSpacing)) ? Number(p.titleSpacing) : -0.05, lineHeight: 1.06, color: p.useTitleColor ? p.titleColor : undefined } })
  if (p.showSubtitle !== false && p.subtitle) add('text', { props: { text: p.subtitle }, style: { opacity: 0.65, lineHeight: Number(p.textLineHeight) || 1.7 } })
  if (p.showDate !== false) add('date', {})
  if (p.showCountdown) add('countdown', { props: { variant: p.countdownStyle || 'text', finished: p.countdownFinished || 'Tá na hora da nossa call!' } })
  const both = p.showCallButton && p.showCalendar
  if (p.showCallButton) add('button', { span: both ? 6 : 12, props: { label: p.callButtonLabel || 'Entrar na nossa call', url: p.callUrl || '', look: p.buttonStyle === 'outline' ? 'outline' : 'filled' } })
  if (p.showCalendar) add('calendar', { span: both ? 6 : 12 })
  const hasActivities = p.showActivities !== false && Array.isArray(p.activities)
  const hasTools = Boolean(p.showTools) && Array.isArray(p.tools)
  if (hasActivities || hasTools) add('divider', { props: { look: 'line' }, style: { opacity: 0.15 } })
  const columns = hasActivities && hasTools && p.sectionLayout !== 'stacked'
  if (hasActivities) {
    add('activities', { span: columns ? 8 : 12, props: { label: p.activitiesLabel || 'o que vamos fazer', layout: p.activityLayout || 'list', numbered: p.showActivityNumbers !== false, showDurations: p.showDurations !== false, gap: Number(p.activityGap) || 12, items: p.activities.map(item => ({ id: item.id ?? newId(), name: item.name || '', duration: item.duration || '', description: item.description || '' })) } })
  }
  if (hasTools) add('links', { span: columns ? 4 : 12, props: { label: p.toolsLabel || 'vamos usar', layout: 'list', items: p.tools.map(item => ({ id: item.id ?? newId(), name: item.name || '', url: item.url || '' })) } })
  if (p.showNote && p.noteText) add('note', { props: { title: p.noteTitle || '', text: p.noteText, icon: 'heart' } })
  if (p.footerMessage) add('text', { props: { text: p.footerMessage, icon: 'heart' }, style: { size: 11, opacity: 0.55, align: 'center', spacing: 0.07 } })
  return blocks
}

const pageDefaults = {
  hasPlannedCall: true, hidePast: true, title: 'Nossa próxima call', subtitle: 'Um tempinho reservado para nós duas.', eventDuration: 60, eventId: '', revision: 0,
  textAlign: 'left', contentOffset: 90, baseFontSize: 18, fontFamily: 'serif', panelWidth: 1024,
  backgroundColor: '#fbf8f6', textColor: '#31292d', accentColor: '#bd7184', planningLabelColor: '#bd7184', backButtonColor: '#88777c',
  backgroundGradient: false, backgroundGradientColor: '#ecd6e1', backgroundGradientAngle: 135,
  backgroundPattern: 'none', backgroundPatternOpacity: 1,
  backgroundImage: '', backgroundImageOpacity: 0.28, backgroundImagePosition: 'center', backgroundImageBlur: 0, backgroundMotion: 'none',
  backgroundIconEnabled: false, backgroundIcon: 'blocks', backgroundIconColor: '#bd7184', backgroundIconSize: 28, backgroundIconOpacity: 0.18, backgroundIconSpacing: 72, backgroundIconRotation: 0,
  panelEnabled: true, style: 'minimal', panelShape: 'rounded', panelRadius: 32, panelBorderWidth: 1, panelBorderStyle: 'solid', panelShadow: 'soft', panelPadding: 56, panelColor: '#ffffff', panelOpacity: 0.75,
  animationEnabled: true, animationSpeed: 'normal', animationIntensity: 'medium', animationPreset: 'soft',
  panelEntrance: 'rise', panelLoop: 'none', hoverAnimation: 'none', glowAnimation: 'none', animationDelay: 0,
  blockEntrance: 'rise', blockStagger: 0.08,
}

const legacyContent = {
  showPlanningLabel: true, planningLabel: 'planejamento da ligação', activitiesLabel: 'o que vamos fazer', toolsLabel: 'vamos usar', gameIcon: 'blocks',
  showSubtitle: true, showDate: true, showActivities: true, showTools: false, sectionLayout: 'columns', showActivityNumbers: true, showDurations: true, activityLayout: 'list',
  activities: [
    { id: 1, name: 'Chegar e contar como foi o dia', duration: '15 min' },
    { id: 2, name: 'Jogar alguma coisa juntas', duration: '30 min' },
    { id: 3, name: 'Conversar sem pressa', duration: '20 min' },
  ],
  tools: [{ id: 1, name: 'Discord', url: 'https://discord.com' }, { id: 2, name: 'Jogo da noite', url: '' }],
  showNote: false, noteTitle: 'Um lembrete para você', noteText: 'Tava com saudade de conversar com você.',
}

export function buildDefaultPlanning() {
  const base = { ...pageDefaults, date: defaultDate() }
  return { ...base, blocks: migrateLegacy({ ...base, ...legacyContent }) }
}

const isBlock = b => b && typeof b === 'object' && typeof b.type === 'string'

// Aceita qualquer registro salvo (formato antigo ou novo) e devolve um planejamento completo.
export function normalizePlanning(raw) {
  const defaults = buildDefaultPlanning()
  if (!raw || typeof raw !== 'object' || !Object.keys(raw).length) return defaults
  const merged = { ...defaults, ...raw }
  let blocks
  if (Array.isArray(raw.blocks)) {
    blocks = raw.blocks.filter(isBlock).map(block => ({ ...createBlock(block.type), ...block, props: { ...createBlock(block.type).props, ...block.props }, style: { ...block.style }, id: block.id || newId() }))
  } else {
    blocks = migrateLegacy({ ...defaults, ...legacyContent, ...raw })
    merged.blockEntrance = 'none' // o visual antigo animava só a moldura
    merged.baseFontSize = legacyBaseSize(raw)
    if (raw.panelWidth === undefined) merged.panelWidth = 1024
  }
  return { ...merged, blocks }
}
