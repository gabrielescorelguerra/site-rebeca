import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { BlockContent, BlockSlot } from './Blocks'
import { EditingContext, blockVisual, boxStyle, moverStyle } from './blockStyle'
import { DESIGN, DESKTOP_BREAKPOINT, MAX_SCALE, artboardSize, ensureFrames, getFrame, stackOrder } from '../data/canvasLayout'

const FIXED_HEIGHT = new Set(['image', 'shape', 'spacer'])
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export function CanvasBlock({ block, index, planning, device }) {
  const editing = useContext(EditingContext)
  const { frameStyle, frameClass, masked, align, loop } = blockVisual(block, index, planning, editing)
  const f = getFrame(block, device) || { x: 0, y: 0, w: 400 }
  const fixed = Boolean(f.h) && FIXED_HEIGHT.has(block.type)
  const plain = { ...block, style: { ...block.style, offsetX: 0, offsetY: 0, rotate: 0, maxWidth: 0, place: undefined } }
  const selected = Boolean(editing?.selection?.includes(block.id))
  const single = selected && editing.selection.length === 1
  const outer = {
    left: f.x, top: f.y, width: f.w, zIndex: index + 1,
    ...(fixed ? { height: f.h } : f.h ? { minHeight: f.h } : {}),
    transform: f.rot ? `rotate(${f.rot}deg)` : undefined,
  }
  const inner = { ...frameStyle, ...(f.h ? { aspectRatio: 'auto' } : {}) }

  return <div className={`cv-block ${selected ? 'is-selected' : ''} ${editing ? 'is-editable' : ''}`} data-block-id={block.id} data-canvas-block style={outer} role={editing ? 'group' : undefined} aria-label={editing ? `Bloco ${index + 1}` : undefined}>
    <div className="cv-mover" data-mover style={moverStyle(plain, planning, masked)}>
      <div className="cv-fill" style={loop}>
        <div className={frameClass} style={inner} data-align={align}>
          <BlockContent block={block} planning={planning} editing={Boolean(editing)} />
        </div>
      </div>
      {single && <>{HANDLES.map(h => <i key={h} className={`cv-handle ${h}`} data-handle={h} />)}<i className="cv-handle rot" data-handle="rot" /></>}
    </div>
  </div>
}

// Mede o fim real do conteúdo (alturas automáticas) para a prancheta crescer junto.
function useContentBottom(ref, depKey) {
  const [bottom, setBottom] = useState(0)
  useEffect(() => {
    const root = ref.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const measure = () => setBottom([...root.querySelectorAll('[data-canvas-block]')].reduce((max, el) => Math.max(max, el.offsetTop + el.offsetHeight), 0))
    const observer = new ResizeObserver(measure)
    root.querySelectorAll('[data-canvas-block]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [ref, depKey])
  return bottom
}

// Prancheta de largura fixa, ampliada/reduzida por `scale`. Usada pela página final e pelo editor.
export function CanvasArtboard({ planning, device, scale, artboardRef, background, extra, paper }) {
  const local = useRef(null)
  const ref = artboardRef || local
  const base = DESIGN[device]
  const cfg = planning.canvas?.[device] || {}
  const width = Number(cfg.width) || base.width
  const blocks = useMemo(() => ensureFrames(planning.blocks, device, width), [planning.blocks, device, width])
  const bottom = useContentBottom(ref, `${blocks.length}:${device}:${scale}:${JSON.stringify(blocks.map(b => b.frame?.[device]))}`)
  const { height } = artboardSize({ ...planning, blocks }, device, undefined)
  const finalHeight = Math.max(height, bottom + 80)
  const view = { ...planning, blocks }
  return <div className="cv-sizer" style={{ width: width * scale, height: finalHeight * scale }}>
    <div className="cv-artboard" ref={ref} data-canvas-page data-device={device} style={{ ...paper, width, height: finalHeight, transform: `scale(${scale})`, '--inv': 1 / scale }}>
      {background}
      {blocks.map((block, index) => <CanvasBlock key={block.id} block={block} index={index} planning={view} device={device} />)}
      {extra}
    </div>
  </div>
}

// Celular sem layout próprio: blocos em coluna, na ordem em que aparecem no desktop.
// Uma forma grande ao fundo (a antiga "moldura da página") vira o painel que envolve a coluna.
export function StackView({ planning }) {
  const { blocks, backdrop } = useMemo(() => {
    const width = Number(planning.canvas?.desktop?.width) || DESIGN.desktop.width
    const back = planning.blocks.find(b => b.type === 'shape' && (getFrame(b, 'desktop')?.w || 0) >= width * 0.6) || null
    const list = stackOrder(planning.blocks).filter(b => b.type !== 'shape').map(block => ({ ...block, span: 12, style: { ...block.style, offsetX: 0, offsetY: 0, maxWidth: 0 } }))
    return { blocks: list, backdrop: back }
  }, [planning.blocks, planning.canvas])
  const view = { ...planning, blocks }
  const grid = <div className="blocks-grid cv-stack" data-blocks-grid style={{ textAlign: planning.textAlign || 'left' }}>
    {blocks.map((block, index) => <BlockSlot key={block.id} block={block} index={index} planning={view} />)}
  </div>
  if (!backdrop) return grid
  const { style } = boxStyle({ ...backdrop, style: { ...backdrop.style, shadow: backdrop.style?.shadow } }, planning)
  const panel = { ...style, aspectRatio: 'auto', minHeight: 0, padding: 22, display: 'block', margin: '0 16px' }
  return <div className="cv-panel" data-block-id={backdrop.id} style={panel}><div className="blocks-grid cv-stack" data-blocks-grid style={{ textAlign: planning.textAlign || 'left', paddingInline: 0 }}>
    {blocks.map((block, index) => <BlockSlot key={block.id} block={block} index={index} planning={view} />)}
  </div></div>
}

// Visualização final: escolhe computador ou celular pela largura e ajusta a escala para caber.
export function CanvasStage({ planning }) {
  const wrap = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = wrap.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const desktop = width >= DESKTOP_BREAKPOINT
  const customMobile = Boolean(planning.canvas?.mobile?.custom)
  const device = desktop ? 'desktop' : customMobile ? 'mobile' : 'stack'
  const design = Number(planning.canvas?.[device === 'stack' ? 'mobile' : device]?.width) || DESIGN[device === 'stack' ? 'mobile' : device].width
  const scale = Math.min(width / design, MAX_SCALE)
  return <div className="cv-stage" ref={wrap} style={{ visibility: width ? 'visible' : 'hidden' }}>
    {width > 0 && (device === 'stack' ? <StackView planning={planning} /> : <div className="cv-center"><CanvasArtboard planning={planning} device={device} scale={scale} /></div>)}
  </div>
}
