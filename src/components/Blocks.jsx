import { useContext, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, CalendarDays, Clock3, Copy, ExternalLink, GripVertical, Heart, ImageIcon, Trash2 } from 'lucide-react'
import IconByKey from './IconByKey'
import InteractiveContent from './Interactive'
import { INTERACTIVE_TYPES } from '../data/blocks'
import { hoverOptions } from '../data/visuals'
import { EditingContext, boxStyle, entranceStyle, loopStyle } from './blockStyle'
import { validLink } from '../utils/url'
import { downloadCalendar } from '../utils/calendar'
import { blockLabels } from '../editor/blockMeta'

const hoverKeys = new Set(hoverOptions.map(([key]) => key))

function formatDate(value, format) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nosso encontro ainda não tem data'
  if (format === 'short') return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  if (format === 'day') return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  if (format === 'time') return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })
}

function Countdown({ date, variant, finished }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer) }, [])
  const remaining = new Date(date).getTime() - now
  if (!Number.isFinite(remaining)) return <p className="call-countdown">Defina a data do encontro para ver a contagem.</p>
  if (remaining <= 0) return <p className="call-countdown">{finished}</p>
  const minutes = Math.floor(remaining / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor(minutes % 1440 / 60)
  if (variant === 'blocks') {
    return <div className="countdown-blocks" aria-label={`${days} dias, ${hours} horas e ${minutes % 60} minutos para nosso encontro`}>
      {[[days, 'dias'], [hours, 'horas'], [minutes % 60, 'minutos']].map(([value, label]) => <span key={label}><strong>{String(value).padStart(2, '0')}</strong><small>{label}</small></span>)}
    </div>
  }
  return <p className="call-countdown">♡ falta{minutes >= 60 ? 'm' : ''} {days > 0 ? `${days}d ` : ''}{hours > 0 ? `${hours}h ` : ''}{minutes % 60}min para nós</p>
}

function Placeholder({ icon: Icon = ImageIcon, children }) {
  return <div className="block-placeholder"><Icon size={20} aria-hidden="true" />{children}</div>
}

export function BlockContent({ block, planning, editing }) {
  const { props: p = {} } = block
  switch (block.type) {
    case 'heading': {
      const Tag = p.level === 1 ? 'h1' : p.level === 3 ? 'h3' : 'h2'
      return <Tag className="b-heading">{p.text || (editing ? 'Escreva um título' : '')}</Tag>
    }
    case 'text': {
      return <p className="b-text">{p.icon && <IconByKey name={p.icon} size="1.1em" className="b-text-icon" aria-hidden="true" />}{p.text || (editing ? 'Escreva um texto' : '')}</p>
    }
    case 'date':
      return <p className="b-date"><CalendarDays size="1.1em" aria-hidden="true" />{p.prefix && <span>{p.prefix} </span>}{formatDate(planning.date, p.format)}</p>
    case 'countdown':
      return <Countdown date={planning.date} variant={p.variant} finished={p.finished} />
    case 'activities': {
      const items = p.items || []
      return <div>
        {p.label && <h2 className="b-label">{p.label}</h2>}
        <ol className={`call-activities layout-${p.layout || 'list'}`} style={{ '--activity-gap': `${p.gap ?? 12}px` }}>
          {items.map((item, index) => <li key={item.id}>
            <span className="activity-main">
              {p.numbered && <span className="activity-number">{String(index + 1).padStart(2, '0')}</span>}
              <span>{item.name || (editing ? 'Atividade sem nome' : '')}{item.description && <small className="activity-description">{item.description}</small>}</span>
            </span>
            {p.showDurations && item.duration && <span className="activity-duration"><Clock3 size={14} aria-hidden="true" />{item.duration}</span>}
          </li>)}
        </ol>
        {!items.length && (editing ? <Placeholder icon={Clock3}>Adicione atividades no painel ao lado</Placeholder> : null)}
      </div>
    }
    case 'links': {
      const items = p.items || []
      return <div>
        {p.label && <h2 className="b-label">{p.label}</h2>}
        <div className={`b-links layout-${p.layout || 'list'}`}>
          {items.map(item => {
            const href = validLink(item.url) ? item.url : undefined
            return <a key={item.id} href={href} target="_blank" rel="noopener noreferrer" aria-disabled={href ? undefined : true}>{item.name}<ExternalLink size={15} aria-hidden="true" /></a>
          })}
        </div>
        {!items.length && (editing ? <Placeholder icon={ExternalLink}>Adicione links no painel ao lado</Placeholder> : null)}
      </div>
    }
    case 'button': {
      if (!validLink(p.url)) return editing ? <Placeholder icon={ExternalLink}>Botão sem endereço — cole um link https://</Placeholder> : null
      return <a className={`call-join ${p.look || 'filled'}`} href={p.url} target="_blank" rel="noopener noreferrer">{p.label || 'Abrir'}<ExternalLink size={16} aria-hidden="true" /></a>
    }
    case 'calendar': {
      if (!Number.isFinite(new Date(planning.date).getTime())) return editing ? <Placeholder icon={CalendarDays}>Defina a data do encontro</Placeholder> : null
      return <button className="call-calendar" type="button" onClick={() => downloadCalendar({ ...planning, title: p.eventTitle || planning.title })}><CalendarDays size={16} aria-hidden="true" />{p.label || 'Adicionar ao calendário'}</button>
    }
    case 'note': {
      if (!p.text && !p.title) return editing ? <Placeholder icon={Heart}>Escreva o bilhete</Placeholder> : null
      return <div className="call-note"><IconByKey name={p.icon || 'heart'} size={20} aria-hidden="true" /><div>{p.title && <h2>{p.title}</h2>}<p>{p.text}</p></div></div>
    }
    case 'image': {
      if (!validLink(p.url)) return editing ? <Placeholder>Escolha ou envie uma imagem</Placeholder> : null
      return <figure className="b-image">
        <img src={p.url} alt={p.alt || ''} loading="lazy" style={{ objectFit: p.fit || 'cover', aspectRatio: p.ratio && p.ratio !== 'auto' ? p.ratio : undefined, borderRadius: 'inherit' }} />
        {p.caption && <figcaption>{p.caption}</figcaption>}
      </figure>
    }
    case 'icon': {
      return <div className="b-icon"><IconByKey name={p.icon} size={p.size || 56} strokeWidth={1.4} aria-hidden="true" /></div>
    }
    case 'divider':
      return <div className={`b-divider look-${p.look || 'line'}`} role="separator">{p.look === 'hearts' && <><Heart size={12} fill="currentColor" /><Heart size={16} fill="currentColor" /><Heart size={12} fill="currentColor" /></>}</div>
    case 'spacer':
      return <div style={{ height: p.height || 40 }} aria-hidden="true" />
    default:
      return INTERACTIVE_TYPES.includes(block.type) ? <InteractiveContent block={block} /> : null
  }
}

export function BlockSlot({ block, index, planning }) {
  const editing = useContext(EditingContext)
  const s = block.style || {}
  const animated = planning.animationEnabled && (!editing || editing.animate)
  const entrance = s.entrance && s.entrance !== 'inherit' ? s.entrance : planning.blockEntrance
  const hover = animated && hoverKeys.has(s.hover) && s.hover !== 'none' ? `hv-${s.hover}` : ''
  const delay = (Number(s.delay) || 0) + index * (Number(planning.blockStagger) || 0) + (Number(planning.animationDelay) || 0)
  const frameStyle = { ...boxStyle(block, planning), ...(animated && entrance !== 'none' ? entranceStyle(planning, entrance, delay) : {}) }
  const moverStyle = {
    transform: s.offsetX || s.offsetY || s.rotate ? `translate(${s.offsetX || 0}px, ${s.offsetY || 0}px) rotate(${s.rotate || 0}deg)` : undefined,
  }
  const selected = editing?.selectedId === block.id
  const content = <BlockContent block={block} planning={planning} editing={Boolean(editing)} />

  if (!editing) {
    return <div className="block-slot" style={{ '--span': block.span }}>
      <div className="block-mover" style={moverStyle}>
        <div style={animated ? loopStyle(s.loop) : undefined}>
          <div className={`block-frame ${hover}`} style={frameStyle}>{content}</div>
        </div>
      </div>
    </div>
  }

  const onKeyDown = event => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); editing.onRemove(block.id) }
    else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowLeft')) { event.preventDefault(); editing.onMoveBy(block.id, -1) }
    else if (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowRight')) { event.preventDefault(); editing.onMoveBy(block.id, 1) }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); editing.onSelect(block.id) }
  }

  return <div
    className={`block-slot is-editable ${selected ? 'is-selected' : ''} ${editing.draggingId === block.id ? 'is-dragging' : ''}`}
    style={{ '--span': block.span }}
    data-slot
    data-block-id={block.id}
    tabIndex={0}
    role="group"
    aria-label={`${blockLabels[block.type] || 'Bloco'} ${index + 1}${selected ? ' (selecionado)' : ''}`}
    onClick={event => { event.stopPropagation(); editing.onSelect(block.id) }}
    onKeyDown={onKeyDown}
  >
    <div className="block-mover" style={moverStyle}>
      <div style={animated ? loopStyle(s.loop) : undefined}>
        <div className={`block-frame ${hover}`} style={frameStyle}>{content}</div>
      </div>
    </div>
    <button type="button" className="block-handle" aria-label={`Arrastar ${blockLabels[block.type] || 'bloco'}`} onPointerDown={event => editing.onHandleDown(event, block.id)} onClick={event => event.stopPropagation()}>
      <GripVertical size={14} aria-hidden="true" />{blockLabels[block.type] || 'Bloco'}
    </button>
    {selected && <div className="block-toolbar" onClick={event => event.stopPropagation()}>
      <button type="button" aria-label="Mover para antes" onClick={() => editing.onMoveBy(block.id, -1)}><ArrowUp size={14} /></button>
      <button type="button" aria-label="Mover para depois" onClick={() => editing.onMoveBy(block.id, 1)}><ArrowDown size={14} /></button>
      <button type="button" aria-label="Duplicar bloco" onClick={() => editing.onDuplicate(block.id)}><Copy size={14} /></button>
      <button type="button" aria-label="Excluir bloco" className="danger" onClick={() => editing.onRemove(block.id)}><Trash2 size={14} /></button>
    </div>}
    <span className="block-resize" role="presentation" data-span={`${block.span}/12`} onPointerDown={event => editing.onResizeDown(event, block.id)} onClick={event => event.stopPropagation()} />
  </div>
}
