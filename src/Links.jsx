import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Heart, LogOut, Plus, Save, Trash2 } from 'lucide-react'
import { logout, useAccess } from './lib/access'
import BucketList from './components/BucketList'
import SectionSwitch from './components/SectionSwitch'
import { loadLinks, saveLinks, validLink } from './data/relationshipLinks'

function LinksPanel({ admin, authenticated, onDirty }) {
  const [links, setLinks] = useState([])
  const [baseline, setBaseline] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [conflict, setConflict] = useState(false)
  const dirty = baseline !== null && JSON.stringify(links) !== baseline

  useEffect(() => {
    if (!authenticated) return
    let active = true
    loadLinks().then(({ links: items, updatedAt: version }) => {
      if (active) { setLinks(items); setBaseline(JSON.stringify(items)); setUpdatedAt(version); setConflict(false); setStatus('ready') }
    }).catch(() => { if (active) { setError('Não foi possível carregar nossos links. Tente novamente.'); setStatus('error') } })
    return () => { active = false }
  }, [authenticated, attempt])

  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])

  useEffect(() => {
    if (!dirty) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (id, key, value) => { setLinks(items => items.map(item => item.id === id ? { ...item, [key]: value } : item)); setStatus('ready') }
  const save = async (event, { force = false } = {}) => {
    event?.preventDefault()
    if (!admin || status === 'saving') return
    const cleaned = links.map(item => ({ ...item, title: item.title.trim(), url: item.url.trim(), description: item.description.trim() }))
    if (cleaned.some(item => !item.title || !validLink(item.url))) { setError('Preencha os títulos e use endereços completos com https:// ou http://.'); return }
    setStatus('saving'); setError(''); setConflict(false)
    try { const version = await saveLinks(cleaned, { expectedUpdatedAt: updatedAt, force }); setLinks(cleaned); setBaseline(JSON.stringify(cleaned)); setUpdatedAt(version); setStatus('saved') }
    catch (err) {
      if (err.code === 'CONFLICT') setConflict(true)
      else setError('Não foi possível salvar. Suas alterações continuam aqui para tentar novamente.')
      setStatus('ready')
    }
  }

  return <section className="links-content stagger" aria-labelledby="links-title">

      <h1 id="links-title">Nossos links<span>.</span></h1>
      <p className="links-intro">Os links que a gente quer guardar.</p>
      <p role="status" className="section-help">{status === 'loading' ? 'Carregando nossos links…' : status === 'saving' ? 'Salvando…' : status === 'saved' ? 'Links salvos. Já estão disponíveis para todos.' : dirty ? 'Você tem alterações ainda não salvas.' : ''}</p>
      {error && <div role="alert" className="studio-notice">{error}{status === 'error' && <button onClick={() => { setError(''); setStatus('loading'); setAttempt(value => value + 1) }}>Tentar novamente</button>}</div>}
      {conflict && <div role="alert" className="studio-notice">Os links foram alterados em outro lugar depois que você abriu esta página.<button type="button" onClick={() => { setStatus('loading'); setBaseline(null); setAttempt(value => value + 1) }}>Carregar a versão nova</button><button type="button" onClick={() => save(null, { force: true })}>Salvar os meus mesmo assim</button></div>}
      {baseline !== null && (admin ? <form onSubmit={save}>
        <fieldset disabled={status === 'saving'} className="links-editor">
          {links.map((item, index) => <div className="editor-card" key={item.id}>
            <div className="item-heading"><span>LINK {String(index + 1).padStart(2, '0')}</span><button type="button" aria-label={`Remover ${item.title || 'link'}`} onClick={() => setLinks(items => items.filter(link => link.id !== item.id))}><Trash2 size={16} /></button></div>
            <label>Título<input className="admin-input" required maxLength={120} value={item.title} onChange={event => update(item.id, 'title', event.target.value)} placeholder="Nossa playlist" /></label>
            <label>Endereço<input className="admin-input" required type="url" value={item.url} onChange={event => update(item.id, 'url', event.target.value)} placeholder="https://" /></label>
            <label>Uma pequena descrição (opcional)<textarea className="admin-input" maxLength={300} rows={2} value={item.description} onChange={event => update(item.id, 'description', event.target.value)} /></label>
          </div>)}
          {!links.length && <div className="links-empty"><Heart aria-hidden="true" /><h2>Nenhum link adicionado ainda.</h2><p>Use “Adicionar link” para começar.</p></div>}
          <div className="links-actions"><button type="button" className="secondary-button" onClick={() => setLinks(items => [...items, { id: crypto.randomUUID(), title: '', url: '', description: '' }])}><Plus size={16} />Adicionar link</button><button type="submit" className="studio-save" disabled={!dirty}><Save size={16} />Salvar links</button></div>
        </fieldset>
      </form> : <div className="links-grid">{links.length ? links.map(item => validLink(item.url) && <a className="relationship-card" key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><Heart size={20} aria-hidden="true" /><h2>{item.title}</h2>{item.description && <p>{item.description}</p>}<span>Abrir link <ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only"> em uma nova aba</span></span></a>) : <div className="links-empty"><Heart aria-hidden="true" /><h2>Ainda não temos links aqui.</h2></div>}</div>)}

  </section>
}

const OPTIONS = [{ key: 'links', label: 'Links' }, { key: 'lista', label: 'Lista de desejos' }]

export default function Links() {
  const { admin, authenticated, testing } = useAccess()
  const [params, setParams] = useSearchParams()
  // A lista ainda é só do admin: quem não é admin (inclusive no modo de teste) não vê a escolha nem abre pela URL.
  const wanted = admin && params.get('aba') === 'lista' ? 'lista' : 'links'
  const [shown, setShown] = useState(wanted)
  const [listaVisited, setListaVisited] = useState(wanted === 'lista')
  const [linksDirty, setLinksDirty] = useState(false)
  const role = admin ? 'admin' : testing ? 'test' : 'user'
  const leaving = shown !== wanted
  const dir = wanted === 'lista' ? 1 : -1

  useEffect(() => {
    if (shown === wanted) return undefined
    const timer = window.setTimeout(() => { setShown(wanted); if (wanted === 'lista') setListaVisited(true) }, 240)
    return () => window.clearTimeout(timer)
  }, [wanted, shown])

  if (!authenticated) return <Navigate to="/autenticacao" state={{ from: '/links' }} replace />
  const choose = key => setParams(key === 'lista' ? { aba: 'lista' } : {}, { replace: true })
  const panel = key => `section-panel ${shown === key ? (leaving ? 'is-leaving' : 'is-entering') : ''}`

  return <main className="site-shell links-shell">
    <header className={`links-header ${admin ? 'has-switch' : ''}`}>
      <Link className="text-button" to="/" viewTransition onClick={event => { if (linksDirty && !window.confirm('Sair sem salvar as alterações?')) event.preventDefault() }}><ArrowLeft size={16} />Voltar</Link>
      {admin && <SectionSwitch options={OPTIONS} value={wanted} onChange={choose} label="Seções" />}
      <span>rebeca <Heart size={16} fill="currentColor" aria-hidden="true" /><button type="button" className="text-button" onClick={logout}><LogOut size={14} aria-hidden="true" />sair</button></span>
    </header>
    <div className="section-stage" style={{ '--dir': dir }}>
      <div id="panel-links" role="tabpanel" aria-labelledby="tab-links" className={panel('links')} hidden={shown !== 'links'}><LinksPanel admin={admin} authenticated={authenticated} onDirty={setLinksDirty} /></div>
      {admin && (listaVisited || wanted === 'lista') && <div id="panel-lista" role="tabpanel" aria-labelledby="tab-lista" className={panel('lista')} hidden={shown !== 'lista'}><BucketList role={role} /></div>}
    </div>
  </main>
}
