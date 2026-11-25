import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import StickerArt from './StickerArt'
import { STICKERS, stickerLabel, stickerSize } from '../data/stickerKinds'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const percentIn = (el, clientX, clientY) => {
  const rect = el.getBoundingClientRect()
  return { x: clamp(((clientX - rect.left) / rect.width) * 100, 2, 98), y: clamp(((clientY - rect.top) / rect.height) * 100, 2, 98) }
}
const pageUnder = (clientX, clientY) => document.elementFromPoint(clientX, clientY)?.closest('[data-sticker-page]')
const tilt = () => Math.round(Math.random() * 20 - 10)
const corner = () => ({ x: 72 + Math.random() * 16, y: 12 + Math.random() * 14 })
const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const normalize = angle => { let a = angle % 360; if (a > 180) a -= 360; if (a < -180) a += 360; return Math.round(a) }

// Um adesivo colado. Arrastar move (ele "descola" e sobe um pouco); tocar seleciona;
// a alça do canto gira e muda o tamanho num gesto só; o × descola e tira.
function PlacedSticker({ sticker, selected, fresh, still, onSelect, onChange, onRemove }) {
  const [live, setLive] = useState(null)
  const [peeling, setPeeling] = useState(false)
  const gesture = useRef(null)
  const size = stickerSize(sticker.kind)
  const view = { ...sticker, ...live }

  const startMove = event => {
    if (still || event.button > 0) return
    event.stopPropagation(); event.preventDefault()
    const host = event.currentTarget.closest('[data-sticker-page]')
    if (!host) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    gesture.current = { kind: 'move', host, startX: event.clientX, startY: event.clientY, moved: false }
  }
  const startHandle = event => {
    event.stopPropagation(); event.preventDefault()
    const box = event.currentTarget.closest('.bk-sticker').getBoundingClientRect()
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2
    event.currentTarget.setPointerCapture?.(event.pointerId)
    gesture.current = { kind: 'turn', cx, cy, angle0: Math.atan2(event.clientY - cy, event.clientX - cx), dist0: Math.hypot(event.clientX - cx, event.clientY - cy), rotation0: sticker.rotation, scale0: sticker.scale }
  }
  const onMove = event => {
    const g = gesture.current
    if (!g) return
    if (g.kind === 'move') {
      if (!g.moved && Math.hypot(event.clientX - g.startX, event.clientY - g.startY) < 4) return
      g.moved = true
      setLive({ ...percentIn(g.host, event.clientX, event.clientY), lifting: true })
    } else {
      const angle = Math.atan2(event.clientY - g.cy, event.clientX - g.cx)
      const dist = Math.hypot(event.clientX - g.cx, event.clientY - g.cy)
      setLive({ rotation: normalize(g.rotation0 + ((angle - g.angle0) * 180) / Math.PI), scale: clamp(g.scale0 * (dist / Math.max(g.dist0, 1)), 0.5, 2.5), turning: true })
    }
  }
  const onUp = () => {
    const g = gesture.current
    gesture.current = null
    if (!g) return
    if (g.kind === 'move' && !g.moved) { onSelect(selected ? null : sticker.id); return }
    if (live) {
      const patch = g.kind === 'move' ? { x: live.x, y: live.y } : { rotation: live.rotation, scale: Math.round(live.scale * 100) / 100 }
      onChange(sticker, patch)
    }
    setLive(null)
  }
  const peel = () => {
    if (reduce()) { onRemove(sticker); return }
    setPeeling(true)
    window.setTimeout(() => onRemove(sticker), 420)
  }

  const classes = ['bk-sticker', selected && !still && 'is-selected', live?.lifting && 'is-lifting', live?.turning && 'is-turning', fresh && 'is-fresh', peeling && 'is-peeling'].filter(Boolean).join(' ')
  return <div className={classes} style={{ left: `${view.x}%`, top: `${view.y}%`, width: size * view.scale, height: size * view.scale, '--r': `${view.rotation}deg` }}>
    <div className="bk-sticker-body">
      <button type="button" className="bk-sticker-art" tabIndex={still ? -1 : 0} aria-label={`Adesivo ${stickerLabel(sticker.kind)}`} aria-pressed={selected} onPointerDown={startMove} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { gesture.current = null; setLive(null) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(selected ? null : sticker.id) } }}>
        <StickerArt kind={sticker.kind} />
      </button>
      {selected && !still && <>
        <span className="bk-sticker-frame" aria-hidden="true" />
        <button type="button" className="bk-sticker-remove" aria-label="Tirar adesivo" onClick={peel}>×</button>
        <button type="button" className="bk-sticker-handle" aria-label="Girar e mudar o tamanho (arraste)" onPointerDown={startHandle} onPointerMove={onMove} onPointerUp={onUp} onKeyDown={event => {
          const step = { ArrowLeft: { rotation: -10 }, ArrowRight: { rotation: 10 }, ArrowUp: { scale: 0.1 }, ArrowDown: { scale: -0.1 } }[event.key]
          if (!step) return
          event.preventDefault()
          onChange(sticker, { rotation: normalize(sticker.rotation + (step.rotation || 0)), scale: clamp(sticker.scale + (step.scale || 0), 0.5, 2.5) })
        }}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.5 6.5A5 5 0 1 0 13 10M13 3v3.6H9.4" /></svg></button>
      </>}
    </div>
  </div>
}

export function StickerLayer({ page, stickers, selected, fresh, onSelect, onChange, onRemove, still = false }) {
  const list = stickers.filter(sticker => sticker.page === page)
  if (!list.length) return null
  return <div className="bk-sticker-layer">
    {list.map(sticker => <PlacedSticker key={sticker.id} sticker={sticker} selected={selected === sticker.id} fresh={fresh === sticker.id} still={still} onSelect={onSelect} onChange={onChange} onRemove={onRemove} />)}
  </div>
}

// A cartela: uma folha de adesivos de verdade. Puxe um adesivo e solte numa página.
// Enquanto você arrasta, ele inclina para o lado do movimento; fora da página, volta para a cartela.
export function StickerSheet({ onPlace, onClose }) {
  const [held, setHeld] = useState(null)
  const ghost = useRef(null)
  const state = useRef(null)
  const frame = useRef(0)

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.cancelAnimationFrame(frame.current) }
  }, [onClose])

  // Segue o dedo com um leve atraso (mola) e inclina conforme a velocidade.
  const tick = () => {
    const s = state.current
    const el = ghost.current
    if (!s) return
    if (!el) { frame.current = window.requestAnimationFrame(tick); return }
    const dx = s.tx - s.x, dy = s.ty - s.y
    s.x += dx * 0.32; s.y += dy * 0.32
    s.lean += (clamp(dx * 0.9, -22, 22) - s.lean) * 0.2
    el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) rotate(${s.rotation + s.lean}deg) scale(1.14)`
    el.style.opacity = '1'
    frame.current = window.requestAnimationFrame(tick)
  }

  const start = (event, kind) => {
    if (event.button > 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    document.body.classList.add('bk-dragging')
    const box = event.currentTarget.getBoundingClientRect()
    state.current = { kind, x: box.left + box.width / 2, y: box.top + box.height / 2, tx: event.clientX, ty: event.clientY, startX: event.clientX, startY: event.clientY, home: { x: box.left + box.width / 2, y: box.top + box.height / 2 }, rotation: tilt(), lean: 0, moved: false }
  }
  const move = event => {
    const s = state.current
    if (!s) return
    s.tx = event.clientX; s.ty = event.clientY
    if (!s.moved && Math.hypot(event.clientX - s.startX, event.clientY - s.startY) > 6) {
      s.moved = true
      setHeld(s.kind)
      window.cancelAnimationFrame(frame.current)
      frame.current = window.requestAnimationFrame(tick)
    }
  }
  const end = event => {
    const s = state.current
    state.current = null
    window.cancelAnimationFrame(frame.current)
    document.body.classList.remove('bk-dragging')
    if (!s) return
    if (!s.moved) { placeDefault(s.kind); return }
    const host = pageUnder(event.clientX, event.clientY)
    if (host) { setHeld(null); onPlace({ kind: s.kind, page: host.dataset.stickerPage, ...percentIn(host, event.clientX, event.clientY), rotation: s.rotation, scale: 1 }); return }
    // fora da página: volta para o lugar dele na cartela
    const el = ghost.current
    if (el && !reduce()) {
      el.style.transition = 'transform .45s cubic-bezier(.22,1,.36,1), opacity .45s'
      el.style.transform = `translate(${s.home.x}px, ${s.home.y}px) translate(-50%, -50%) rotate(0deg) scale(.9)`
      el.style.opacity = '0'
      window.setTimeout(() => setHeld(null), 450)
    } else setHeld(null)
  }
  const placeDefault = kind => {
    const host = document.querySelector('[data-sticker-page]')
    if (!host) return
    onPlace({ kind, page: host.dataset.stickerPage, ...corner(), rotation: tilt(), scale: 1 })
  }

  // Fora do painel da página (que tem transform), para o position: fixed valer para a tela toda.
  return createPortal(<div className="bk">
    <div className="bk-sheet" role="dialog" aria-label="Cartela de adesivos">
      <div className="bk-sheet-head"><span><b>Cartela nº 1</b> · arraste um adesivo até a página</span><button type="button" className="bk-text-button" onClick={onClose}>Guardar cartela</button></div>
      <ul className="bk-sheet-grid">{STICKERS.map((sticker, index) => <li key={sticker.kind} style={{ '--i': index }} className={held === sticker.kind ? 'is-held' : ''}>
        <button type="button" aria-label={`Colar adesivo ${sticker.label}`} onPointerDown={event => start(event, sticker.kind)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { state.current = null; window.cancelAnimationFrame(frame.current); setHeld(null) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); placeDefault(sticker.kind) } }}>
          <StickerArt kind={sticker.kind} />
        </button>
      </li>)}</ul>
    </div>
    {held && <div ref={ghost} className="bk-sticker-ghost" style={{ width: stickerSize(held) * 1.05, height: stickerSize(held) * 1.05 }} aria-hidden="true"><StickerArt kind={held} /></div>}
  </div>, document.body)
}
