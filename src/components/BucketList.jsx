import { useCallback, useEffect, useRef, useState } from 'react'
import { addItem, listItems, removeItem, updateItem } from '../data/bucketList'
import { CATEGORIES, LEVELS, MAX_PHOTOS, categoryOf, counts, fromDateInput, pickIdea, roulettePool, toDateInput } from '../data/bucketIdeas'
import { uploadImage } from '../data/media'
import '../styles/bucket.css'

const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '') }
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

const Meta = ({ item, who }) => <p className="bk-meta">{categoryOf(item.category).label}<span className="bk-dots" role="img" aria-label={`nível ${item.level} de 5`}>{[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= item.level ? 'on' : ''} />)}</span>{who}</p>

function Idea({ item, index, who, mode, setMode, picked, flash, handlers }) {
  const close = () => setMode(null)
  return <li id={`idea-${item.id}`} style={{ '--i': Math.min(index, 8) }} className={`bk-idea ${index === 0 ? 'is-lead' : ''} ${picked ? 'is-picked' : ''} ${flash ? 'is-flash' : ''} ${mode ? 'is-open' : ''}`}>
    {mode === 'capture' ? <CaptureForm item={item} onSubmit={handlers.finish} onCancel={close} onError={handlers.error} />
      : mode === 'edit' ? <EditForm item={item} onSubmit={async (it, patch) => { if (await handlers.save(it.id, patch)) close() }} onCancel={close} onRemove={handlers.remove} onError={handlers.error} />
        : <>
          <div className="bk-body">
            <h3 className="bk-name">{item.title}</h3>
            {item.note && <p className="bk-note">{item.note}</p>}
            <Meta item={item} who={who} />
            {item.photos.length > 0 && <ul className="bk-thumbs">{item.photos.map((url, i) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Foto ${i + 1} de ${item.title}`} loading="lazy" /><span className="sr-only"> (abre em nova aba)</span></a></li>)}</ul>}
          </div>
          <div className="bk-actions">
            <button type="button" className="bk-pill" aria-label={`Fizemos: ${item.title}`} onClick={() => setMode({ id: item.id, kind: 'capture' })}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" /></svg>Fizemos</button>
            <button type="button" className="bk-edit-link" aria-label={`Editar ${item.title}`} onClick={() => setMode({ id: item.id, kind: 'edit' })}>Editar</button>
          </div>
        </>}
  </li>
}

// Uma lembrança na linha do tempo: dia à esquerda, foto e frase do mesmo tamanho para todas.
function Memory({ item, index, who, mode, setMode, arriving, handlers }) {
  const d = new Date(item.doneAt)
  const [main, ...rest] = item.photos
  return <li id={`memory-${item.id}`} style={{ '--i': Math.min(index, 8) }} className={`bk-moment ${arriving ? 'is-arriving' : ''} ${mode ? 'is-open' : ''}`}>
    <p className="bk-day" aria-hidden="true"><b>{Number.isNaN(d.getTime()) ? '–' : d.getDate()}</b>{Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</p>
    {mode === 'edit' ? <EditForm item={item} onSubmit={async (it, patch) => { if (await handlers.save(it.id, patch)) setMode(null) }} onCancel={() => setMode(null)} onRemove={handlers.remove} onError={handlers.error} /> : <div className={`bk-moment-body ${main ? 'has-photo' : ''}`}>
      {main && <a className="bk-photo" href={main} target="_blank" rel="noopener noreferrer"><img src={main} alt={`Foto de ${item.title}`} loading="lazy" /><span className="sr-only"> (abre em nova aba)</span></a>}
      <div className="bk-moment-text">
        <h3 className="bk-name">{item.title}</h3>
        <p className="bk-meta"><span className="sr-only">{dateLabel(item.doneAt)} · </span>{categoryOf(item.category).label} · {who}</p>
        {item.memory && <p className="bk-quote-small">“{item.memory}”</p>}
        {rest.length > 0 && <ul className="bk-thumbs">{rest.map((url, i) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Foto ${i + 2} de ${item.title}`} loading="lazy" /></a></li>)}</ul>}
        <div className="bk-actions inline">
          <button type="button" className="bk-edit-link" aria-label={`Editar ${item.title}`} onClick={() => setMode({ id: item.id, kind: 'edit' })}>Editar</button>
          <button type="button" className="bk-edit-link" aria-label={`Voltar para a lista: ${item.title}`} onClick={() => handlers.undo(item)}>Desfazer</button>
        </div>
      </div>
    </div>}
  </li>
}

// Agrupa as lembranças por mês, da mais recente para a mais antiga.
function byMonth(list) {
  const groups = []
  for (const item of list) {
    const d = new Date(item.doneAt)
    const key = Number.isNaN(d.getTime()) ? 'sem-data' : `${d.getFullYear()}-${d.getMonth()}`
    const label = Number.isNaN(d.getTime()) ? 'Sem data' : d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase())
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(item); else groups.push({ key, label, items: [item] })
  }
  return groups
}

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
  const [draw, setDraw] = useState({ running: false, scan: null, chosen: null, maxLevel: 5 })
  const timer = useRef(null)
  const typer = useRef(null)
  const noticeTimer = useRef(null)

  const load = useCallback(() => listItems().then(list => { setItems(list); setError('') }).catch(err => { console.error(err); setError('Não foi possível carregar a lista. Confira se a tabela bucket_items existe no Supabase.'); setItems(current => current ?? []) }), [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.clearInterval(timer.current); window.clearInterval(typer.current); window.clearTimeout(noticeTimer.current) }
  }, [load])

  const flash = text => { setNotice(text); window.clearTimeout(noticeTimer.current); noticeTimer.current = window.setTimeout(() => setNotice(''), 4000) }
  const fail = text => { setError(text); setNotice('') }

  const create = async values => {
    setAdding(true); setError('')
    try { const created = await addItem({ ...values, title: values.title.trim(), author: me }); setItems(list => [created, ...(list || [])]); flash('Ideia adicionada.'); return true }
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
  // Fizemos: a linha se recolhe e a ideia reaparece na linha do tempo, com um destaque.
  const finish = async (item, patch) => {
    try {
      const updated = await updateItem(item.id, patch)
      setActive(null); setDraw(current => (current.chosen?.id === item.id ? { ...current, chosen: null } : current))
      await collapse(`idea-${item.id}`)
      setItems(list => list.map(entry => (entry.id === item.id ? updated : entry))); setArrived(item.id); setError('')
      window.setTimeout(() => setArrived(current => (current === item.id ? null : current)), 2200)
      window.setTimeout(() => document.getElementById(`memory-${item.id}`)?.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }), 120)
      flash('Guardada em “O que já vivemos”.')
    } catch (err) { console.error(err); fail('Não foi possível guardar. Tente de novo.') }
  }
  const undo = async item => {
    try {
      const updated = await updateItem(item.id, { done: false, doneAt: null })
      await collapse(`memory-${item.id}`)
      setItems(list => list.map(entry => (entry.id === item.id ? updated : entry))); flash('Voltou para “Para viver”.')
    } catch (err) { console.error(err); fail('Não foi possível desfazer. Tente de novo.') }
  }
  const remove = async item => {
    try {
      await removeItem(item.id); setActive(null)
      await collapse(item.done ? `memory-${item.id}` : `idea-${item.id}`)
      setItems(list => list.filter(entry => entry.id !== item.id)); flash('Ideia removida.')
    } catch (err) { console.error(err); fail('Não foi possível excluir. Tente de novo.') }
  }
  const handlers = { save, finish, undo, remove, error: fail }

  const all = items || []
  const total = counts(all)
  const inCategory = all.filter(item => !category || item.category === category)
  const ideas = inCategory.filter(item => !item.done)
  const lived = inCategory.filter(item => item.done).sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt))
  const pool = roulettePool(all, { maxLevel: draw.maxLevel, category })

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
  const openCapture = item => { setActive({ id: item.id, kind: 'capture' }); window.setTimeout(() => document.getElementById(`idea-${item.id}`)?.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }), 60) }

  const open = form.title.trim().length > 0
  const sentence = items === null ? 'Abrindo a lista…' : `${total.todo} para viver · ${total.done} ${total.done === 1 ? 'vivida' : 'vividas'}`

  return <section className="bk" aria-label="Lista de desejos">
    <header className="bk-mast">
      <div className="bk-title"><h1>Lista de desejos<span>.</span></h1><p className="bk-count" aria-live="polite">{sentence}</p></div>
      <nav aria-label="Categorias"><ul className="bk-nav">
        <li><button type="button" aria-current={!category} onClick={() => setCategory('')}>Tudo</button></li>
        {CATEGORIES.map(entry => <li key={entry.key}><button type="button" aria-current={category === entry.key} onClick={() => setCategory(entry.key)}>{entry.label}</button></li>)}
      </ul></nav>
    </header>

    <form className={`bk-compose ${open ? 'is-open' : ''}`} onSubmit={submit}>
      <div className="bk-field">
        <label htmlFor="bk-new" className="sr-only">Nova ideia</label>
        <input id="bk-new" className="bk-compose-input" maxLength={140} autoComplete="off" placeholder="Eu quero…" value={form.title} onChange={event => { window.clearInterval(typer.current); setForm({ ...form, title: event.target.value }) }} />
        <button type="button" className="bk-text-button bk-suggest" onClick={suggest}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>Sugerir uma</button>
      </div>
      <div className="bk-controls"><div className="bk-controls-inner">
        <div className="bk-cats" role="radiogroup" aria-label="Categoria">
          {CATEGORIES.map(entry => <button key={entry.key} type="button" role="radio" aria-checked={form.category === entry.key} onClick={() => setForm({ ...form, category: entry.key })}>{entry.label}</button>)}
        </div>
        <div className="bk-compose-row"><Level value={form.level} onChange={level => setForm({ ...form, level })} /><button type="submit" className="bk-primary" disabled={adding}>{adding ? 'Adicionando…' : 'Adicionar'}</button></div>
      </div></div>
    </form>
    <p role="status" className="bk-status" key={notice}>{notice}</p>
    {error && <div role="alert" className="bk-error">{error} <button type="button" className="bk-text-button" onClick={() => { setError(''); load() }}>Tentar de novo</button></div>}

    <div className="bk-today">
      {draw.chosen ? <div className="bk-hero" role="status">
        <span className="bk-eyebrow">Hoje</span>
        <h2>{draw.chosen.title}</h2>
        <Meta item={draw.chosen} who={who(draw.chosen)} />
        <div className="bk-hero-actions"><button type="button" className="bk-primary" onClick={() => openCapture(draw.chosen)}>Fizemos</button><button type="button" className="bk-text-button" onClick={drawNow}>Sortear outra</button><button type="button" className="bk-text-button" onClick={() => setDraw({ ...draw, chosen: null })}>Fechar</button></div>
      </div> : <div className="bk-strip">
        {draw.running ? <p className="bk-scan" key={draw.scan} aria-hidden="true">{draw.scan}</p> : <p><em>Sem saber por onde começar?</em><button type="button" className="bk-draw" disabled={!pool.length} onClick={drawNow}>Sortear uma para hoje<span aria-hidden="true">→</span></button></p>}
        <label className="bk-level-limit">até o nível<select value={draw.maxLevel} onChange={event => setDraw({ ...draw, maxLevel: Number(event.target.value) })}>{LEVELS.map(level => <option key={level.value} value={level.value}>{level.value} · {level.label}</option>)}</select></label>
      </div>}
    </div>

    <section aria-labelledby="bk-todo-title">
      <h2 id="bk-todo-title" className="bk-section">Para viver <small>{ideas.length}</small></h2>
      {items === null ? <p className="bk-empty">Abrindo a lista…</p>
        : ideas.length ? <ul className={`bk-ideas ${draw.chosen ? 'has-pick' : ''}`}>{ideas.map((item, index) => <Idea key={item.id} item={item} index={index} who={who(item)} mode={active?.id === item.id ? active.kind : null} setMode={setActive} picked={draw.chosen?.id === item.id} flash={false} handlers={handlers} />)}</ul>
          : <p className="bk-empty">{all.length ? 'Nada para viver com esse filtro.' : 'Ainda não tem nada. Escreva a primeira ideia acima.'}</p>}
    </section>

    <section aria-labelledby="bk-lived-title" className="bk-lived">
      <h2 id="bk-lived-title" className="bk-section big">O que já vivemos <small>{lived.length}</small></h2>
      {lived.length ? <ol className="bk-timeline">{byMonth(lived).map(group => <li key={group.key} className="bk-month">
        <h3 className="bk-month-name">{group.label}</h3>
        <ul>{group.items.map(item => <Memory key={item.id} item={item} index={lived.indexOf(item)} who={who(item)} mode={active?.id === item.id ? active.kind : null} setMode={setActive} arriving={arrived === item.id} handlers={handlers} />)}</ul>
      </li>)}</ol>
        : items !== null && <p className="bk-empty soft">Quando vocês fizerem a primeira, ela aparece aqui, com foto e tudo.</p>}
    </section>
  </section>
}
