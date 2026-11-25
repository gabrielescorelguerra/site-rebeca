import { useEffect, useRef, useState } from 'react'
import StickerArt from './StickerArt'
import { STICKER_KINDS, stickerLabel } from '../data/stickerKinds'

const percentIn = (el, clientX, clientY) => {
  const rect = el.getBoundingClientRect()
  return { x: Math.min(97, Math.max(3, ((clientX - rect.left) / rect.width) * 100)), y: Math.min(98, Math.max(2, ((clientY - rect.top) / rect.height) * 100)) }
}
const pageUnder = (clientX, clientY) => document.elementFromPoint(clientX, clientY)?.closest('[data-sticker-page]')
const tilt = () => Math.round(Math.random() * 24 - 12)
const corner = () => ({ x: 70 + Math.random() * 20, y: 10 + Math.random() * 20 })

// Adesivos colados numa página. Arrastar move; tocar seleciona e mostra girar e tirar.
export function StickerLayer({ page, stickers, selected, onSelect, onMove, onRotate, onRemove, still = false }) {
  const [drag, setDrag] = useState(null)
  const list = stickers.filter(sticker => sticker.page === page)
  if (!list.length) return null

  const start = (event, sticker) => {
    if (still || event.button > 0) return
    event.stopPropagation(); event.preventDefault()
    const host = event.currentTarget.closest('[data-sticker-page]')
    if (!host) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrag({ id: sticker.id, host, startX: event.clientX, startY: event.clientY, x: sticker.x, y: sticker.y, moved: false })
  }
  const move = event => {
    if (!drag) return
    const moved = drag.moved || Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4
    if (!moved) return
    const point = percentIn(drag.host, event.clientX, event.clientY)
    setDrag({ ...drag, ...point, moved })
  }
  const end = sticker => {
    if (!drag) return
    if (drag.moved) onMove(sticker, { x: drag.x, y: drag.y }); else onSelect(selected === sticker.id ? null : sticker.id)
    setDrag(null)
  }

  return <div className="bk-sticker-layer">
    {list.map(sticker => {
      const live = drag?.id === sticker.id && drag.moved ? drag : sticker
      const isOn = selected === sticker.id && !still
      return <div key={sticker.id} className={`bk-sticker ${isOn ? 'is-selected' : ''} ${drag?.id === sticker.id && drag.moved ? 'is-dragging' : ''}`} style={{ left: `${live.x}%`, top: `${live.y}%`, '--r': `${sticker.rotation}deg` }}>
        <button type="button" className="bk-sticker-art" tabIndex={still ? -1 : 0} aria-label={`Adesivo ${stickerLabel(sticker.kind)}`} aria-pressed={isOn} onPointerDown={event => start(event, sticker)} onPointerMove={move} onPointerUp={() => end(sticker)} onPointerCancel={() => setDrag(null)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(isOn ? null : sticker.id) } }}>
          <StickerArt kind={sticker.kind} />
        </button>
        {isOn && <div className="bk-sticker-tools">
          <button type="button" aria-label="Girar adesivo" onClick={() => onRotate(sticker)}>↻</button>
          <button type="button" aria-label="Tirar adesivo" onClick={() => onRemove(sticker)}>×</button>
        </div>}
      </div>
    })}
  </div>
}

// Cartela de adesivos: arraste um para a página (ou toque para colar no meio da primeira página).
export function StickerSheet({ onPlace, onClose }) {
  const [ghost, setGhost] = useState(null)
  const ghostRef = useRef(null)

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const start = (event, kind) => {
    if (event.button > 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const next = { kind, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, rotation: tilt(), moved: false }
    ghostRef.current = next; setGhost(next)
  }
  const move = event => {
    const current = ghostRef.current
    if (!current) return
    const next = { ...current, x: event.clientX, y: event.clientY, moved: current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 6 }
    ghostRef.current = next; setGhost(next)
  }
  const end = () => {
    const current = ghostRef.current
    ghostRef.current = null; setGhost(null)
    if (!current) return
    if (!current.moved) { placeDefault(current.kind); return }
    const host = pageUnder(current.x, current.y)
    if (host) onPlace({ kind: current.kind, page: host.dataset.stickerPage, ...percentIn(host, current.x, current.y), rotation: current.rotation })
  }
  const placeDefault = kind => {
    const host = document.querySelector('[data-sticker-page="algum-dia"]')
    if (!host) return
    onPlace({ kind, page: 'algum-dia', ...corner(), rotation: tilt() })
  }

  return <>
    <div className="bk-sheet" role="dialog" aria-label="Cartela de adesivos">
      <div className="bk-sheet-head"><span>Arraste um adesivo para a página</span><button type="button" className="bk-text-button" onClick={onClose}>Guardar cartela</button></div>
      <ul>{STICKER_KINDS.map(kind => <li key={kind}>
        <button type="button" aria-label={`Colar adesivo ${stickerLabel(kind)}`} onPointerDown={event => start(event, kind)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => setGhost(null)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); placeDefault(kind) } }}>
          <StickerArt kind={kind} />
        </button>
      </li>)}</ul>
    </div>
    {ghost?.moved && <div className="bk-sticker-ghost" style={{ left: ghost.x, top: ghost.y, '--r': `${ghost.rotation}deg` }} aria-hidden="true"><StickerArt kind={ghost.kind} /></div>}
  </>
}
