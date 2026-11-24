import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Check, Dices, Lightbulb, Pencil, Plus, Trash2, X } from 'lucide-react'
import { addItem, listItems, removeItem, updateItem } from '../data/bucketList'
import { CATEGORIES, IDEAS, LEVELS, MAX_PHOTOS, badges, categoryOf, pickIdea, progress, roulettePool, tiltOf } from '../data/bucketIdeas'
import { uploadImage } from '../data/media'
import { confetti } from '../utils/confetti'
import '../styles/bucket.css'

const flames = level => '🔥'.repeat(level)
const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) }

function Chips({ value, onChange, allowAll = false, label }) {
  return <div className="bk-chips" role="group" aria-label={label}>
    {allowAll && <button type="button" aria-pressed={!value} onClick={() => onChange('')}>Todas</button>}
    {CATEGORIES.map(item => <button key={item.key} type="button" aria-pressed={value === item.key} onClick={() => onChange(item.key)}><span aria-hidden="true">{item.emoji}</span> {item.label}</button>)}
  </div>
}

function LevelPicker({ value, onChange }) {
  return <div className="bk-level" role="radiogroup" aria-label="Nível de loucura">
    {LEVELS.map(level => <button key={level.value} type="button" role="radio" aria-checked={value === level.value} title={level.label} onClick={() => onChange(level.value)}>{level.value}</button>)}
    <span>{LEVELS.find(level => level.value === value)?.label} <span aria-hidden="true">{flames(value)}</span></span>
  </div>
}

function Note({ item, me, onSave, onToggle, onRemove, onError }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const category = categoryOf(item.category)
  const open = () => { setDraft(item); setEditing(true) }
  const set = patch => setDraft(current => ({ ...current, ...patch }))

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

  return <li className={`bk-note cat-${item.category} ${item.done ? 'is-done' : ''}`} style={{ '--tilt': `${tiltOf(item.id)}deg` }}>
    <span className="bk-tape" aria-hidden="true" />
    {!editing ? <>
      <div className="bk-note-top"><span className="bk-cat"><span aria-hidden="true">{category.emoji}</span> {category.label}</span><span className="bk-flames" title={`Nível ${item.level}`}><span aria-hidden="true">{flames(item.level)}</span><span className="sr-only">Nível de loucura {item.level} de 5</span></span></div>
      <h3>{item.title}</h3>
      {item.note && <p className="bk-text">{item.note}</p>}
      {item.photos.length > 0 && <ul className="bk-photos">{item.photos.map((url, index) => <li key={url} style={{ '--tilt': `${tiltOf(url) * 1.5}deg` }}><a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Foto ${index + 1} de ${item.title}`} loading="lazy" /><span className="sr-only"> (abre em nova aba)</span></a></li>)}</ul>}
      {item.done && <p className="bk-memory">{item.memory ? `“${item.memory}”` : 'Feito! Que tal guardar uma lembrança?'}{item.doneAt && <small>{dateLabel(item.doneAt)}</small>}</p>}
      <div className="bk-note-foot">
        <small>por {item.author === me ? 'você' : me === 'admin' ? 'Rebeca' : 'seu amor'}</small>
        <button type="button" className={`bk-done ${item.done ? 'on' : ''}`} aria-pressed={item.done} onClick={() => onToggle(item)}><Check size={14} aria-hidden="true" />{item.done ? 'Fizemos!' : 'Marcar como feita'}</button>
        <button type="button" className="bk-icon" aria-label={`Editar ${item.title}`} onClick={open}><Pencil size={14} /></button>
      </div>
    </> : <form onSubmit={save} className="bk-edit">
      <label>Título<input className="admin-input" required maxLength={140} value={draft.title} onChange={event => set({ title: event.target.value })} /></label>
      <label>Detalhes (opcional)<textarea className="admin-input" rows={2} maxLength={600} value={draft.note} onChange={event => set({ note: event.target.value })} /></label>
      <label>Lembrança{!item.done && ' (para depois de fazer)'}<textarea className="admin-input" rows={2} maxLength={1000} placeholder="Como foi?" value={draft.memory} onChange={event => set({ memory: event.target.value })} /></label>
      <Chips value={draft.category} onChange={category => set({ category })} label="Categoria" />
      <LevelPicker value={draft.level} onChange={level => set({ level })} />
      <div className="bk-edit-photos">
        {draft.photos.map((url, index) => <span key={url}><img src={url} alt={`Foto ${index + 1}`} /><button type="button" aria-label={`Remover foto ${index + 1}`} onClick={() => set({ photos: draft.photos.filter(photo => photo !== url) })}><X size={12} /></button></span>)}
        {draft.photos.length < MAX_PHOTOS && <label className="bk-upload"><Camera size={16} aria-hidden="true" />{uploading ? 'Enviando…' : 'Adicionar foto'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading} onChange={event => { addPhotos(event.target.files); event.target.value = '' }} /></label>}
      </div>
      <div className="bk-edit-actions">
        <button type="button" className="bk-danger" onClick={() => { if (window.confirm(`Excluir “${item.title}”?`)) onRemove(item) }}><Trash2 size={14} aria-hidden="true" />Excluir</button>
        <button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancelar</button>
        <button type="submit" className="studio-save" disabled={busy || uploading}>{busy ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>}
  </li>
}

export default function BucketList({ role }) {
  const me = role === 'admin' ? 'admin' : 'user'
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState({ category: '', status: 'all' })
  const [form, setForm] = useState({ title: '', category: 'bobagem', level: 2, note: '' })
  const [adding, setAdding] = useState(false)
  const [idea, setIdea] = useState(null)
  const [spin, setSpin] = useState({ running: false, shown: null, chosen: null, maxLevel: 5, category: '' })
  const timer = useRef(null)

  const load = useCallback(() => listItems().then(list => { setItems(list); setError('') }).catch(err => { console.error(err); setError('Não foi possível carregar a lista. Confira se a tabela bucket_items foi criada (veja supabase-schema.sql).'); setItems(current => current ?? []) }), [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.clearInterval(timer.current) }
  }, [load])

  const flash = text => { setNotice(text); window.setTimeout(() => setNotice(current => (current === text ? '' : current)), 4000) }
  const fail = text => { setError(text); setNotice('') }

  const create = async (values) => {
    setAdding(true); setError('')
    try {
      const created = await addItem({ ...values, title: values.title.trim(), author: me })
      setItems(list => [created, ...(list || [])]); flash('Ideia colada no caderno.'); return true
    } catch (err) { console.error(err); fail('Não foi possível adicionar. Tente de novo.'); return false } finally { setAdding(false) }
  }
  const submit = async event => {
    event.preventDefault()
    if (!form.title.trim()) { fail('Escreva a ideia primeiro.'); return }
    if (await create(form)) setForm(current => ({ ...current, title: '', note: '' }))
  }
  const save = async (id, patch) => {
    try { const updated = await updateItem(id, patch); setItems(list => list.map(item => (item.id === id ? updated : item))); setError(''); flash('Salvo.'); return true } catch (err) { console.error(err); fail('Não foi possível salvar. Tente de novo.'); return false }
  }
  const toggle = async item => {
    const done = !item.done
    const ok = await save(item.id, { done, doneAt: done ? new Date().toISOString() : null })
    if (ok && done) { confetti(); flash('Riscada da lista! Que tal guardar uma lembrança ou foto?') }
  }
  const remove = async item => {
    try { await removeItem(item.id); setItems(list => list.filter(entry => entry.id !== item.id)); flash('Ideia removida.') } catch (err) { console.error(err); fail('Não foi possível excluir. Tente de novo.') }
  }

  const nextIdea = () => setIdea(current => pickIdea(items || [], current?.id) || { id: -1, text: 'Vocês já usaram todas as minhas ideias! Agora é com vocês.', category: 'sonho', level: 1, empty: true })
  const useIdea = async () => { if (!idea || idea.empty) return; if (await create({ title: idea.text, category: idea.category, level: idea.level, note: '' })) nextIdea() }

  const pool = roulettePool(items || [], spin)
  const spinNow = () => {
    if (spin.running || !pool.length) return
    window.clearInterval(timer.current)
    const finalPick = pool[Math.floor(Math.random() * pool.length)]
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setSpin(s => ({ ...s, shown: finalPick, chosen: finalPick, running: false })); return }
    setSpin(s => ({ ...s, running: true, chosen: null }))
    let ticks = 0
    timer.current = window.setInterval(() => {
      ticks += 1
      if (ticks >= 22) { window.clearInterval(timer.current); setSpin(s => ({ ...s, running: false, shown: finalPick, chosen: finalPick })); confetti(['#bd7184', '#ffd98a']) }
      else setSpin(s => ({ ...s, shown: pool[ticks % pool.length] }))
    }, 90)
  }

  const list = (items || []).filter(item => (!filter.category || item.category === filter.category) && (filter.status === 'all' || (filter.status === 'done') === item.done))
  const stats = progress(items || [])
  const earned = badges(items || [])

  return <section className="bk" aria-labelledby="bucket-title">
    <h1 id="bucket-title" className="bk-title">Nossa lista<span>.</span></h1>
    <p className="links-intro">Sonhos, bobagens e coisas que a gente quer fazer juntas. Qualquer uma pode colar uma ideia aqui.</p>
    <p role="status" className="section-help">{items === null ? 'Abrindo o caderno…' : notice}</p>
    {error && <div role="alert" className="studio-notice">{error}<button type="button" onClick={() => { setError(''); load() }}>Tentar novamente</button></div>}

    {items !== null && <>
      <div className="bk-score">
        <div><strong>{stats.done}</strong> de <strong>{stats.total}</strong> feitas</div>
        <div className="bk-bar" role="progressbar" aria-label="Progresso da lista" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.percent}><i style={{ width: `${stats.percent}%` }} /></div>
        <ul className="bk-badges" aria-label="Conquistas">{earned.map(badge => <li key={badge.key} className={badge.earned ? 'on' : ''} title={badge.earned ? badge.label : `Ainda não: ${badge.label}`}><span aria-hidden="true">{badge.emoji}</span><span className={badge.earned ? '' : 'sr-only'}>{badge.label}</span>{!badge.earned && <span className="sr-only"> (ainda não conquistada)</span>}</li>)}</ul>
      </div>

      <form className="bk-add" onSubmit={submit}>
        <label className="bk-add-title"><span className="sr-only">Nova ideia</span><input className="admin-input" maxLength={140} placeholder="Uma ideia boba, um sonho, uma vontade…" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
        <Chips value={form.category} onChange={category => setForm({ ...form, category })} label="Categoria da nova ideia" />
        <LevelPicker value={form.level} onChange={level => setForm({ ...form, level })} />
        <button type="submit" className="studio-save" disabled={adding}><Plus size={16} aria-hidden="true" />{adding ? 'Colando…' : 'Colar no caderno'}</button>
      </form>

      <div className="bk-tools">
        <section className="bk-tool" aria-labelledby="idea-title">
          <h2 id="idea-title"><Lightbulb size={16} aria-hidden="true" />Sem ideia?</h2>
          {idea ? <div aria-live="polite" className="bk-tool-result"><p><span aria-hidden="true">{categoryOf(idea.category).emoji}</span> {idea.text}</p>{!idea.empty && <small>{LEVELS.find(level => level.value === idea.level).label} <span aria-hidden="true">{flames(idea.level)}</span></small>}</div> : <p className="bk-hint">Sorteio com {IDEAS.length} ideias prontas.</p>}
          <div className="bk-tool-actions">
            <button type="button" className="secondary-button" onClick={nextIdea}>{idea ? 'Outra' : 'Me dá uma ideia'}</button>
            {idea && !idea.empty && <button type="button" className="secondary-button" disabled={adding} onClick={useIdea}><Plus size={14} aria-hidden="true" />Adicionar à lista</button>}
          </div>
        </section>

        <section className="bk-tool" aria-labelledby="spin-title">
          <h2 id="spin-title"><Dices size={16} aria-hidden="true" />O que fazemos hoje?</h2>
          <div className="bk-spin-filters">
            <label>Até onde vai a loucura<select className="admin-input" value={spin.maxLevel} onChange={event => setSpin(s => ({ ...s, maxLevel: Number(event.target.value), chosen: null }))}>{LEVELS.map(level => <option key={level.value} value={level.value}>{level.value} · {level.label}</option>)}</select></label>
            <label>Categoria<select className="admin-input" value={spin.category} onChange={event => setSpin(s => ({ ...s, category: event.target.value, chosen: null }))}><option value="">Qualquer uma</option>{CATEGORIES.map(item => <option key={item.key} value={item.key}>{item.emoji} {item.label}</option>)}</select></label>
          </div>
          <div className={`bk-tool-result bk-wheel ${spin.running ? 'is-spinning' : ''}`} aria-live="polite">{spin.shown ? <p>{spin.running ? spin.shown.title : <>Hoje: <strong>{spin.shown.title}</strong></>}</p> : <p className="bk-hint">{pool.length ? `${pool.length} ${pool.length === 1 ? 'ideia pendente cabe' : 'ideias pendentes cabem'} aqui.` : 'Nenhuma ideia pendente com esses filtros.'}</p>}</div>
          <div className="bk-tool-actions">
            <button type="button" className="secondary-button" disabled={spin.running || !pool.length} onClick={spinNow}>{spin.chosen ? 'Girar de novo' : 'Girar'}</button>
            {spin.chosen && !spin.running && <button type="button" className="secondary-button" onClick={() => { toggle(spin.chosen); setSpin(s => ({ ...s, chosen: null, shown: null })) }}><Check size={14} aria-hidden="true" />Já fizemos!</button>}
          </div>
        </section>
      </div>

      <div className="bk-filters">
        <Chips value={filter.category} allowAll onChange={category => setFilter({ ...filter, category })} label="Filtrar por categoria" />
        <div className="bk-chips" role="group" aria-label="Filtrar por situação">
          {[['all', 'Tudo'], ['todo', 'Falta fazer'], ['done', 'Já fizemos']].map(([key, label]) => <button key={key} type="button" aria-pressed={filter.status === key} onClick={() => setFilter({ ...filter, status: key })}>{label}</button>)}
        </div>
      </div>

      <div className="bk-book">
        {list.length ? <ul className="bk-notes">{list.map(item => <Note key={item.id} item={item} me={me} onSave={save} onToggle={toggle} onRemove={remove} onError={fail} />)}</ul>
          : <p className="bk-empty">{items.length ? 'Nada com esse filtro por enquanto.' : 'O caderno está em branco. Cole a primeira ideia, ou peça uma ao sorteio!'}</p>}
      </div>
    </>}
  </section>
}
