import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Heart, LogOut } from 'lucide-react'
import { addItem, listItems, removeItem, updateItem } from '../data/bucketList'
import { CATEGORIES, LEVELS, MAX_PHOTOS, categoryOf, counts, pickIdea, roulettePool } from '../data/bucketIdeas'
import { uploadImage } from '../data/media'
import '../styles/bucket.css'

const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '') }
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Level({ value, onChange, label = 'Nível' }) {
  return <div className="bk-level" role="radiogroup" aria-label={label}>
    <span className="bk-field-name">{label}</span>
    {LEVELS.map(level => <button key={level.value} type="button" role="radio" aria-checked={value === level.value} aria-label={`${level.value} de 5, ${level.label}`} className={level.value <= value ? 'on' : ''} onClick={() => onChange(level.value)} />)}
    <span className="bk-level-name">{LEVELS.find(level => level.value === value)?.label}</span>
  </div>
}

function Item({ item, index, me, picked, flash, onSave, onToggle, onRemove, onError }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = patch => setDraft(current => ({ ...current, ...patch }))
  const author = item.author === me ? 'você' : me === 'admin' ? 'Rebeca' : 'seu amor'

  const addPhotos = async files => {
    const room = MAX_PHOTOS - draft.photos.length
    if (!files.length || room <= 0) return
    setUploading(true)
    try {
      const urls = []
      for (const file of [...files].slice(0, room)) urls.push(await uploadImage(file))
      setDraft(current => ({ ...current, photos: [...current.photos, ...urls].slice(0, MAX_PHOTOS) }))
    } catch (err) { onError(err.message || 'Não foi possível enviar a foto.') } finally { setUploading(false) }
  }
  const save = async event => {
    event.preventDefault()
    if (!draft.title.trim()) { onError('Escreva um título para a ideia.'); return }
    setBusy(true)
    const ok = await onSave(item.id, { title: draft.title.trim(), note: draft.note.trim(), category: draft.category, level: draft.level, memory: draft.memory.trim(), photos: draft.photos })
    setBusy(false)
    if (ok) setEditing(false)
  }

  return <li id={`item-${item.id}`} style={{ '--i': Math.min(index, 10) }} className={`bk-item ${item.done ? 'is-done' : ''} ${picked ? 'is-picked' : ''} ${flash ? 'is-flash' : ''}`}>
    <button type="button" className="bk-check" aria-pressed={item.done} aria-label={`${item.done ? 'Desmarcar' : 'Marcar como feita'}: ${item.title}`} onClick={() => onToggle(item)}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path pathLength="1" d="M3 8.5l3.2 3L13 4.5" /></svg>
    </button>
    {!editing ? <div className="bk-body">
      <h3 className="bk-name"><span>{item.title}</span></h3>
      {item.note && <p className="bk-note">{item.note}</p>}
      <p className="bk-meta">{categoryOf(item.category).label} · nível {item.level} de 5 · {author}{item.done && item.doneAt ? ` · feita em ${dateLabel(item.doneAt)}` : ''}</p>
      {item.memory && <p className="bk-memory">{item.memory}</p>}
      {item.photos.length > 0 && <ul className="bk-photos">{item.photos.map((url, index) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Foto ${index + 1} de ${item.title}`} loading="lazy" /><span className="sr-only"> (abre em nova aba)</span></a></li>)}</ul>}
    </div> : <form className="bk-body bk-edit" onSubmit={save}>
      <label>Título<input required maxLength={140} value={draft.title} onChange={event => set({ title: event.target.value })} /></label>
      <label>Detalhes<textarea rows={2} maxLength={600} value={draft.note} onChange={event => set({ note: event.target.value })} /></label>
      <label>Lembrança<textarea rows={2} maxLength={1000} placeholder={item.done ? 'Como foi?' : 'Para escrever depois de fazer'} value={draft.memory} onChange={event => set({ memory: event.target.value })} /></label>
      <label>Categoria<select value={draft.category} onChange={event => set({ category: event.target.value })}>{CATEGORIES.map(category => <option key={category.key} value={category.key}>{category.label}</option>)}</select></label>
      <Level value={draft.level} onChange={level => set({ level })} />
      <div className="bk-edit-photos">
        {draft.photos.map((url, index) => <span key={url}><img src={url} alt={`Foto ${index + 1}`} /><button type="button" aria-label={`Remover foto ${index + 1}`} onClick={() => set({ photos: draft.photos.filter(photo => photo !== url) })}>×</button></span>)}
        {draft.photos.length < MAX_PHOTOS && <label className="bk-upload">{uploading ? 'Enviando…' : '+ foto'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading} onChange={event => { addPhotos(event.target.files); event.target.value = '' }} /></label>}
      </div>
      <div className="bk-edit-actions">
        <button type="submit" className="bk-primary" disabled={busy || uploading}>{busy ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="bk-text-button" onClick={() => setEditing(false)}>Cancelar</button>
        <button type="button" className="bk-text-button danger" onClick={() => { if (window.confirm(`Excluir “${item.title}”?`)) onRemove(item) }}>Excluir</button>
      </div>
    </form>}
    {!editing && <button type="button" className="bk-edit-link" aria-label={`Editar ${item.title}`} onClick={() => { setDraft(item); setEditing(true) }}>Editar</button>}
  </li>
}

export default function BucketList({ role, onBack, onLogout }) {
  const me = role === 'admin' ? 'admin' : 'user'
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [view, setView] = useState({ category: '', status: 'todo' })
  const [form, setForm] = useState({ title: '', category: 'bobagem', level: 2 })
  const [adding, setAdding] = useState(false)
  const [lastIdea, setLastIdea] = useState(null)
  const [draw, setDraw] = useState({ running: false, flash: null, chosen: null, maxLevel: 5 })
  const timer = useRef(null)
  const noticeTimer = useRef(null)

  const load = useCallback(() => listItems().then(list => { setItems(list); setError('') }).catch(err => { console.error(err); setError('Não foi possível carregar a lista. Confira se a tabela bucket_items existe no Supabase.'); setItems(current => current ?? []) }), [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.clearInterval(timer.current); window.clearTimeout(noticeTimer.current) }
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
    if (await create(form)) { setForm(current => ({ ...current, title: '' })); setLastIdea(null); setView(current => (current.status === 'done' ? { ...current, status: 'todo' } : current)) }
  }
  const suggest = () => {
    const idea = pickIdea(items || [], lastIdea)
    if (!idea) { flash('Vocês já usaram todas as sugestões. Agora é por conta de vocês.'); return }
    setLastIdea(idea.id); setForm({ title: idea.text, category: idea.category, level: idea.level })
  }
  const save = async (id, patch) => {
    try { const updated = await updateItem(id, patch); setItems(list => list.map(item => (item.id === id ? updated : item))); setError(''); flash('Salvo.'); return true }
    catch (err) { console.error(err); fail('Não foi possível salvar. Tente de novo.'); return false }
  }
  const toggle = async item => {
    const done = !item.done
    if (await save(item.id, { done, doneAt: done ? new Date().toISOString() : null }) && done) { flash('Feita! Dá para editar e guardar a lembrança e as fotos.'); setDraw(current => (current.chosen?.id === item.id ? { ...current, chosen: null } : current)) }
  }
  const remove = async item => {
    try {
      await removeItem(item.id)
      const el = document.getElementById(`item-${item.id}`)
      if (el && !reduceMotion()) { el.style.height = `${el.offsetHeight}px`; void el.offsetHeight; el.classList.add('is-leaving'); await new Promise(resolve => window.setTimeout(resolve, 380)) }
      setItems(list => list.filter(entry => entry.id !== item.id)); flash('Ideia removida.')
    } catch (err) { console.error(err); fail('Não foi possível excluir. Tente de novo.') }
  }

  const pool = roulettePool(items || [], { maxLevel: draw.maxLevel, category: view.category })
  const land = pick => {
    setDraw(current => ({ ...current, running: false, flash: null, chosen: pick }))
    window.setTimeout(() => document.getElementById(`item-${pick.id}`)?.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }), 60)
  }
  const drawNow = () => {
    if (draw.running || !pool.length) return
    window.clearInterval(timer.current)
    setView(current => (current.status === 'done' ? { ...current, status: 'todo' } : current))
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (reduceMotion()) { land(pick); return }
    setDraw(current => ({ ...current, running: true, chosen: null }))
    let ticks = 0
    timer.current = window.setInterval(() => {
      ticks += 1
      if (ticks >= 18) { window.clearInterval(timer.current); land(pick) } else setDraw(current => ({ ...current, flash: pool[ticks % pool.length].id }))
    }, 90)
  }

  const all = items || []
  const total = counts(all)
  const inStatus = all.filter(item => view.status === 'all' || (view.status === 'done') === item.done)
  const byCategory = counts(inStatus).byCategory
  const visible = inStatus.filter(item => !view.category || item.category === view.category).sort((a, b) => Number(a.done) - Number(b.done))
  const sentence = items === null ? 'Abrindo a lista…' : `${total.todo} para fazer, ${total.done} ${total.done === 1 ? 'feita' : 'feitas'}.`

  return <main className="bk-page site-shell">
    <div className="ambient-orb bk-orb bk-orb-a" aria-hidden="true" />
    <div className="ambient-orb bk-orb bk-orb-b" aria-hidden="true" />
    <header className="links-header bk-header">
      <button type="button" className="text-button" onClick={onBack}><ArrowLeft size={16} />Nossos links</button>
      <span>rebeca <Heart size={16} fill="currentColor" aria-hidden="true" /><button type="button" className="text-button" onClick={onLogout}><LogOut size={14} aria-hidden="true" />sair</button></span>
    </header>
    <div className="bk-layout">
    <aside className="bk-side">
      <div className="bk-side-main">
        <h1>Nossa lista<span>.</span></h1>
        <p className="bk-count" aria-live="polite">{sentence}</p>
        <nav aria-label="Categorias">
          <ul className="bk-nav">
            <li><button type="button" aria-current={!view.category} onClick={() => setView({ ...view, category: '' })}><span>Tudo</span><b>{inStatus.length}</b></button></li>
            {CATEGORIES.map(category => <li key={category.key}><button type="button" aria-current={view.category === category.key} onClick={() => setView({ ...view, category: category.key })}><span>{category.label}</span><b>{byCategory[category.key]}</b></button></li>)}
          </ul>
        </nav>
        <div className="bk-draw">
          <button type="button" className="bk-draw-button" disabled={draw.running || !pool.length} onClick={drawNow}>{draw.running ? 'Sorteando…' : draw.chosen ? 'Sortear outra' : 'Sortear uma para hoje'}<span aria-hidden="true">→</span></button>
          <label>até o nível
            <select value={draw.maxLevel} onChange={event => setDraw({ ...draw, maxLevel: Number(event.target.value), chosen: null })}>{LEVELS.map(level => <option key={level.value} value={level.value}>{level.value} · {level.label}</option>)}</select>
          </label>
          {items !== null && !pool.length && <p>Nenhuma ideia pendente com esse filtro.</p>}
        </div>
      </div>
    </aside>

    <section className="bk-main" aria-labelledby="bk-compose-title">
      <form className="bk-compose" onSubmit={submit}>
        <label id="bk-compose-title" htmlFor="bk-new" className="sr-only">Nova ideia</label>
        <input id="bk-new" className="bk-compose-input" maxLength={140} autoComplete="off" placeholder="Eu quero…" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
        <div className="bk-compose-row">
          <div className="bk-cats" role="radiogroup" aria-label="Categoria">
            {CATEGORIES.map(category => <button key={category.key} type="button" role="radio" aria-checked={form.category === category.key} onClick={() => setForm({ ...form, category: category.key })}>{category.label}</button>)}
          </div>
        </div>
        <div className="bk-compose-row">
          <Level value={form.level} onChange={level => setForm({ ...form, level })} />
          <button type="button" className="bk-text-button" onClick={suggest}>Sem ideia? Sugerir uma</button>
          <button type="submit" className="bk-primary" disabled={adding}>{adding ? 'Adicionando…' : 'Adicionar'}</button>
        </div>
      </form>

      <p role="status" className="bk-status" key={notice}>{notice}</p>
      {error && <div role="alert" className="bk-error">{error} <button type="button" className="bk-text-button" onClick={() => { setError(''); load() }}>Tentar de novo</button></div>}

      <div className="bk-toolbar" role="group" aria-label="Situação">
        {[['todo', 'Para fazer', total.todo], ['done', 'Feitas', total.done], ['all', 'Todas', total.total]].map(([key, label, n]) => <button key={key} type="button" aria-pressed={view.status === key} onClick={() => { setView({ ...view, status: key }); setDraw(current => ({ ...current, chosen: null })) }}>{label} <b>{n}</b></button>)}
      </div>

      {draw.chosen && <div className="bk-pick" role="status"><p><span>Hoje</span>{draw.chosen.title}</p><button type="button" className="bk-text-button" onClick={() => toggle(draw.chosen)}>Já fizemos</button><button type="button" className="bk-text-button" onClick={() => setDraw({ ...draw, chosen: null })}>Limpar</button></div>}

      {items === null ? <p className="bk-empty">Abrindo a lista…</p>
        : visible.length ? <ul className={`bk-list ${draw.chosen ? 'has-pick' : ''}`}>{visible.map((item, index) => <Item key={item.id} item={item} index={index} me={me} picked={draw.chosen?.id === item.id} flash={draw.flash === item.id} onSave={save} onToggle={toggle} onRemove={remove} onError={fail} />)}</ul>
          : <p className="bk-empty">{all.length ? 'Nada por aqui com esse filtro.' : 'Ainda não tem nada. Escreva a primeira ideia acima.'}</p>}
    </section>
    </div>
  </main>
}
