import { useContext, useEffect, useState } from 'react'
import { Check, Lock, LockOpen, Send } from 'lucide-react'
import IconByKey from './IconByKey'
import { useBlockResponse } from './responsesContext'
import Inline from './Inline'
import { EditingContext } from './blockStyle'

function Status({ status, persist, onRetry }) {
  if (status === 'saving') return <p className="ix-status" role="status">Salvando…</p>
  if (status === 'saved') return <p className="ix-status ok" role="status"><Check size={13} aria-hidden="true" />Resposta salva</p>
  if (status === 'error') return <p className="ix-status bad" role="alert">Não consegui salvar. <button type="button" onClick={onRetry}>Tentar de novo</button></p>
  if (status === 'local' && !persist) return <p className="ix-status" role="status">Modo de teste: esta resposta não é salva.</p>
  return null
}

function Choice({ block }) {
  const { props: p, type } = block
  const { value, status, persist, save } = useBlockResponse(block.id)
  const multiple = type === 'poll' && p.multiple
  const chosen = multiple ? (Array.isArray(value) ? value : []) : value
  const isOn = id => (multiple ? chosen.includes(id) : chosen === id)
  const pick = id => save(multiple ? (chosen.includes(id) ? chosen.filter(x => x !== id) : [...chosen, id]) : id)
  const answered = multiple ? chosen.length > 0 : Boolean(chosen)
  return <div className="ix">
    <p className="ix-question" id={`q-${block.id}`}><Inline block={block} field="question" placeholder="Pergunta" /></p>
    <div className="ix-options" role={multiple ? 'group' : 'radiogroup'} aria-labelledby={`q-${block.id}`}>
      {(p.options || []).map(option => multiple
        ? <button key={option.id} type="button" className="ix-option" aria-pressed={isOn(option.id)} onClick={() => pick(option.id)}>{option.label}</button>
        : <button key={option.id} type="button" role="radio" className="ix-option" aria-checked={isOn(option.id)} onClick={() => pick(option.id)}>{option.label}</button>)}
    </div>
    {answered && status !== 'error' && p.thanks && <p className="ix-thanks">{p.thanks}</p>}
    <Status status={status} persist={persist} onRetry={() => save(value)} />
  </div>
}

function Question({ block }) {
  const { props: p } = block
  const { value, status, persist, save } = useBlockResponse(block.id)
  const [draft, setDraft] = useState(null)
  const text = draft ?? (typeof value === 'string' ? value : '')
  const sent = typeof value === 'string' && value === text && value !== ''
  return <form className="ix" onSubmit={event => { event.preventDefault(); if (text.trim()) { save(text.trim()); setDraft(null) } }}>
    <label className="ix-question" htmlFor={`a-${block.id}`}><Inline block={block} field="prompt" placeholder="Pergunta" /></label>
    <textarea id={`a-${block.id}`} className="ix-input" rows={3} maxLength={600} placeholder={p.placeholder} value={text} onChange={event => setDraft(event.target.value)} />
    <div className="ix-row"><button type="submit" className="call-join filled" disabled={!text.trim() || sent || status === 'saving'}><Send size={15} aria-hidden="true" />{p.button || 'Enviar'}</button></div>
    {sent && status !== 'error' && p.thanks && <p className="ix-thanks">{p.thanks}</p>}
    <Status status={status} persist={persist} onRetry={() => save(value)} />
  </form>
}

function Checklist({ block }) {
  const { props: p } = block
  const editing = useContext(EditingContext)
  const { value, status, persist, save } = useBlockResponse(block.id)
  const done = Array.isArray(value) ? value : []
  const toggle = id => save(done.includes(id) ? done.filter(x => x !== id) : [...done, id])
  return <div className="ix">
    {(p.label || editing) && <h2 className="b-label"><Inline block={block} field="label" placeholder="Título" multiline={false} /></h2>}
    <ul className="ix-checklist">
      {(p.items || []).map(item => <li key={item.id}><label><input type="checkbox" checked={done.includes(item.id)} onChange={() => toggle(item.id)} /><span>{item.name}</span></label></li>)}
    </ul>
    <Status status={status} persist={persist} onRetry={() => save(done)} />
  </div>
}

function Quiz({ block }) {
  const { props: p } = block
  const { value, status, persist, save } = useBlockResponse(block.id)
  const right = value && value === p.correctId
  return <div className="ix">
    <p className="ix-question" id={`q-${block.id}`}><Inline block={block} field="question" placeholder="Pergunta" /></p>
    <div className="ix-options" role="radiogroup" aria-labelledby={`q-${block.id}`}>
      {(p.options || []).map(option => <button key={option.id} type="button" role="radio" aria-checked={value === option.id} className={`ix-option ${value === option.id ? (right ? 'right' : 'wrong') : ''}`} onClick={() => save(option.id)}>{option.label}</button>)}
    </div>
    {value && <p className="ix-thanks" role="status">{right ? p.right : p.wrong}</p>}
    <Status status={status} persist={persist} onRetry={() => save(value)} />
  </div>
}

function Reveal({ block }) {
  const { props: p } = block
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [attempt, setAttempt] = useState('')
  const [miss, setMiss] = useState(false)
  const unlockAt = new Date(p.unlockAt).getTime()
  useEffect(() => {
    if (p.mode !== 'date') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [p.mode])
  const dateReady = p.mode === 'date' && Number.isFinite(unlockAt) && now >= unlockAt
  const shown = open || dateReady
  if (shown) return <div className="ix ix-revealed"><LockOpen size={18} aria-hidden="true" />{p.title && <h2>{p.title}</h2>}<p>{p.text}</p></div>
  if (p.mode === 'date') {
    const left = Math.max(0, unlockAt - now)
    const pad = n => String(n).padStart(2, '0')
    const d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), m = Math.floor(left % 3600000 / 60000), sec = Math.floor(left % 60000 / 1000)
    return <div className="ix ix-locked"><Lock size={18} aria-hidden="true" /><p>{p.button || 'Ainda está trancado'}</p><strong>{Number.isFinite(unlockAt) ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : 'Defina a data de abertura'}</strong></div>
  }
  if (p.mode === 'code') {
    return <form className="ix ix-locked" onSubmit={event => { event.preventDefault(); if (attempt.trim().toLowerCase() === String(p.code).trim().toLowerCase()) setOpen(true); else setMiss(true) }}>
      <Lock size={18} aria-hidden="true" /><label htmlFor={`c-${block.id}`}>{p.button || 'Digite a senha'}</label>
      <div className="ix-row"><input id={`c-${block.id}`} className="ix-input" value={attempt} onChange={event => { setAttempt(event.target.value); setMiss(false) }} autoComplete="off" /><button type="submit" className="call-join filled">Abrir</button></div>
      {p.hint && <small>Dica: {p.hint}</small>}
      {miss && <p className="ix-status bad" role="alert">Não é essa… tenta de novo.</p>}
    </form>
  }
  return <button type="button" className="ix-reveal" onClick={() => setOpen(true)}><Lock size={18} aria-hidden="true" />{p.button || 'Toque para revelar'}</button>
}

function Surprise({ block }) {
  const { props: p } = block
  const [burst, setBurst] = useState(0)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!burst) return
    const timer = window.setTimeout(() => setBurst(0), 2200)
    return () => window.clearTimeout(timer)
  }, [burst])
  const hearts = Array.from({ length: 16 }, (_, i) => i)
  return <div className="ix ix-surprise">
    <button type="button" className="call-join filled" onClick={() => { setShown(true); setBurst(Date.now()) }}><IconByKey name={p.icon || 'heart'} size={16} aria-hidden="true" />{p.label || 'Aperte aqui'}</button>
    {shown && p.message && <p className="ix-thanks" role="status">{p.message}</p>}
    {burst > 0 && <span className="ix-burst" key={burst} aria-hidden="true">{hearts.map(i => <i key={i} style={{ '--x': `${(i - 7.5) * 14 + (i % 3) * 6}px`, '--d': `${(i % 5) * 60}ms`, '--s': `${14 + (i % 4) * 5}px` }}><IconByKey name={p.icon || 'heart'} size="1em" /></i>)}</span>}
  </div>
}

export default function InteractiveContent({ block }) {
  switch (block.type) {
    case 'rsvp':
    case 'poll': return <Choice block={block} />
    case 'question': return <Question block={block} />
    case 'checklist': return <Checklist block={block} />
    case 'quiz': return <Quiz block={block} />
    case 'reveal': return <Reveal block={block} />
    case 'surprise': return <Surprise block={block} />
    default: return null
  }
}
