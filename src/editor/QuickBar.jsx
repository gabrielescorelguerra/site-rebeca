import { useEffect, useRef } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, Copy, Italic, Minus, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { shapeOptions, variantOptions } from '../data/visuals'

const widths = [[3, '¼'], [4, '⅓'], [6, '½'], [8, '⅔'], [9, '¾'], [12, 'Total']]

// Barra flutuante ao lado do bloco selecionado: os ajustes mais usados ficam a um clique.
export default function QuickBar({ block, api, onEditText, canvas = false }) {
  const ref = useRef(null)
  const s = block.style || {}

  // Acompanha o bloco (rolagem, arrasto, redimensionamento) sem passar por estado do React.
  useEffect(() => {
    let frame = 0
    const tick = () => {
      const bar = ref.current
      const target = document.querySelector(`[data-block-id="${CSS.escape(block.id)}"] [data-mover]`)
      if (bar && target) {
        const rect = target.getBoundingClientRect()
        const width = bar.offsetWidth
        const height = bar.offsetHeight
        const stage = document.querySelector('.builder-stage')?.getBoundingClientRect()
        const minLeft = stage ? stage.left : 8
        const maxRight = stage ? stage.right : window.innerWidth - 8
        let top = rect.top - height - 12
        if (top < 150) top = Math.min(rect.bottom + 12, window.innerHeight - height - 8)
        const left = Math.max(minLeft, Math.min(rect.left + rect.width / 2 - width / 2, maxRight - width))
        bar.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
        bar.style.visibility = rect.bottom < 60 || rect.top > window.innerHeight ? 'hidden' : 'visible'
      }
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [block.id])

  const currentSize = () => {
    const el = document.querySelector(`[data-block-id="${CSS.escape(block.id)}"] .block-frame`)
    return s.size || (el ? Math.round(parseFloat(getComputedStyle(el).fontSize)) : 18)
  }
  const bump = direction => api.setStyle(block.id, { size: Math.max(10, Math.min(200, Math.round(currentSize() * (direction > 0 ? 1.1 : 0.9)) + (direction > 0 ? 1 : -1))) })
  const style = patch => api.setStyle(block.id, patch)
  const moved = s.offsetX || s.offsetY || s.rotate
  const align = s.align || 'inherit'

  return <div ref={ref} className="quickbar" role="toolbar" aria-label={`Ajustes rápidos de ${block.type}`} onPointerDown={event => event.stopPropagation()}>
    <div className="qb-group">
      <button type="button" aria-label="Diminuir texto" title="Diminuir texto" onClick={() => bump(-1)}><Minus size={14} /></button>
      <output aria-label="Tamanho do texto">{currentSize()}</output>
      <button type="button" aria-label="Aumentar texto" title="Aumentar texto" onClick={() => bump(1)}><Plus size={14} /></button>
    </div>
    <div className="qb-group">
      <button type="button" aria-pressed={(s.weight || 0) >= 600} aria-label="Negrito" title="Negrito" onClick={() => style({ weight: (s.weight || 0) >= 600 ? 400 : 700 })}><Bold size={14} /></button>
      <button type="button" aria-pressed={Boolean(s.italic)} aria-label="Itálico" title="Itálico" onClick={() => style({ italic: !s.italic })}><Italic size={14} /></button>
      <label className="qb-color" title="Cor do texto"><span className="sr-only">Cor do texto</span><input type="color" value={s.color || '#31292d'} onChange={event => style({ color: event.target.value })} /></label>
    </div>
    <div className="qb-group" role="group" aria-label="Alinhamento">
      {[['left', AlignLeft, 'Alinhar à esquerda'], ['center', AlignCenter, 'Centralizar'], ['right', AlignRight, 'Alinhar à direita']].map(([key, Icon, label]) =>
        <button key={key} type="button" aria-pressed={align === key} aria-label={label} title={label} onClick={() => style({ align: align === key ? 'inherit' : key })}><Icon size={14} /></button>)}
    </div>
    <div className="qb-group">
      <label className="qb-select"><span>Moldura</span>
        <select value={s.variant || 'none'} onChange={event => style({ variant: event.target.value })}>{variantOptions.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>
      <label className="qb-select"><span>Formato</span>
        <select value={s.shape || 'rounded'} onChange={event => style({ shape: event.target.value })}>{shapeOptions.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>
      {!canvas && <label className="qb-select"><span>Largura</span>
        <select value={widths.some(([n]) => n === block.span) ? block.span : ''} onChange={event => api.setSpan(block.id, Number(event.target.value))}>
          {!widths.some(([n]) => n === block.span) && <option value="">{block.span}/12</option>}
          {widths.map(([n, text]) => <option key={n} value={n}>{text}</option>)}</select></label>}
    </div>
    <div className="qb-group">
      <button type="button" aria-label="Editar o texto" title="Editar o texto (Enter)" onClick={() => onEditText(block.id)}><Pencil size={14} /></button>
      {!canvas && moved ? <button type="button" aria-label="Zerar posição e giro" title="Zerar posição e giro" onClick={() => style({ offsetX: 0, offsetY: 0, rotate: 0 })}><RotateCcw size={14} /></button> : null}
      <button type="button" aria-label={canvas ? 'Avançar uma camada' : 'Mover para antes'} title={canvas ? 'Avançar uma camada' : 'Mover para antes'} onClick={() => (canvas ? api.zOrder([block.id], 'forward') : api.moveBy(block.id, -1))}><ArrowUp size={14} /></button>
      <button type="button" aria-label={canvas ? 'Recuar uma camada' : 'Mover para depois'} title={canvas ? 'Recuar uma camada' : 'Mover para depois'} onClick={() => (canvas ? api.zOrder([block.id], 'backward') : api.moveBy(block.id, 1))}><ArrowDown size={14} /></button>
      <button type="button" aria-label="Duplicar bloco" title="Duplicar (Ctrl+D)" onClick={() => api.duplicate(block.id)}><Copy size={14} /></button>
      <button type="button" className="danger" aria-label="Excluir bloco" title="Excluir (Delete)" onClick={() => api.remove(block.id)}><Trash2 size={14} /></button>
    </div>
  </div>
}
