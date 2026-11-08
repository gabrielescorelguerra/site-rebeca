import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Heart, Plus, Save, Trash2 } from 'lucide-react'
import { ADMIN_AUTHENTICATED_KEY, AUTHENTICATED_KEY } from './data/planning'
import { loadLinks, saveLinks, validLink } from './data/relationshipLinks'

export default function Links() {
  const admin = localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true'
  const authenticated = admin || localStorage.getItem(AUTHENTICATED_KEY) === 'true'
  const [links, setLinks] = useState([])
  const [baseline, setBaseline] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const dirty = baseline !== null && JSON.stringify(links) !== baseline

  useEffect(() => {
    if (!authenticated) return
    let active = true
    loadLinks().then(items => {
      if (active) { setLinks(items); setBaseline(JSON.stringify(items)); setStatus('ready') }
    }).catch(() => { if (active) { setError('Não foi possível carregar nossos links. Tente novamente.'); setStatus('error') } })
    return () => { active = false }
  }, [authenticated, attempt])

  useEffect(() => {
    if (!dirty) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (id, key, value) => { setLinks(items => items.map(item => item.id === id ? { ...item, [key]: value } : item)); setStatus('ready') }
  const save = async event => {
    event.preventDefault()
    if (!admin || status === 'saving') return
    const cleaned = links.map(item => ({ ...item, title: item.title.trim(), url: item.url.trim(), description: item.description.trim() }))
    if (cleaned.some(item => !item.title || !validLink(item.url))) { setError('Preencha os títulos e use endereços completos com https:// ou http://.'); return }
    setStatus('saving'); setError('')
    try { await saveLinks(cleaned); setLinks(cleaned); setBaseline(JSON.stringify(cleaned)); setStatus('saved') }
    catch { setError('Não foi possível salvar. Suas alterações continuam aqui para tentar novamente.'); setStatus('ready') }
  }

  if (!authenticated) return <Navigate to="/autenticacao" state={{ from: '/links' }} replace />
  return <main className="site-shell links-shell">
    <header className="links-header"><Link className="text-button" to="/" onClick={event => { if (dirty && !window.confirm('Sair sem salvar as alterações?')) event.preventDefault() }}><ArrowLeft size={16} />Voltar</Link><span>rebeca <Heart size={16} fill="currentColor" aria-hidden="true" /></span></header>
    <section className="links-content page-transition" aria-labelledby="links-title">
      <p className="eyebrow">um cantinho para guardar o que importa</p>
      <h1 id="links-title">Nossos links<span>.</span></h1>
      <p className="links-intro">Lugares, planos e pequenos detalhes que fazem parte da nossa história.</p>
      <p role="status" className="section-help">{status === 'loading' ? 'Carregando nossos links…' : status === 'saving' ? 'Salvando…' : status === 'saved' ? 'Links salvos. Já estão disponíveis para todos.' : dirty ? 'Você tem alterações ainda não salvas.' : ''}</p>
      {error && <div role="alert" className="studio-notice">{error}{status === 'error' && <button onClick={() => { setError(''); setStatus('loading'); setAttempt(value => value + 1) }}>Tentar novamente</button>}</div>}
      {baseline !== null && (admin ? <form onSubmit={save}>
        <fieldset disabled={status === 'saving'} className="links-editor">
          {links.map((item, index) => <div className="editor-card" key={item.id}>
            <div className="item-heading"><span>LINK {String(index + 1).padStart(2, '0')}</span><button type="button" aria-label={`Remover ${item.title || 'link'}`} onClick={() => setLinks(items => items.filter(link => link.id !== item.id))}><Trash2 size={16} /></button></div>
            <label>Título<input className="admin-input" required maxLength={120} value={item.title} onChange={event => update(item.id, 'title', event.target.value)} placeholder="Nossa playlist" /></label>
            <label>Endereço<input className="admin-input" required type="url" value={item.url} onChange={event => update(item.id, 'url', event.target.value)} placeholder="https://" /></label>
            <label>Uma pequena descrição (opcional)<textarea className="admin-input" maxLength={300} rows={2} value={item.description} onChange={event => update(item.id, 'description', event.target.value)} /></label>
          </div>)}
          {!links.length && <div className="links-empty"><Heart aria-hidden="true" /><h2>Todo carinho merece um lugar.</h2><p>Adicione o primeiro link da nossa história.</p></div>}
          <div className="links-actions"><button type="button" className="secondary-button" onClick={() => setLinks(items => [...items, { id: crypto.randomUUID(), title: '', url: '', description: '' }])}><Plus size={16} />Adicionar link</button><button type="submit" className="studio-save" disabled={!dirty}><Save size={16} />Salvar links</button></div>
        </fieldset>
      </form> : <div className="links-grid">{links.length ? links.map(item => validLink(item.url) && <a className="relationship-card" key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><Heart size={20} aria-hidden="true" /><h2>{item.title}</h2>{item.description && <p>{item.description}</p>}<span>Abrir link <ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only"> em uma nova aba</span></span></a>) : <div className="links-empty"><Heart aria-hidden="true" /><h2>Nosso cantinho está esperando.</h2><p>Em breve, os links especiais vão aparecer por aqui.</p></div>}</div>)}
      <footer className="links-footer">feito com carinho · para nós</footer>
    </section>
  </main>
}
