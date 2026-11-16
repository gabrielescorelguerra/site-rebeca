import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalSpaceAround, AlignStartHorizontal, AlignStartVertical, AlignVerticalSpaceAround, ChevronsDown, ChevronsUp, Magnet, Minus, Plus, Scan } from 'lucide-react'
import { CanvasArtboard } from '../components/CanvasView'
import PageBackground from '../components/PageBackground'
import { pageStyle } from '../components/pageStyle'
import { EditingContext } from '../components/blockStyle'
import { ResponsesContext, useResponsesStore } from '../components/responsesContext'
import { DESIGN, alignRects, boundsOf, distributeRects, ensureFrames, getFrame, resizeRect, snapMove } from '../data/canvasLayout'

function ToolButton({ label, icon: Icon, onClick, disabled }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}><Icon size={15} /></button>
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function CanvasEditor({ planning, device, selection, setSelection, api, animate, canvasApiRef, onGesture }) {
  const stageRef = useRef(null)
  const pageRef = useRef(null)
  const [stageWidth, setStageWidth] = useState(900)
  const [zoomMode, setZoomMode] = useState('fit')
  const [manualZoom, setManualZoom] = useState(1)
  const [snapOn, setSnapOn] = useState(true)
  const [guides, setGuides] = useState([])
  const [marquee, setMarquee] = useState(null)
  const [hud, setHud] = useState(null)
  const responses = useResponsesStore({ callKey: 'editor', persist: false })

  const width = Number(planning.canvas?.[device]?.width) || DESIGN[device].width
  const fit = clamp((stageWidth - 56) / width, 0.2, 2)
  const zoom = zoomMode === 'fit' ? fit : manualZoom
  const zoomRef = useRef(zoom)
  useEffect(() => { zoomRef.current = zoom })
  const blocks = useMemo(() => ensureFrames(planning.blocks, device, width), [planning.blocks, device, width])
  const latest = useRef({ blocks, selection, api, snapOn, device })
  useEffect(() => { latest.current = { blocks, selection, api, snapOn, device } })

  useEffect(() => {
    const el = stageRef.current
    const observer = new ResizeObserver(([entry]) => setStageWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Ctrl + roda do mouse dá zoom
  useEffect(() => {
    const el = stageRef.current
    const onWheel = event => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      setManualZoom(clamp(zoomRef.current * (event.deltaY < 0 ? 1.1 : 0.9), 0.2, 2.5))
      setZoomMode('manual')
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const toDesign = useCallback((clientX, clientY) => {
    const r = pageRef.current.getBoundingClientRect()
    return { x: (clientX - r.left) / zoomRef.current, y: (clientY - r.top) / zoomRef.current }
  }, [])

  // Ponte para o arrastar-da-biblioteca (fica no Admin): converte o ponteiro em coordenadas da prancheta.
  useEffect(() => {
    canvasApiRef.current = {
      stage: () => stageRef.current,
      zoom: () => zoomRef.current,
      pointToDesign: (x, y) => {
        const s = stageRef.current.getBoundingClientRect()
        if (x < s.left || x > s.right || y < s.top || y > s.bottom) return null
        return toDesign(x, y)
      },
    }
    return () => { canvasApiRef.current = null }
  }, [canvasApiRef, toDesign])

  const measure = useCallback(id => {
    const el = pageRef.current?.querySelector(`[data-block-id="${CSS.escape(id)}"]`)
    const block = latest.current.blocks.find(b => b.id === id)
    const f = getFrame(block, latest.current.device) || { x: 0, y: 0, w: 400 }
    return { id, x: f.x, y: f.y, w: f.w, h: el ? el.offsetHeight : f.h || 80, rot: f.rot || 0, type: block.type, hasH: Boolean(f.h) }
  }, [])

  const artboardSizeNow = () => ({ width, height: pageRef.current ? pageRef.current.offsetHeight : 900 })

  /* ---------- gestos ---------- */
  const track = (move, up) => {
    const stop = e => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); up?.(e) }
    const end = e => stop(e)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const startMove = (event, id) => {
    const { selection: current, api: a, snapOn: snap, device: dev } = latest.current
    if (event.shiftKey || event.metaKey || event.ctrlKey) { setSelection(current.includes(id) ? current.filter(x => x !== id) : [...current, id]); return }
    const wasSelected = current.includes(id)
    const ids = wasSelected ? current : [id]
    if (!wasSelected) setSelection([id])
    const start = toDesign(event.clientX, event.clientY)
    const rects = ids.map(measure)
    const others = latest.current.blocks.filter(b => !ids.includes(b.id)).map(b => measure(b.id))
    const group = boundsOf(rects)
    const board = artboardSizeNow()
    let moved = false
    track(e => {
      const p = toDesign(e.clientX, e.clientY)
      let dx = p.x - start.x
      let dy = p.y - start.y
      if (!moved && Math.hypot(dx * zoomRef.current, dy * zoomRef.current) < 4) return
      if (!moved) { moved = true; window.getSelection()?.removeAllRanges(); document.activeElement?.blur?.() }
      if (snap && !e.altKey) {
        const s = snapMove({ x: group.x + dx, y: group.y + dy, w: group.w, h: group.h }, others, board, 6 / zoomRef.current)
        dx += s.dx; dy += s.dy
        setGuides(s.guides)
      } else setGuides([])
      setHud({ x: e.clientX, y: e.clientY, text: `X ${Math.round(group.x + dx)} · Y ${Math.round(group.y + dy)}` })
      a.setFrames(Object.fromEntries(rects.map(r => [r.id, { x: Math.round(r.x + dx), y: Math.round(r.y + dy) }])), dev, 'move')
    }, e => {
      setGuides([]); setHud(null)
      if (!moved && wasSelected && ids.length === 1) onGesture.editAt(id, e.clientX, e.clientY)
    })
  }

  const startResize = (event, id, handle) => {
    const { api: a, snapOn: snap, device: dev } = latest.current
    const r0 = measure(id)
    const start = toDesign(event.clientX, event.clientY)
    const others = latest.current.blocks.filter(b => b.id !== id).map(b => measure(b.id))
    const board = artboardSizeNow()
    const rad = r0.rot * Math.PI / 180
    const keep = event.shiftKey || (r0.type === 'image' && handle.length === 2)
    track(e => {
      const p = toDesign(e.clientX, e.clientY)
      const dx = p.x - start.x
      const dy = p.y - start.y
      const ldx = dx * Math.cos(rad) + dy * Math.sin(rad)
      const ldy = -dx * Math.sin(rad) + dy * Math.cos(rad)
      let next = resizeRect(r0, handle, ldx, ldy, { keepAspect: keep || e.shiftKey })
      const gs = []
      if (snap && !e.altKey && !r0.rot) {
        const thr = 6 / zoomRef.current
        const xs = [0, board.width / 2, board.width, ...others.flatMap(o => [o.x, o.x + o.w / 2, o.x + o.w])]
        const ys = [0, ...others.flatMap(o => [o.y, o.y + o.h / 2, o.y + o.h])]
        const near = (v, list) => list.reduce((best, t) => (Math.abs(t - v) <= thr && (best === null || Math.abs(t - v) < Math.abs(best - v)) ? t : best), null)
        if (handle.includes('e')) { const t = near(next.x + next.w, xs); if (t !== null) { next.w = Math.round(t - next.x); gs.push({ axis: 'x', pos: t }) } }
        if (handle.includes('w')) { const t = near(next.x, xs); if (t !== null) { next.w += next.x - t; next.x = Math.round(t); gs.push({ axis: 'x', pos: t }) } }
        if (handle.includes('s')) { const t = near(next.y + next.h, ys); if (t !== null) { next.h = Math.round(t - next.y); gs.push({ axis: 'y', pos: t }) } }
        if (handle.includes('n')) { const t = near(next.y, ys); if (t !== null) { next.h += next.y - t; next.y = Math.round(t); gs.push({ axis: 'y', pos: t }) } }
      }
      setGuides(gs)
      setHud({ x: e.clientX, y: e.clientY, text: `${Math.round(next.w)} × ${Math.round(next.h)}` })
      const patch = { x: next.x, y: next.y, w: next.w }
      if (handle.includes('n') || handle.includes('s') || r0.hasH) patch.h = next.h
      a.setFrames({ [id]: patch }, dev, 'resize')
    }, () => { setGuides([]); setHud(null) })
  }

  const startRotate = (event, id) => {
    const { api: a, device: dev } = latest.current
    const el = pageRef.current.querySelector(`[data-block-id="${CSS.escape(id)}"]`)
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    track(e => {
      let angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90
      if (angle > 180) angle -= 360
      angle = Math.round(angle)
      const snapped = Math.round(angle / 15) * 15
      if (!e.altKey && Math.abs(angle - snapped) <= 4) angle = snapped
      setHud({ x: e.clientX, y: e.clientY, text: `${angle}°` })
      a.setFrames({ [id]: { rot: angle } }, dev, 'rotate')
    }, () => setHud(null))
  }

  const startMarquee = event => {
    const base = event.shiftKey ? latest.current.selection : []
    if (!event.shiftKey) setSelection([])
    const start = toDesign(event.clientX, event.clientY)
    const rects = latest.current.blocks.map(b => measure(b.id))
    let moved = false
    track(e => {
      const p = toDesign(e.clientX, e.clientY)
      if (!moved && Math.hypot(p.x - start.x, p.y - start.y) * zoomRef.current < 4) return
      moved = true
      const box = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) }
      setMarquee(box)
      const hit = rects.filter(r => r.x < box.x + box.w && r.x + r.w > box.x && r.y < box.y + box.h && r.y + r.h > box.y).map(r => r.id)
      setSelection([...new Set([...base, ...hit])])
    }, () => setMarquee(null))
  }

  const onPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return
    const target = event.target
    if (target.closest?.('.inline-edit') && target.closest('.inline-edit') === document.activeElement) return
    if (document.activeElement && document.activeElement !== document.body && !document.activeElement.classList?.contains('inline-edit')) document.activeElement.blur() // devolve o teclado ao canvas
    const handle = target.closest?.('[data-handle]')
    const blockEl = target.closest?.('[data-block-id]')
    if (handle && blockEl) { event.preventDefault(); const id = blockEl.dataset.blockId; handle.dataset.handle === 'rot' ? startRotate(event, id) : startResize(event, id, handle.dataset.handle); return }
    if (blockEl) { event.preventDefault(); startMove(event, blockEl.dataset.blockId); return }
    if (target.closest?.('.canvas-stage')) { event.preventDefault(); startMarquee(event) }
  }

  const editing = useMemo(() => ({ canvas: true, selection, animate, onProps: api.setProps, onSelect: id => setSelection(id ? [id] : []) }), [selection, animate, api.setProps, setSelection])

  /* ---------- barra de ferramentas do canvas ---------- */
  const rectsOfSelection = () => selection.map(measure)
  const board = () => ({ width, height: pageRef.current?.offsetHeight || 900 })
  const align = mode => { if (selection.length) api.setFrames(alignRects(rectsOfSelection(), mode, board()), device, 'align') }
  const distribute = axis => api.setFrames(distributeRects(rectsOfSelection(), axis), device, 'distribute')
  const zoomBy = factor => { setManualZoom(clamp(zoom * factor, 0.2, 2.5)); setZoomMode('manual') }

  return <div className="canvas-editor">
    <div className="canvas-tools" role="toolbar" aria-label="Ferramentas do canvas">
      <div className="qb-group">
        <ToolButton label="Diminuir zoom" icon={Minus} onClick={() => zoomBy(0.87)} />
        <output aria-label="Zoom">{Math.round(zoom * 100)}%</output>
        <ToolButton label="Aumentar zoom" icon={Plus} onClick={() => zoomBy(1.15)} />
        <button type="button" className={zoomMode === 'fit' ? 'active' : ''} onClick={() => setZoomMode('fit')} title="Ajustar à largura"><Scan size={15} />Ajustar</button>
        <button type="button" onClick={() => { setManualZoom(1); setZoomMode('manual') }} title="Tamanho real">100%</button>
      </div>
      <div className="qb-group" role="group" aria-label="Alinhar">
        <ToolButton label="Alinhar à esquerda" icon={AlignStartVertical} onClick={() => align('left')} disabled={!selection.length} />
        <ToolButton label="Centralizar na horizontal" icon={AlignCenterVertical} onClick={() => align('center')} disabled={!selection.length} />
        <ToolButton label="Alinhar à direita" icon={AlignEndVertical} onClick={() => align('right')} disabled={!selection.length} />
        <ToolButton label="Alinhar ao topo" icon={AlignStartHorizontal} onClick={() => align('top')} disabled={!selection.length} />
        <ToolButton label="Centralizar na vertical" icon={AlignCenterHorizontal} onClick={() => align('middle')} disabled={!selection.length} />
        <ToolButton label="Alinhar à base" icon={AlignEndHorizontal} onClick={() => align('bottom')} disabled={!selection.length} />
        <ToolButton label="Distribuir na horizontal" icon={AlignHorizontalSpaceAround} onClick={() => distribute('x')} disabled={selection.length < 3} />
        <ToolButton label="Distribuir na vertical" icon={AlignVerticalSpaceAround} onClick={() => distribute('y')} disabled={selection.length < 3} />
      </div>
      <div className="qb-group" role="group" aria-label="Camadas">
        <ToolButton label="Trazer para a frente" icon={ChevronsUp} onClick={() => api.zOrder(selection, 'front')} disabled={!selection.length} />
        <ToolButton label="Enviar para trás" icon={ChevronsDown} onClick={() => api.zOrder(selection, 'back')} disabled={!selection.length} />
        <button type="button" aria-pressed={snapOn} title="Ímã de alinhamento (Alt segura para desligar)" onClick={() => setSnapOn(value => !value)}><Magnet size={15} />Ímã</button>
      </div>
      <span className="canvas-count" role="status">{selection.length > 1 ? `${selection.length} selecionados` : ''}</span>
    </div>
    <div className="canvas-stage is-editing" ref={stageRef} onPointerDown={onPointerDown} onDoubleClick={event => { const el = event.target.closest?.('[data-block-id]'); if (el) onGesture.editAt(el.dataset.blockId, event.clientX, event.clientY) }}>
      <ResponsesContext.Provider value={responses}>
        <EditingContext.Provider value={editing}>
          <div className="canvas-board" style={{ width: width * zoom }}>
            <CanvasArtboard planning={{ ...planning, blocks }} device={device} scale={zoom} artboardRef={pageRef} paper={pageStyle(planning)} background={<div className="cv-bg"><PageBackground planning={planning} motion={false} /></div>} extra={<>
              {guides.map((g, i) => <i key={i} className={`cv-guide ${g.axis}`} style={g.axis === 'x' ? { left: g.pos } : { top: g.pos }} />)}
              {marquee && <i className="cv-marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
            </>} />
          </div>
        </EditingContext.Provider>
      </ResponsesContext.Provider>
    </div>
    {hud && <div className="canvas-hud" style={{ left: hud.x, top: hud.y }}>{hud.text}</div>}
  </div>
}

