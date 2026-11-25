import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { addItem, listItems, removeItem, updateItem } from '../data/bucketList'
import { CATEGORIES, LEVELS, MAX_PHOTOS, categoryOf, counts, fromDateInput, pickIdea, roulettePool, toDateInput } from '../data/bucketIdeas'
import { uploadImage } from '../data/media'
import { addSticker, listStickers, pageKey, removeSticker, updateSticker } from '../data/bucketStickers'
import { StickerLayer, StickerSheet } from './StickerLayer'
import PaperLeaf, { applyLeaf, runLeaf } from './PaperLeaf'
import { loadBookmark, saveBookmark } from '../data/notebook'
import '../styles/bucket.css'

const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '') }
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const yearOf = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d.getFullYear() }
// Posição no ano (0 a 1), para pôr o ponto na régua dos meses.
const yearPosition = value => { const d = new Date(value); if (Number.isNaN(d.getTime())) return 0; const start = new Date(d.getFullYear(), 0, 1); const end = new Date(d.getFullYear() + 1, 0, 1); return Math.min(1, Math.max(0, (d - start) / (end - start))) }
const narrow = () => window.matchMedia?.('(max-width: 860px)').matches
const COVER_KEY = 'caderno-aberto'
const wasOpened = () => { try { return window.sessionStorage.getItem(COVER_KEY) === '1' } catch { return false } }
const rememberOpened = () => { try { window.sessionStorage.setItem(COVER_KEY, '1') } catch { /* sem armazenamento: a capa volta na próxima visita */ } }
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms))

// Recolhe o elemento antes de ele sair da lista (altura vai a zero), para o resto subir com suavidade.
async function collapse(id) {
  const el = document.getElementById(id)
  if (!el || reduceMotion()) return
  el.style.height = `${el.offsetHeight}px`
  void el.offsetHeight
  el.classList.add('is-leaving')
  await wait(400)
}

// Bolinha desenhada à mão (um círculo que não fecha direito) e o visto de caneta.
const Ring = () => <svg viewBox="0 0 28 28" aria-hidden="true"><path className="bk-ring" d="M14.6 3.4c5.6.2 10.2 4.6 9.9 10.4-.3 5.9-5 10.4-10.8 10.2C7.9 23.8 3.6 19.4 3.7 13.6 3.8 8.4 7.7 4 13 3.6c1.5-.1 2.6.1 3.4.6" /><path className="bk-tick" pathLength="1" d="M8 14.6c1.3 1.1 2.6 2.6 3.7 4.3 2.2-4.6 6-9.4 11.8-13.6" /></svg>

function Level({ value, onChange, label = 'Nível' }) {
  return <div className="bk-level" role="radiogroup" aria-label={label}>
    <span className="bk-field-name">{label}</span>
    {LEVELS.map(level => <button key={level.value} type="button" role="radio" aria-checked={value === level.value} aria-label={`${level.value} de 5, ${level.label}`} className={level.value <= value ? 'on' : ''} onClick={() => onChange(level.value)} />)}
    <span className="bk-level-name">{LEVELS.find(level => level.value === value)?.label}</span>
  </div>
}

function PhotoEditor({ photos, onChange, onError }) {
  const [uploading, setUploading] = useState(false)
  const add = async files => {
    const room = MAX_PHOTOS - photos.length
    if (!files.length || room <= 0) return
    setUploading(true)
    try {
      const urls = []
      for (const file of [...files].slice(0, room)) urls.push(await uploadImage(file))
      onChange([...photos, ...urls].slice(0, MAX_PHOTOS))
    } catch (err) { onError(err.message || 'Não foi possível enviar a foto.') } finally { setUploading(false) }
  }
  return <div className="bk-edit-photos">
    {photos.map((url, index) => <span key={url}><img src={url} alt={`Foto ${index + 1}`} /><button type="button" aria-label={`Remover foto ${index + 1}`} onClick={() => onChange(photos.filter(photo => photo !== url))}>×</button></span>)}
    {photos.length < MAX_PHOTOS && <label className="bk-upload">{uploading ? 'Enviando…' : '+ foto'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading} onChange={event => { add(event.target.files); event.target.value = '' }} /></label>}
  </div>
}

// "Fizemos": quando, como foi e fotos, tudo opcional, na própria linha.
function CaptureForm({ item, onSubmit, onCancel, onError }) {
  const [draft, setDraft] = useState({ date: toDateInput(item.doneAt), memory: item.memory, photos: item.photos })
  const [busy, setBusy] = useState(false)
  const set = patch => setDraft(current => ({ ...current, ...patch }))
  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    await onSubmit(item, { done: true, doneAt: fromDateInput(draft.date) || new Date().toISOString(), memory: draft.memory.trim(), photos: draft.photos })
    setBusy(false)
  }
  return <form className="bk-edit bk-capture" onSubmit={submit}>
    <h3 className="bk-name"><span>{item.title}</span></h3>
    <label>Quando<input type="date" required max={toDateInput()} value={draft.date} onChange={event => set({ date: event.target.value })} /></label>
    <label>Como foi?<textarea rows={2} maxLength={1000} autoFocus placeholder="Uma frase para lembrar depois" value={draft.memory} onChange={event => set({ memory: event.target.value })} /></label>
    <PhotoEditor photos={draft.photos} onChange={photos => set({ photos })} onError={onError} />
    <div className="bk-edit-actions">
      <button type="submit" className="bk-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
      <button type="button" className="bk-text-button" onClick={onCancel}>Agora não</button>
    </div>
  </form>
}

function EditForm({ item, onSubmit, onCancel, onRemove, onError }) {
  const [draft, setDraft] = useState({ ...item, date: toDateInput(item.doneAt) })
  const [busy, setBusy] = useState(false)
  const set = patch => setDraft(current => ({ ...current, ...patch }))
  const submit = async event => {
    event.preventDefault()
    if (!draft.title.trim()) { onError('Escreva um título para a ideia.'); return }
    setBusy(true)
    const patch = { title: draft.title.trim(), note: draft.note.trim(), category: draft.category, level: draft.level, memory: draft.memory.trim(), photos: draft.photos }
    if (item.done) patch.doneAt = fromDateInput(draft.date) || item.doneAt
    await onSubmit(item, patch)
    setBusy(false)
  }
  return <form className="bk-edit" onSubmit={submit}>
    <label>Título<input required maxLength={140} value={draft.title} onChange={event => set({ title: event.target.value })} /></label>
    <label>Detalhes<textarea rows={2} maxLength={600} value={draft.note} onChange={event => set({ note: event.target.value })} /></label>
    {item.done && <label>Quando aconteceu<input type="date" required max={toDateInput()} value={draft.date} onChange={event => set({ date: event.target.value })} /></label>}
    <label>Lembrança<textarea rows={2} maxLength={1000} placeholder={item.done ? 'Como foi?' : 'Para escrever depois de fazer'} value={draft.memory} onChange={event => set({ memory: event.target.value })} /></label>
    <label>Categoria<select value={draft.category} onChange={event => set({ category: event.target.value })}>{CATEGORIES.map(category => <option key={category.key} value={category.key}>{category.label}</option>)}</select></label>
    <Level value={draft.level} onChange={level => set({ level })} />
    <PhotoEditor photos={draft.photos} onChange={photos => set({ photos })} onError={onError} />
    <div className="bk-edit-actions">
      <button type="submit" className="bk-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
      <button type="button" className="bk-text-button" onClick={onCancel}>Cancelar</button>
      <button type="button" className="bk-text-button danger" onClick={() => { if (window.confirm(`Excluir “${item.title}”?`)) onRemove(item) }}>Excluir</button>
    </div>
  </form>
}

const Meta = ({ item, who, date }) => <p className="bk-meta">{[date, categoryOf(item.category).label.toLowerCase(), who].filter(Boolean).join(' · ')}</p>

function Idea({ item, index, who, mode, setMode, picked, flash, fx = '', handlers }) {
  const close = () => setMode(null)
  return <li id={`idea-${item.id}`} style={{ '--i': Math.min(index, 8) }} className={`bk-idea ${picked ? 'is-picked' : ''} ${flash ? 'is-flash' : ''} ${mode ? 'is-open' : ''} ${fx}`}>
    {mode === 'capture' ? <CaptureForm item={item} onSubmit={handlers.finish} onCancel={close} onError={handlers.error} />
      : mode === 'edit' ? <EditForm item={item} onSubmit={async (it, patch) => { if (await handlers.save(it.id, patch)) close() }} onCancel={close} onRemove={handlers.remove} onError={handlers.error} />
        : <>
          <button type="button" className="bk-check" aria-label={`Marcar como feita: ${item.title}`} title="Fizemos" onClick={() => setMode({ id: item.id, kind: 'capture' })}><Ring /></button>
          <div className="bk-body">
            <h3 className="bk-name"><span className="bk-ink">{item.title}</span></h3>
            {item.note && <p className="bk-note">{item.note}</p>}
            <Meta item={item} who={who} />
            {item.photos.length > 0 && <ul className="bk-thumbs">{item.photos.map((url, i) => <li key={url}><button type="button" onClick={() => handlers.zoom({ url, item })} aria-label={`Ver foto ${i + 1} de ${item.title}`}><img src={url} alt="" loading="lazy" draggable="false" /></button></li>)}</ul>}
          </div>
          <div className="bk-actions">
            <button type="button" className="bk-edit-link" aria-label={`Editar ${item.title}`} onClick={() => setMode({ id: item.id, kind: 'edit' })}>editar</button>
          </div>
        </>}
  </li>
}

// Uma lembrança: a mesma linha das ideias, com data, frase e a foto pequena à direita.
function Memory({ item, index, who, mode, setMode, arriving, fx = '', handlers }) {
  const [main, ...rest] = item.photos
  return <li id={`memory-${item.id}`} style={{ '--i': Math.min(index, 8) }} className={`bk-idea bk-moment ${arriving ? 'is-arriving' : ''} ${mode ? 'is-open' : ''} ${fx}`}>
    {mode === 'edit' ? <EditForm item={item} onSubmit={async (it, patch) => { if (await handlers.save(it.id, patch)) setMode(null) }} onCancel={() => setMode(null)} onRemove={handlers.remove} onError={handlers.error} /> : <>
      <button type="button" className="bk-check is-done" aria-label={`Desmarcar e voltar para a lista: ${item.title}`} title="Desmarcar" onClick={() => handlers.undo(item)}><Ring /></button>
      <div className="bk-body">
        <h3 className="bk-name"><span className="bk-strike">{item.title}</span></h3>
        <Meta item={item} who={who} date={dateLabel(item.doneAt)} />
        {item.memory && <p className="bk-quote-small">“{item.memory}”</p>}
        {rest.length > 0 && <ul className="bk-thumbs">{rest.map((url, i) => <li key={url}><button type="button" onClick={() => handlers.zoom({ url, item })} aria-label={`Ver foto ${i + 2} de ${item.title}`}><img src={url} alt="" loading="lazy" draggable="false" /></button></li>)}</ul>}
        <div className="bk-actions inline">
          <button type="button" className="bk-edit-link" aria-label={`Editar ${item.title}`} onClick={() => setMode({ id: item.id, kind: 'edit' })}>editar</button>
        </div>
      </div>
      {main && <button type="button" className="bk-photo bk-polaroid" onClick={() => handlers.zoom({ url: main, item })} aria-label={`Ver a foto de ${item.title}`}><img src={main} alt="" loading="lazy" draggable="false" /></button>}
    </>}
  </li>
}

// A foto "na mão": a polaroid sai da página, grande, com a legenda escrita embaixo. Toque para devolver.
function PhotoInHand({ zoom, onClose }) {
  const [leaving, setLeaving] = useState(false)
  const close = useCallback(() => { setLeaving(true); window.setTimeout(onClose, reduceMotion() ? 0 : 320) }, [onClose])
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])
  return createPortal(<div className={`bk bk-hand ${leaving ? 'is-leaving' : ''}`} role="dialog" aria-label={`Foto de ${zoom.item.title}`} onClick={close}>
    <figure className="bk-hand-photo">
      <img src={zoom.url} alt={`Foto de ${zoom.item.title}`} draggable="false" />
      <figcaption>{zoom.item.title}{zoom.item.doneAt ? <small>{dateLabel(zoom.item.doneAt)}</small> : null}</figcaption>
    </figure>
    <button type="button" className="bk-hand-close" onClick={close}>devolver para o caderno</button>
  </div>, document.body)
}

// Quantas linhas cabem numa página (o caderno tem altura fixa; o resto vai para a próxima página).
const CAPACITY = { wide: { ideasFirst: 4, ideas: 6, yearFirst: 3, year: 4 }, narrow: { ideasFirst: 3, ideas: 4, yearFirst: 2, year: 3 } }
const chunk = (list, first, rest) => {
  const out = [list.slice(0, first)]
  for (let i = first; i < list.length; i += rest) out.push(list.slice(i, i + rest))
  return out
}
// Monta a sequência de páginas: primeiro "Algum dia…", depois um ano por vez, do mais recente ao mais antigo.
function buildPages({ ideas, lived, years, wide }) {
  const cap = wide ? CAPACITY.wide : CAPACITY.narrow
  const pages = chunk(ideas, cap.ideasFirst, cap.ideas).map((part, i) => ({ type: 'ideas', n: i + 1, items: part, key: pageKey('algum-dia', i + 1) }))
  for (const year of years) {
    const ofYear = lived.filter(item => yearOf(item.doneAt) === year)
    chunk(ofYear, cap.yearFirst, cap.year).forEach((part, i) => pages.push({ type: 'year', year, n: i + 1, items: part, total: ofYear.length, key: pageKey(year, i + 1) }))
  }
  if (wide && pages.length % 2) pages.push({ type: 'blank', n: 1, items: [], key: 'em-branco' })
  return pages
}
const pageOf = (pages, id) => pages.findIndex(page => page.items.some(item => item.id === id))

export default function BucketList({ role }) {
  const me = role === 'admin' ? 'admin' : 'user'
  const who = item => (item.author === me ? 'ideia sua' : me === 'admin' ? 'ideia dela' : 'ideia dele')
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [category, setCategory] = useState('')
  const [form, setForm] = useState({ title: '', category: 'bobagem', level: 2 })
  const [adding, setAdding] = useState(false)
  const [lastIdea, setLastIdea] = useState(null)
  const [active, setActive] = useState(null)
  const [arrived, setArrived] = useState(null)
  const [at, setAt] = useState(0)
  const [turn, setTurn] = useState(null)
  const [wide, setWide] = useState(() => !narrow())
  const [cover, setCover] = useState(() => (wasOpened() ? 'open' : 'closed'))
  const [stickers, setStickers] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  const [fresh, setFresh] = useState(null)
  const [zoom, setZoom] = useState(null)
  const [written, setWritten] = useState(null)
  const [striking, setStriking] = useState(null)
  const [erasing, setErasing] = useState(null)
  const [rubbing, setRubbing] = useState(null)
  const [bookmark, setBookmark] = useState(null)
  const [ribbonDraft, setRibbonDraft] = useState(null)
  const [bookSize, setBookSize] = useState({ w: 0, h: 0 })
  const gesture = useRef(null)
  const dragged = useRef(false)
  const leafEl = useRef(null)
  const stopLeaf = useRef(null)
  const bookEl = useRef(null)
  const [draw, setDraw] = useState({ running: false, scan: null, chosen: null, maxLevel: 5 })
  const timer = useRef(null)
  const typer = useRef(null)
  const noticeTimer = useRef(null)

  const load = useCallback(() => listItems().then(list => { setItems(list); setError('') }).catch(err => { console.error(err); setError('Não foi possível carregar a lista. Confira se a tabela bucket_items existe no Supabase.'); setItems(current => current ?? []) }), [])
  const loadStickers = useCallback(() => listStickers().then(setStickers).catch(err => console.error(err)), [])
  useEffect(() => { load(); loadStickers(); loadBookmark().then(setBookmark).catch(err => console.error(err)) }, [load, loadStickers])
  useEffect(() => {
    const el = bookEl.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => setBookSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 860px)')
    if (!media) return undefined
    const onChange = () => setWide(!media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  useEffect(() => {
    if (!picked) return undefined
    const off = event => { if (!event.target.closest?.('.bk-sticker')) setPicked(null) }
    document.addEventListener('pointerdown', off)
    return () => document.removeEventListener('pointerdown', off)
  }, [picked])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') { load(); loadStickers() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.clearInterval(timer.current); window.clearInterval(typer.current); window.clearTimeout(noticeTimer.current); stopLeaf.current?.() }
  }, [load, loadStickers])

  const flash = text => { setNotice(text); window.clearTimeout(noticeTimer.current); noticeTimer.current = window.setTimeout(() => setNotice(''), 4000) }
  const fail = text => { setError(text); setNotice('') }

  // ----- páginas -----
  const all = items || []
  const total = counts(all)
  const ideasOf = list => list.filter(item => !item.done && (!category || item.category === category))
  const livedOf = list => list.filter(item => item.done && (!category || item.category === category)).sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt))
  const yearsOf = list => {
    const found = [...new Set(list.filter(item => item.done).map(item => yearOf(item.doneAt)).filter(Boolean))].sort((a, b) => b - a)
    return found.length ? found : [new Date().getFullYear()]
  }
  const pagesFor = list => buildPages({ ideas: ideasOf(list), lived: livedOf(list), years: yearsOf(list), wide })
  const pages = pagesFor(all)
  const ideas = ideasOf(all)
  const years = yearsOf(all)
  const thisYear = new Date().getFullYear()
  const last = pages.length - 1
  const here = Math.min(at, last)
  const spread = Math.floor(here / 2)
  const pool = roulettePool(all, { maxLevel: draw.maxLevel, category })

  // ----- virar a página -----
  // "Folha" = página dupla no computador, página única no celular. A folha que vira é de papel
  // (PaperLeaf): curva no meio do caminho. Clique, abas, teclado e o dedo usam o mesmo motor.
  const sheet = wide ? spread : here
  const lastSheet = wide ? Math.floor(last / 2) : last
  const sheetOf = index => (wide ? Math.floor(index / 2) : index)
  const finishTurn = (current, done) => { stopLeaf.current = null; if (done) setAt(current.target); setTurn(null) }
  const goTo = (index, total = pages.length) => {
    const target = Math.max(0, Math.min(index, total - 1))
    const from = sheet, to = sheetOf(target)
    if (turn) return
    setPicked(null)
    if (from === to || reduceMotion()) { setAt(target); return }
    setActive(null)
    setTurn({ dir: to > from ? 'forward' : 'back', from, to, target, mode: 'auto' })
  }
  const step = delta => goTo(wide ? (spread + delta) * 2 : here + delta)
  // A folha automática (clique/abas/teclado) anda sozinha assim que aparece.
  useEffect(() => {
    if (!turn || turn.mode !== 'auto') return undefined
    const forward = turn.dir === 'forward'
    stopLeaf.current = runLeaf(() => leafEl.current, turn.dir, forward ? 0 : 1, forward ? 1 : 0, wide ? 1000 : 760, () => finishTurn(turn, true))
    return () => stopLeaf.current?.()
  }, [turn]) // eslint-disable-line react-hooks/exhaustive-deps
  const attachLeaf = useCallback(el => { leafEl.current = el; if (el && turn) applyLeaf(el, turn.dir === 'forward' ? 0 : 1, turn.dir) }, [turn])

  // ----- puxar a página com o dedo/mouse -----
  // O ponto que você segurou fica sob o dedo; ao soltar, passou da metade (ou foi um peteleco) = vira; senão volta.
  const blocked = target => target.closest('button:not(.bk-corner-turn), a, input, textarea, select, label, .bk-sticker, .bk-edit, .bk-controls, .bk-note-card, .bk-ribbon')
  const pullStart = event => {
    if (closed || turn || event.button > 0 || blocked(event.target)) return
    const page = event.target.closest('.bk-left, .bk-right, .bk-single')
    if (!page) return
    const rect = event.currentTarget.getBoundingClientRect()
    const side = page.classList.contains('bk-left') ? 'left' : page.classList.contains('bk-right') ? 'right' : 'single'
    const origin = wide ? rect.left + rect.width / 2 : rect.left
    const half = wide ? rect.width / 2 : rect.width
    gesture.current = { x0: event.clientX, y0: event.clientY, side, origin, half, reach: Math.max(0.3, Math.min(1, Math.abs(event.clientX - origin) / half)), started: false, id: event.pointerId, el: event.currentTarget, last: [event.clientX, performance.now()], vx: 0, p: 0 }
    dragged.current = false
  }
  const pullMove = event => {
    const g = gesture.current
    if (!g) return
    const dx = event.clientX - g.x0, dy = event.clientY - g.y0
    const now = performance.now()
    g.vx = (event.clientX - g.last[0]) / Math.max(now - g.last[1], 1); g.last = [event.clientX, now]
    if (!g.started) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) { if (Math.abs(dy) > 14) gesture.current = null; return }
      const dir = dx < 0 && g.side !== 'left' ? 'forward' : dx > 0 && g.side !== 'right' ? 'back' : null
      if (!dir || (dir === 'forward' && sheet >= lastSheet) || (dir === 'back' && sheet <= 0)) { gesture.current = null; return }
      const to = sheet + (dir === 'forward' ? 1 : -1)
      g.dir = dir; g.started = true; g.p = dir === 'forward' ? 0 : 1; dragged.current = true
      g.el.setPointerCapture?.(g.id)
      document.body.classList.add('bk-dragging')
      setPicked(null); setActive(null)
      setTurn({ dir, from: sheet, to, target: wide ? to * 2 : to, mode: 'drag' })
    }
    if (!wide && g.dir === 'back') g.p = Math.max(0, Math.min(1, 1 - dx / (g.half * 0.9)))
    else g.p = Math.acos(Math.max(-1, Math.min(1, (event.clientX - g.origin) / (g.reach * g.half)))) / Math.PI
    applyLeaf(leafEl.current, g.p, g.dir)
  }
  const pullEnd = () => {
    const g = gesture.current
    gesture.current = null
    document.body.classList.remove('bk-dragging')
    if (!g?.started || !turn) return
    const forward = g.dir === 'forward'
    // passou da metade, ou deu um peteleco depois de já ter levantado um pouco a folha
    const done = forward ? g.p > 0.45 || (g.vx < -0.6 && g.p > 0.12) : g.p < 0.55 || (g.vx > 0.6 && g.p < 0.88)
    const end = forward ? (done ? 1 : 0) : (done ? 0 : 1)
    const current = turn
    stopLeaf.current = runLeaf(() => leafEl.current, g.dir, g.p, end, reduceMotion() ? 0 : 260 + 520 * Math.abs(end - g.p), () => finishTurn(current, done))
  }
  const cornerTurn = delta => { if (dragged.current) { dragged.current = false; return } step(delta) }
  useEffect(() => {
    if (cover !== 'open') return undefined
    const onKey = event => {
      if (event.target.closest?.('input, textarea, select, [contenteditable]')) return
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const create = async values => {
    setAdding(true); setError('')
    try {
      const created = await addItem({ ...values, title: values.title.trim(), author: me })
      setItems(list => [created, ...(list || [])]); setWritten(created.id); flash('Anotada na primeira página.')
      window.setTimeout(() => setWritten(current => (current === created.id ? null : current)), 2400)
      if (sheet > 0) goTo(0)
      return true
    }
    catch (err) { console.error(err); fail('Não foi possível adicionar. Tente de novo.'); return false } finally { setAdding(false) }
  }
  const submit = async event => {
    event.preventDefault()
    if (!form.title.trim()) { fail('Escreva a ideia primeiro.'); return }
    window.clearInterval(typer.current)
    if (await create(form)) { setForm(current => ({ ...current, title: '' })); setLastIdea(null) }
  }
  // A sugestão "é digitada" no campo, letra a letra, e continua editável.
  const suggest = () => {
    const idea = pickIdea(items || [], lastIdea)
    if (!idea) { flash('Vocês já usaram todas as sugestões. Agora é por conta de vocês.'); return }
    window.clearInterval(typer.current)
    setLastIdea(idea.id); setForm({ title: '', category: idea.category, level: idea.level })
    if (reduceMotion()) { setForm({ title: idea.text, category: idea.category, level: idea.level }); return }
    let n = 0
    typer.current = window.setInterval(() => { n += 2; setForm(current => ({ ...current, title: idea.text.slice(0, n) })); if (n >= idea.text.length) window.clearInterval(typer.current) }, 22)
  }

  const save = async (id, patch) => {
    try { const updated = await updateItem(id, patch); setItems(list => list.map(item => (item.id === id ? updated : item))); setError(''); flash('Salvo.'); return true }
    catch (err) { console.error(err); fail('Não foi possível salvar. Tente de novo.'); return false }
  }
  // Fizemos: o visto é desenhado e a ideia é riscada à mão; a linha some do "Algum dia…", o caderno
  // vira até a página do ano e lá a lembrança é escrita (título, risco, data, frase e a polaroid presa).
  const finish = async (item, patch) => {
    try {
      const updated = await updateItem(item.id, patch)
      setActive(null); setDraw(current => (current.chosen?.id === item.id ? { ...current, chosen: null } : current))
      setStriking(item.id)
      await wait(reduceMotion() ? 0 : 1150)
      await collapse(`idea-${item.id}`)
      const next = all.map(entry => (entry.id === item.id ? updated : entry))
      setStriking(null); setItems(next); setError('')
      const nextPages = pagesFor(next)
      const target = pageOf(nextPages, item.id)
      const turns = target >= 0 && sheetOf(target) !== sheet
      if (turns) goTo(target, nextPages.length)
      window.setTimeout(() => setArrived(item.id), turns && !reduceMotion() ? (wide ? 1050 : 800) : 60)
      window.setTimeout(() => setArrived(current => (current === item.id ? null : current)), 5200)
      flash('Riscada!')
    } catch (err) { console.error(err); setStriking(null); fail('Não foi possível guardar. Tente de novo.') }
  }
  // Desmarcar: o risco é apagado e a lembrança volta para "Algum dia…".
  const undo = async item => {
    try {
      const updated = await updateItem(item.id, { done: false, doneAt: null })
      setErasing(item.id)
      await wait(reduceMotion() ? 0 : 750)
      await collapse(`memory-${item.id}`)
      setErasing(null)
      setItems(list => list.map(entry => (entry.id === item.id ? updated : entry))); flash('Voltou para “Algum dia…”.')
    } catch (err) { console.error(err); setErasing(null); fail('Não foi possível desfazer. Tente de novo.') }
  }
  // Excluir: passa a borracha.
  const remove = async item => {
    try {
      await removeItem(item.id); setActive(null)
      setRubbing(item.id)
      await wait(reduceMotion() ? 0 : 600)
      await collapse(item.done ? `memory-${item.id}` : `idea-${item.id}`)
      setRubbing(null)
      setItems(list => list.filter(entry => entry.id !== item.id)); flash('Apagada.')
    } catch (err) { console.error(err); setRubbing(null); fail('Não foi possível excluir. Tente de novo.') }
  }
  const handlers = { save, finish, undo, remove, error: fail, zoom: setZoom }

  // ----- adesivos -----
  const placeSticker = async sticker => {
    try {
      const created = await addSticker({ ...sticker, author: me })
      setStickers(list => [...list, created]); setFresh(created.id); setPicked(null)
      window.setTimeout(() => setFresh(current => (current === created.id ? null : current)), 900)
    } catch (err) { console.error(err); fail('Não foi possível colar o adesivo. Confira se a tabela bucket_stickers existe no Supabase.') }
  }
  const changeSticker = async (sticker, patch) => {
    setStickers(list => list.map(entry => (entry.id === sticker.id ? { ...entry, ...patch } : entry)))
    try { await updateSticker(sticker.id, patch) } catch (err) { console.error(err); fail('Não foi possível mexer no adesivo.') }
  }
  const dropSticker = async sticker => {
    setPicked(null); setStickers(list => list.filter(entry => entry.id !== sticker.id))
    try { await removeSticker(sticker.id) } catch (err) { console.error(err); fail('Não foi possível tirar o adesivo.'); loadStickers() }
  }

  // ----- sorteio -----
  const land = pick => setDraw(current => ({ ...current, running: false, scan: null, chosen: pick }))
  const drawNow = () => {
    if (draw.running || !pool.length) return
    window.clearInterval(timer.current)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (reduceMotion()) { land(pick); return }
    setDraw(current => ({ ...current, running: true, chosen: null, scan: pool[0].title }))
    let ticks = 0
    timer.current = window.setInterval(() => {
      ticks += 1
      if (ticks >= 16) { window.clearInterval(timer.current); land(pick) } else setDraw(current => ({ ...current, scan: pool[ticks % pool.length].title }))
    }, 85)
  }
  const openCapture = item => {
    const target = pageOf(pages, item.id)
    if (target >= 0) goTo(target)
    window.setTimeout(() => setActive({ id: item.id, kind: 'capture' }), target >= 0 && sheetOf(target) !== sheet ? 1060 : 0)
  }
  const openCover = () => {
    rememberOpened()
    if (reduceMotion()) { setCover('open'); return }
    setCover('opening')
    window.setTimeout(() => setCover('open'), narrow() ? 650 : 1250)
  }

  const open = form.title.trim().length > 0
  const closed = cover !== 'open'
  const tabs = [{ label: 'Algum dia', index: 0 }, ...years.map(year => ({ label: String(year), index: pages.findIndex(page => page.type === 'year' && page.year === year) }))]
  const tabOn = tab => { const page = pages[here]; return tab.index === 0 ? page?.type === 'ideas' : page?.type === 'year' && String(page.year) === tab.label }

  // O conteúdo de uma página. "still" = cópia sem interação (na folha que está virando).
  const renderPage = (page, index, still = false, side = 'single') => {
    if (!page) return null
    const layer = <StickerLayer page={page.key} stickers={stickers} selected={still ? null : picked} fresh={still ? null : fresh} onSelect={setPicked} onChange={changeSticker} onRemove={dropSticker} still={still} />
    const prev = index > 0 && side !== 'right'
    const next = index < last && side !== 'left'
    const nav = <footer className="bk-folio">
      <i className="bk-page-no">{index + 1}</i>
      {prev && <button type="button" className="bk-corner-turn prev" tabIndex={still ? -1 : 0} onClick={() => cornerTurn(-1)} aria-label="Página anterior" title="Puxe ou toque para voltar"><span aria-hidden="true" /></button>}
      {next && <button type="button" className="bk-corner-turn next" tabIndex={still ? -1 : 0} onClick={() => cornerTurn(1)} aria-label="Próxima página" title="Puxe ou toque para virar"><span aria-hidden="true" /></button>}
    </footer>
    if (page.type === 'blank') return <><div className="bk-blank" aria-hidden="true"><p>continua…</p></div>{nav}{layer}</>
    if (page.type === 'ideas') return <>
      {page.n === 1 ? <>
        <header className="bk-page-head">
          <h2 id={still ? undefined : 'bk-todo-title'}>Algum dia… <small>{items === null ? '' : `${ideas.length} ${ideas.length === 1 ? 'ideia' : 'ideias'}`}</small></h2>
          <label className="bk-filter"><span className="sr-only">Categoria</span><select tabIndex={still ? -1 : 0} value={category} onChange={event => { setCategory(event.target.value); setAt(0) }}><option value="">Tudo</option>{CATEGORIES.map(entry => <option key={entry.key} value={entry.key}>{entry.label}</option>)}</select></label>
        </header>
        <form className={`bk-compose ${open ? 'is-open' : ''}`} onSubmit={submit}>
          <div className="bk-field">
            <label htmlFor={still ? undefined : 'bk-new'} className="sr-only">Nova ideia</label>
            <input id={still ? undefined : 'bk-new'} tabIndex={still ? -1 : 0} className="bk-compose-input" maxLength={140} autoComplete="off" placeholder="Eu quero…" value={form.title} onChange={event => { window.clearInterval(typer.current); setForm({ ...form, title: event.target.value }) }} />
            <button type="button" tabIndex={still ? -1 : 0} className="bk-text-button bk-suggest" onClick={suggest} title="Sugerir uma ideia"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>Sugerir</button>
          </div>
          <div className="bk-controls"><div className="bk-controls-inner">
            <div className="bk-cats" role="radiogroup" aria-label="Categoria">
              {CATEGORIES.map(entry => <button key={entry.key} type="button" role="radio" aria-checked={form.category === entry.key} onClick={() => setForm({ ...form, category: entry.key })}>{entry.label}</button>)}
            </div>
            <div className="bk-compose-row"><Level value={form.level} onChange={level => setForm({ ...form, level })} /><button type="submit" className="bk-primary" disabled={adding}>{adding ? 'Adicionando…' : 'Adicionar'}</button></div>
          </div></div>
        </form>
      </> : <header className="bk-page-head small"><h2>Algum dia… <small>continuação</small></h2></header>}
      <div className="bk-page-body">
        {items === null ? <p className="bk-empty">Abrindo o caderno…</p>
          : page.items.length ? <ul className={`bk-ideas ${draw.chosen ? 'has-pick' : ''}`}>{page.items.map((item, i) => <Idea key={item.id} item={item} index={i} who={who(item)} mode={!still && active?.id === item.id ? active.kind : null} setMode={setActive} picked={draw.chosen?.id === item.id} flash={false} fx={still ? '' : [written === item.id && 'is-written', striking === item.id && 'is-striking', rubbing === item.id && 'is-rubbing'].filter(Boolean).join(' ')} handlers={handlers} />)}</ul>
            : <p className="bk-empty">{all.length ? 'Nada por aqui com esse filtro.' : 'Página em branco. Escreva a primeira ideia.'}</p>}
      </div>
      {nav}{layer}
    </>
    return <>
      {page.n === 1 ? <>
        <header className="bk-year-head"><h2><span className="bk-year">{page.year}</span><small>{page.total} {page.total === 1 ? 'riscada' : 'riscadas'}{page.year === thisYear ? ' este ano' : ''}</small></h2></header>
        <div className="bk-ruler" aria-hidden="true">
          <ol>{MONTHS.map(month => <li key={month}>{month}</li>)}</ol>
          <div className="bk-ruler-line">
            {livedOf(all).filter(item => yearOf(item.doneAt) === page.year).map(item => <button type="button" tabIndex={-1} key={item.id} className="bk-ruler-dot" style={{ left: `${yearPosition(item.doneAt) * 100}%` }} title={item.title} onClick={() => goTo(pageOf(pages, item.id))} />)}
            {page.year === thisYear && <span className="bk-ruler-now" style={{ left: `${yearPosition(new Date().toISOString()) * 100}%` }}>hoje</span>}
          </div>
        </div>
      </> : <header className="bk-page-head small"><h2>{page.year} <small>continuação</small></h2></header>}
      <div className="bk-page-body">
        {page.items.length ? <ul className="bk-ideas bk-memories">{page.items.map((item, i) => <Memory key={item.id} item={item} index={i} who={who(item)} mode={!still && active?.id === item.id ? active.kind : null} setMode={setActive} arriving={!still && arrived === item.id} fx={still ? '' : [erasing === item.id && 'is-erasing', rubbing === item.id && 'is-rubbing'].filter(Boolean).join(' ')} handlers={handlers} />)}</ul>
          : <p className="bk-empty soft">Nada riscado em {page.year} ainda. Quando vocês fizerem a primeira, ela aparece aqui, com foto e tudo.</p>}
      </div>
      {nav}{layer}
    </>
  }
  const sheetClass = page => `bk-page-sheet is-${page?.type || 'blank'}`

  // Quem fica embaixo enquanto a folha vira. Ao terminar, o que está embaixo já é a página final,
  // então nada "recarrega": a folha some e a página de baixo continua igual.
  const forward = turn?.dir === 'forward'
  const leftIndex = turn && wide ? (forward ? turn.from * 2 : turn.to * 2) : spread * 2
  const rightIndex = turn && wide ? (forward ? turn.to * 2 + 1 : turn.from * 2 + 1) : spread * 2 + 1
  const singleIndex = turn && !wide ? (forward ? turn.to : turn.from) : here
  const leafFront = turn ? (wide ? (forward ? turn.from * 2 + 1 : turn.to * 2 + 1) : forward ? turn.from : turn.to) : null
  const leafBack = turn && wide ? (forward ? turn.to * 2 : turn.from * 2) : null
  const paper = (index, side) => <div className={`${sheetClass(pages[index])} bk-paper-page`}>{renderPage(pages[index], index, true, side)}</div>
  const blankBack = <div className="bk-page-sheet is-blank bk-paper-page"><div className="bk-blank" /></div>

  // ----- o marcador (fitinha) -----
  // Pendurado na lombada por padrão. Arraste e deite sobre uma página para marcá-la (fica salvo para os dois);
  // arraste para fora do caderno para tirar. Em outra página, a ponta pendurada leva de volta à página marcada.
  const markIndex = bookmark ? pages.findIndex(page => page.key === bookmark.page) : -1
  const openPages = turn ? (wide ? [turn.from * 2, turn.from * 2 + 1] : [turn.from]) : wide ? [spread * 2, spread * 2 + 1] : [here]
  const laid = markIndex >= 0 && openPages.includes(markIndex) && !closed
  const anchor = { x: wide ? bookSize.w / 2 + 18 : bookSize.w - 46, y: -4 }
  const ribbonTo = ribbonDraft || (laid ? { x: (bookmark.x / 100) * bookSize.w, y: (bookmark.y / 100) * bookSize.h } : { x: anchor.x, y: wide ? bookSize.h + 48 : 70 })
  const ribbonLength = Math.max(40, Math.hypot(ribbonTo.x - anchor.x, ribbonTo.y - anchor.y))
  const ribbonAngle = (-Math.atan2(ribbonTo.x - anchor.x, ribbonTo.y - anchor.y) * 180) / Math.PI
  const ribbonGesture = useRef(null)
  const ribbonDown = event => {
    if (closed || event.button > 0) return
    event.stopPropagation(); event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    ribbonGesture.current = { x0: event.clientX, y0: event.clientY, rect: bookEl.current.getBoundingClientRect(), moved: false }
  }
  const ribbonMove = event => {
    const g = ribbonGesture.current
    if (!g) return
    if (!g.moved && Math.hypot(event.clientX - g.x0, event.clientY - g.y0) < 5) return
    g.moved = true
    setRibbonDraft({ x: event.clientX - g.rect.left, y: event.clientY - g.rect.top })
  }
  const ribbonUp = async event => {
    const g = ribbonGesture.current
    ribbonGesture.current = null
    if (!g) return
    if (!g.moved) { if (markIndex >= 0 && !laid) goTo(markIndex); return }
    const inside = event.clientX > g.rect.left && event.clientX < g.rect.right && event.clientY > g.rect.top && event.clientY < g.rect.bottom
    const page = inside ? document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-sticker-page]')?.dataset.stickerPage : null
    const next = page ? { page, x: ((event.clientX - g.rect.left) / g.rect.width) * 100, y: ((event.clientY - g.rect.top) / g.rect.height) * 100 } : null
    setBookmark(next); setRibbonDraft(null)
    try { await saveBookmark(next); if (next) flash('Página marcada.') } catch (err) { console.error(err); fail('Não foi possível guardar o marcador.') }
  }
  const ribbonLabel = laid ? 'Marcador nesta página. Arraste para mudar de lugar ou para fora do caderno para tirar.' : markIndex >= 0 ? `Ir para a página marcada (${markIndex + 1})` : 'Marcador: arraste até uma página para marcá-la'

  return <section className="bk" aria-label="Caderno de sonhos">
    <h1 className="sr-only">Caderno de sonhos</h1>
    <div className={`bk-toolbar ${closed ? 'is-hidden' : ''}`}>
      <span className="bk-tally">{total.done} de {total.todo + total.done} riscadas</span>
      <p role="status" className="bk-status" key={notice}>{notice}</p>
      <span className="bk-tools">
        <button type="button" className="bk-tool" disabled={!pool.length || draw.running || closed} onClick={drawNow}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>Sortear uma</button>
        <button type="button" className="bk-tool" disabled={closed} aria-expanded={sheetOpen} onClick={() => setSheetOpen(value => !value)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h11l5 5v11H4z" /><path d="M15 4v5h5" /></svg>Adesivos</button>
      </span>
    </div>
    {error && <div role="alert" className="bk-error">{error} <button type="button" className="bk-text-button" onClick={() => { setError(''); load() }}>Tentar de novo</button></div>}

    {!closed && <nav className="bk-tabs" aria-label="Seções do caderno">{tabs.map((tab, i) => <button key={tab.label} type="button" style={{ '--i': i }} aria-current={tabOn(tab) ? 'page' : undefined} onClick={() => goTo(tab.index)}>{tab.label}</button>)}</nav>}

    <div ref={bookEl} className={`bk-book is-${cover} ${wide ? 'is-wide' : 'is-narrow'} ${turn ? 'is-turning' : ''} ${turn?.mode === 'drag' ? 'is-pulling' : ''}`} onPointerDown={pullStart} onPointerMove={pullMove} onPointerUp={pullEnd} onPointerCancel={pullEnd} onDragStart={event => event.preventDefault()}>
      <span className="bk-spine" aria-hidden="true" />
      {bookSize.w > 0 && <button type="button" className={`bk-ribbon ${laid ? 'is-laid' : ''} ${ribbonDraft ? 'is-dragging' : ''} ${markIndex >= 0 && !laid ? 'is-away' : ''}`} style={{ left: anchor.x - 5, top: anchor.y, height: ribbonLength, transform: `rotate(${ribbonAngle}deg)` }} aria-label={ribbonLabel} title={ribbonLabel} onPointerDown={ribbonDown} onPointerMove={ribbonMove} onPointerUp={ribbonUp} onPointerCancel={() => { ribbonGesture.current = null; setRibbonDraft(null) }} />}

      {(draw.running || draw.chosen) && !closed && <aside className="bk-note-card" role="status">
        <span className="bk-tape" aria-hidden="true" />
        <span className="bk-eyebrow">Para hoje</span>
        {draw.chosen ? <>
          <h3>{draw.chosen.title}</h3>
          <div className="bk-hero-actions">
            <button type="button" className="bk-primary" onClick={() => openCapture(draw.chosen)}>Fizemos</button>
            <button type="button" className="bk-text-button" onClick={drawNow}>Outra</button>
            <label className="bk-level-limit">até o nível<select value={draw.maxLevel} onChange={event => setDraw({ ...draw, maxLevel: Number(event.target.value) })}>{LEVELS.map(level => <option key={level.value} value={level.value}>{level.value} · {level.label}</option>)}</select></label>
            <button type="button" className="bk-text-button bk-close" onClick={() => setDraw({ ...draw, chosen: null })} aria-label="Fechar o bilhete">×</button>
          </div>
        </> : <p className="bk-scan" key={draw.scan} aria-hidden="true">{draw.scan}</p>}
      </aside>}

      {cover !== 'open' && <div className="bk-leaf bk-cover-leaf">
        <div className="bk-leaf-face bk-cover">
          <span className="bk-cover-label"><small>caderno de</small>sonhos<small>dele &amp; dela · desde 2026</small></span>
          <button type="button" className="bk-cover-open" onClick={openCover} disabled={cover === 'opening'}>Abrir o caderno</button>
          <span className="bk-cover-elastic" aria-hidden="true" />
        </div>
        <div className="bk-leaf-face bk-leaf-back bk-endpaper" aria-hidden="true"><p>Este caderno é nosso.<br /><span>Para guardar o que a gente quer viver e o que já viveu.</span></p></div>
      </div>}

      {turn && <PaperLeaf ref={attachLeaf} narrow={!wide} front={paper(leafFront, wide ? 'right' : 'single')} back={wide ? paper(leafBack, 'left') : blankBack} />}

      {wide ? <>
        <section className={`${sheetClass(pages[leftIndex])} bk-left`} data-sticker-page={pages[leftIndex]?.key} aria-label={`Página ${leftIndex + 1}`} inert={closed || undefined}>{renderPage(pages[leftIndex], leftIndex, false, 'left')}</section>
        <section className={`${sheetClass(pages[rightIndex])} bk-right`} data-sticker-page={pages[rightIndex]?.key} aria-label={`Página ${rightIndex + 1}`} inert={closed || undefined}>{renderPage(pages[rightIndex], rightIndex, false, 'right')}</section>
      </> : <section className={`${sheetClass(pages[singleIndex])} bk-single`} data-sticker-page={pages[singleIndex]?.key} aria-label={`Página ${singleIndex + 1} de ${pages.length}`} inert={closed || undefined}>{renderPage(pages[singleIndex], singleIndex)}</section>}
    </div>
    {sheetOpen && <StickerSheet onPlace={placeSticker} onClose={() => setSheetOpen(false)} />}
    {zoom && <PhotoInHand zoom={zoom} onClose={() => setZoom(null)} />}
  </section>
}
