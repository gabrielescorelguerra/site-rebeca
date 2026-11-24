import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Download, Pencil, Play, Save, Trash2 } from 'lucide-react'
import { fromCard, loadLibrary, toCard, updateLibrary } from '../data/callLibrary'

const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }

// Cards de ligação guardados: salve a call atual, deixe pronta e ative quando quiser.
export default function CardsPanel({ current, onOpen, onActivate }) {
  const [cards, setCards] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')

  const refresh = useCallback(() => {
    loadLibrary().then(({ cards: loaded }) => { setError(''); setCards(loaded) }).catch(err => { setError(err.message || 'Não foi possível carregar os cards.'); setCards([]) })
  }, [])
  useEffect(() => { refresh() }, [refresh])

  const run = async (change, done) => {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { const result = await updateLibrary(change); setCards(result.cards); if (done) setNotice(done) } catch (err) { console.error(err); setError('Não foi possível salvar na biblioteca. Tente de novo.') } finally { setBusy(false) }
  }

  const saveNew = () => run(list => [toCard(current(), name), ...list], 'Card guardado. Ele ainda não está no ar.').then(() => setName(''))
  const overwrite = card => run(list => list.map(item => (item.id === card.id ? toCard(current(), item.name, item) : item)), `“${card.name}” atualizado com o que está no editor.`)
  const rename = card => { const next = window.prompt('Novo nome do card', card.name); if (next?.trim()) run(list => list.map(item => (item.id === card.id ? { ...item, name: next.trim().slice(0, 80) } : item)), 'Nome alterado.') }
  const remove = card => { if (window.confirm(`Excluir o card “${card.name}”? Isso não afeta a call que está no ar.`)) run(list => list.filter(item => item.id !== card.id), 'Card excluído.') }

  return <div className="cards-panel">
    <p className="section-help">Deixe convites prontos aqui e ative quando for a hora. Ativar publica o card no lugar da call atual (a atual fica guardada).</p>
    <div className="cards-save">
      <input className="admin-input" aria-label="Nome do novo card" placeholder="Nome (ex.: Noite de filme)" value={name} maxLength={80} onChange={event => setName(event.target.value)} />
      <button type="button" className="secondary-button" disabled={busy || !cards} onClick={saveNew}><Save size={14} />Guardar o editor como card</button>
    </div>
    {notice && <p className="cards-note" role="status">{notice}</p>}
    {error && <p className="cards-note is-error" role="alert">{error} <button type="button" className="text-button" onClick={refresh}>Recarregar</button></p>}
    {cards === null && <p className="section-help" role="status">Carregando cards…</p>}
    {cards?.length === 0 && !error && <p className="section-help">Nenhum card guardado ainda.</p>}
    <ul className="cards-list">
      {cards?.map(card => <li key={card.id} className="saved-card">
        <strong>{card.name}</strong>
        <small><CalendarClock size={11} aria-hidden="true" /> {card.planning.hasPlannedCall === false ? 'sem call marcada' : card.planning.date ? dateLabel(card.planning.date) : 'sem data'} · guardado {dateLabel(card.savedAt)}</small>
        <div className="saved-card-actions">
          <button type="button" className="secondary-button" disabled={busy} onClick={() => onActivate(fromCard(card), card)}><Play size={13} />Ativar</button>
          <button type="button" className="secondary-button" disabled={busy} onClick={() => onOpen(fromCard(card), card)}><Download size={13} />Abrir no editor</button>
          <button type="button" aria-label={`Atualizar ${card.name} com o editor`} title="Atualizar com o que está no editor" disabled={busy} onClick={() => overwrite(card)}><Save size={13} /></button>
          <button type="button" aria-label={`Renomear ${card.name}`} title="Renomear" disabled={busy} onClick={() => rename(card)}><Pencil size={13} /></button>
          <button type="button" aria-label={`Excluir ${card.name}`} title="Excluir" disabled={busy} onClick={() => remove(card)}><Trash2 size={13} /></button>
        </div>
      </li>)}
    </ul>
  </div>
}
