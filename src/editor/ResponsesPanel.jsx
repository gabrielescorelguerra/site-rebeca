import { useEffect, useState } from 'react'
import { clearResponses, loadResponses } from '../data/responses'

function describe(block, value) {
  const p = block.props
  const label = id => p.options?.find(option => option.id === id)?.label || '(opção removida)'
  switch (block.type) {
    case 'rsvp': case 'poll': return Array.isArray(value) ? value.map(label).join(', ') : label(value)
    case 'quiz': return `${label(value)} — ${value === p.correctId ? 'acertou' : 'errou'}`
    case 'question': return String(value)
    case 'checklist': return `${(p.items || []).filter(item => value?.includes(item.id)).map(item => item.name).join(', ') || 'nada marcado'} (${value?.length || 0}/${p.items?.length || 0})`
    default: return JSON.stringify(value)
  }
}

export default function ResponsesPanel({ block, callKey }) {
  const [state, setState] = useState({ status: 'loading', row: null })
  const [version, setVersion] = useState(0)
  const reload = () => { setState({ status: 'loading', row: null }); setVersion(value => value + 1) }
  useEffect(() => {
    let active = true
    loadResponses(callKey).then(rows => { if (active) setState({ status: 'ready', row: rows[block.id] || null }) }).catch(() => { if (active) setState({ status: 'error', row: null }) })
    return () => { active = false }
  }, [callKey, block.id, version])
  const clear = async () => {
    if (!window.confirm('Apagar a resposta dela a este bloco?')) return
    try { await clearResponses(callKey, [block.id]); reload() } catch { setState({ status: 'error', row: null }) }
  }
  return <div className="responses-panel">
    <h3>Resposta dela</h3>
    {state.status === 'loading' && <p className="section-help">Carregando…</p>}
    {state.status === 'error' && <p className="section-help" role="alert">Não foi possível ler as respostas. Confira se a tabela <code>call_responses</code> existe (veja supabase-schema.sql).</p>}
    {state.status === 'ready' && !state.row && <p className="section-help">Ela ainda não respondeu.</p>}
    {state.status === 'ready' && state.row && <dl><dt>{new Date(state.row.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</dt><dd>{describe(block, state.row.value)}</dd></dl>}
    <div className="responses-actions"><button type="button" onClick={reload}>Atualizar</button>{state.row && <button type="button" onClick={clear}>Apagar resposta</button>}</div>
    <p className="section-help">As respostas valem para esta call; “Tratar como nova call” começa em branco.</p>
  </div>
}
