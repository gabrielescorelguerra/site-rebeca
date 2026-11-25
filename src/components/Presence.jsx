import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAccess } from '../lib/access'
import { HELLO_INTERVAL, MOVE_INTERVAL, PALETTE, cleanName, fromWire, isCursorVisible, isFresh, prune, readProfile, readableOn, saveProfile, toWire, validColor } from '../lib/presence'
import '../styles/presence.css'

const CHANNEL = 'site-cursors-v1'

function Cursor({ peer, viewport, now }) {
  const { left, top } = fromWire(peer, viewport.width, viewport.scrollY)
  const idle = now - peer.moved > 8000 && peer.kind !== 'touch'
  return <div className={`presence-cursor ${peer.kind === 'touch' ? 'is-touch' : ''} ${idle ? 'is-idle' : ''} ${left > viewport.width - 150 ? 'is-flip' : ''}`} style={{ transform: `translate3d(${left}px, ${top}px, 0)`, '--c': peer.color, '--on': readableOn(peer.color) }}>
    {peer.kind === 'touch' ? <span className="presence-ring" /> : <svg className="presence-arrow" viewBox="0 0 20 22" width="18" height="20"><path d="M2 1.5l15 8.2-6.6 1.8-2.6 6.4z" fill="var(--c)" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>}
    <span className="presence-label">{peer.name}</span>
  </div>
}

function Chip({ profile, onChange, others }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const esc = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  const names = others.slice(0, 2).map(peer => peer.name).join(' e ')
  return <div className="presence-chip" ref={rootRef}>
    <button type="button" className="presence-chip-button" aria-expanded={open} aria-controls="presence-panel" onClick={() => setOpen(value => !value)}>
      <i style={{ background: profile.color }} aria-hidden="true" />
      <span>{profile.name}</span>
      {others.length > 0 && <em>com {names}{others.length > 2 ? ` +${others.length - 2}` : ''}</em>}
    </button>
    {open && <div className="presence-panel" id="presence-panel" role="dialog" aria-label="Seu cursor">
      <label>Seu nome<input value={profile.name} maxLength={18} onChange={event => onChange({ ...profile, name: event.target.value })} onBlur={() => onChange({ ...profile, name: cleanName(profile.name) || 'Eu' })} /></label>
      <div className="presence-swatches" role="radiogroup" aria-label="Cor do cursor">
        {PALETTE.map(color => <button key={color} type="button" role="radio" aria-checked={profile.color === color} aria-label={`Cor ${color}`} style={{ background: color }} onClick={() => onChange({ ...profile, color })} />)}
        <label className="presence-custom" title="Outra cor"><input type="color" value={profile.color} onChange={event => validColor(event.target.value) && onChange({ ...profile, color: event.target.value })} /><span aria-hidden="true">+</span><span className="sr-only">Escolher outra cor</span></label>
      </div>
      <p>Quem estiver na mesma página vê seu cursor com esse nome e essa cor.</p>
    </div>}
  </div>
}

function PresenceLive({ role }) {
  const location = useLocation()
  const path = location.pathname + (location.search.includes('aba=lista') ? '?aba=lista' : '')
  const [id] = useState(() => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())))
  const [profile, setProfile] = useState(() => readProfile(role, window.localStorage))
  const [peers, setPeers] = useState({})
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, scrollY: window.scrollY }))
  const [now, setNow] = useState(() => Date.now())
  const channelRef = useRef(null)
  const live = useRef({ profile, path, kind: 'mouse' })
  const hello = useRef(() => {})

  useEffect(() => { live.current.profile = profile; live.current.path = path; hello.current() }, [profile, path])
  const update = useCallback(next => { setProfile(next); saveProfile(role, { ...next, name: next.name }, window.localStorage) }, [role])

  useEffect(() => {
    const channel = supabase.channel(CHANNEL, { config: { broadcast: { self: false } } })
    channelRef.current = channel
    let ready = false
    const send = (event, payload) => { if (ready) channel.send({ type: 'broadcast', event, payload }).catch(() => {}) }
    const sayHello = () => send('hi', { id, name: cleanName(live.current.profile.name) || 'Eu', color: live.current.profile.color, path: live.current.path })
    hello.current = sayHello

    channel.on('broadcast', { event: 'hi' }, ({ payload }) => {
      if (!payload?.id || payload.id === id || !validColor(payload.color)) return
      const stamp = Date.now()
      setPeers(current => {
        const known = current[payload.id]
        if (!known) window.setTimeout(sayHello, 50 + Math.random() * 200)
        return { ...current, [payload.id]: { ...known, id: payload.id, name: cleanName(payload.name) || 'Alguém', color: payload.color, path: String(payload.path || ''), seen: stamp, kind: known?.kind || 'mouse', moved: known?.moved || 0 } }
      })
    })
    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      if (!payload?.id || payload.id === id || !Number.isFinite(payload.x) || !Number.isFinite(payload.y)) return
      const stamp = Date.now()
      setPeers(current => current[payload.id] ? { ...current, [payload.id]: { ...current[payload.id], path: String(payload.path || current[payload.id].path), x: payload.x, y: payload.y, kind: payload.kind === 'touch' ? 'touch' : 'mouse', seen: stamp, moved: stamp } } : current)
    })
    channel.on('broadcast', { event: 'bye' }, ({ payload }) => setPeers(current => { if (!current[payload?.id]) return current; const { [payload.id]: gone, ...rest } = current; void gone; return rest }))
    channel.subscribe(status => { if (status === 'SUBSCRIBED') { ready = true; sayHello() } })

    // envio do ponteiro, no máximo ~8 vezes por segundo
    let last = 0; let timer = null; let pending = null; let pointer = null
    const flush = () => { timer = null; if (!pending) return; send('move', { id, path: live.current.path, ...pending }); pending = null; last = performance.now() }
    const queue = (clientX, clientY, kind) => {
      pointer = { clientX, clientY, kind }
      pending = { ...toWire(clientX, clientY, window.scrollY, window.innerWidth), kind }
      const wait = MOVE_INTERVAL - (performance.now() - last)
      if (wait <= 0) flush(); else if (!timer) timer = window.setTimeout(flush, wait)
    }
    const onPointer = event => queue(event.clientX, event.clientY, event.pointerType === 'touch' ? 'touch' : 'mouse')
    const onTouch = event => { const touch = event.touches[0]; if (touch) queue(touch.clientX, touch.clientY, 'touch') }
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => { frame = 0; setViewport({ width: window.innerWidth, scrollY: window.scrollY }); if (pointer) queue(pointer.clientX, pointer.clientY, pointer.kind) })
    }
    const onResize = () => setViewport({ width: window.innerWidth, scrollY: window.scrollY })
    const bye = () => send('bye', { id })
    const onVisibility = () => { if (document.visibilityState === 'hidden') bye(); else sayHello() }
    window.addEventListener('pointermove', onPointer, { passive: true }); window.addEventListener('pointerdown', onPointer, { passive: true })
    window.addEventListener('touchstart', onTouch, { passive: true }); window.addEventListener('touchmove', onTouch, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onResize)
    window.addEventListener('pagehide', bye); document.addEventListener('visibilitychange', onVisibility)
    const helloTimer = window.setInterval(() => { if (document.visibilityState === 'visible') sayHello() }, HELLO_INTERVAL)
    const tick = window.setInterval(() => { const stamp = Date.now(); setNow(stamp); setPeers(current => prune(current, stamp)) }, 1000)
    return () => {
      bye(); ready = false
      window.clearTimeout(timer); window.clearInterval(helloTimer); window.clearInterval(tick); window.cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointer); window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('touchstart', onTouch); window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize)
      window.removeEventListener('pagehide', bye); document.removeEventListener('visibilitychange', onVisibility)
      hello.current = () => {}
      supabase.removeChannel(channel); channelRef.current = null
    }
  }, [id])

  const others = Object.values(peers).filter(peer => isFresh(peer, now))
  const visible = others.filter(peer => isCursorVisible(peer, now, path))
  const showChip = !['/admin', '/autenticacao'].includes(location.pathname)
  return <>
    <div className="presence-layer" aria-hidden="true">{visible.map(peer => <Cursor key={peer.id} peer={peer} viewport={viewport} now={now} />)}</div>
    {showChip && <Chip profile={profile} onChange={update} others={others} />}
  </>
}

// Só para quem está logado de verdade (o modo de teste não aparece para a outra pessoa).
export default function Presence() {
  const { authenticated, admin, testing } = useAccess()
  if (!supabase || !authenticated || testing) return null
  return <PresenceLive key={admin ? 'admin' : 'user'} role={admin ? 'admin' : 'user'} />
}
