import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Eye, Heart, Maximize2, Monitor, Redo2, Save, Settings2, Smartphone, Undo2, WandSparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { loadPlanningRecord, savePlanning } from './data/planning'
import { cloneBlock, createBlock, newId, normalizePlanning } from './data/blocks'
import { templates } from './data/templates'
import { validLink } from './utils/url'
import { PlanningCanvas } from './Planning'
import CallPreview from './components/CallPreview'
import { startUserTest, useAccess } from './lib/access'
import { blockLabels } from './editor/blockMeta'
import BlockInspector from './editor/BlockInspector'
import PageInspector from './editor/PageInspector'
import Library from './editor/Library'
import QuickBar from './editor/QuickBar'
import { focusInlineAt } from './components/inlineEdit'
import { useBuilderDrag } from './editor/useBuilderDrag'
import { useHistory } from './editor/useHistory'

const draftKey = 'rebecca-planning-draft-v2'
const withEventId = planning => (planning.eventId ? planning : { ...planning, eventId: newId() })
const isTyping = target => target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
const timeLabel = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }

function validate(planning) {
  if (planning.hasPlannedCall === false) return null
  if (!planning.title.trim() || !planning.date || !Number.isFinite(new Date(planning.date).getTime())) return { message: 'Preencha o nome e a data do encontro em “Página → O encontro”.', page: true }
  for (const block of planning.blocks) {
    const p = block.props || {}
    const where = `${blockLabels[block.type]}: `
    if (block.type === 'button' && p.url && !validLink(p.url)) return { id: block.id, message: `${where}use um endereço começando com https:// ou http://.` }
    if (block.type === 'button' && p.url && !p.label?.trim()) return { id: block.id, message: `${where}escreva o texto do botão.` }
    if (block.type === 'image' && p.url && !validLink(p.url)) return { id: block.id, message: `${where}o endereço da imagem precisa começar com https://.` }
    if (['rsvp', 'poll', 'quiz'].includes(block.type) && (!p.options?.length || p.options.some(option => !option.label.trim()))) return { id: block.id, message: `${where}preencha o texto de todas as opções (e tenha pelo menos uma).` }
    if (block.type === 'quiz' && !p.options?.some(option => option.id === p.correctId)) return { id: block.id, message: `${where}escolha a resposta certa.` }
    if (block.type === 'checklist' && p.items?.some(item => !item.name.trim())) return { id: block.id, message: `${where}dê um nome a cada item.` }
    if (block.type === 'reveal' && p.mode === 'code' && !p.code?.trim()) return { id: block.id, message: `${where}defina a senha.` }
    if (block.type === 'reveal' && p.mode === 'date' && !Number.isFinite(new Date(p.unlockAt).getTime())) return { id: block.id, message: `${where}defina a data em que abre.` }
    if (block.type === 'activities' && p.items?.some(item => !item.name.trim())) return { id: block.id, message: `${where}dê um nome a cada atividade.` }
    if (block.type === 'links' && p.items?.some(item => !item.name.trim() || (item.url && !validLink(item.url)))) return { id: block.id, message: `${where}preencha o nome de cada link e use https:// ou http://.` }
  }
  return null
}

function Admin() {
  const navigate = useNavigate()
  const { admin: authenticated, testing } = useAccess()
  const history = useHistory(null)
  const { present: planning, commit } = history
  const [baseline, setBaseline] = useState(null)
  const [meta, setMeta] = useState({ updatedAt: null, revision: 0 })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [retry, setRetry] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [device, setDevice] = useState('desktop')
  const [animate, setAnimate] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [previewMode, setPreviewMode] = useState(null)
  const [draft, setDraft] = useState(null)
  const [draftStored, setDraftStored] = useState(false)
  const surfaceRef = useRef(null)
  const saveTimer = useRef(null)
  const replayTimer = useRef(null)
  const dirty = baseline !== null && planning !== null && JSON.stringify(planning) !== JSON.stringify(baseline)

  /* ---------- carregar ---------- */
  useEffect(() => {
    if (!authenticated) { navigate(testing ? '/' : '/autenticacao', { replace: true }); return }
    let active = true
    loadPlanningRecord().then(({ planning: loaded, updatedAt }) => {
      if (!active) return
      const value = withEventId(loaded)
      history.reset(value); setBaseline(structuredClone(value)); setMeta({ updatedAt, revision: Number(value.revision) || 0 }); setStatus('ready')
      try { const cached = JSON.parse(localStorage.getItem(draftKey)); if (cached && JSON.stringify(normalizePlanning(cached)) !== JSON.stringify(value)) setDraft(cached) } catch { localStorage.removeItem(draftKey) }
    }).catch(err => { if (active) { setError(err.message || 'Não foi possível carregar a call.'); setStatus('error') } })
    return () => { active = false; window.clearTimeout(saveTimer.current); window.clearTimeout(replayTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, testing, navigate, retry])

  /* ---------- rascunho local e aviso ao sair ---------- */
  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(planning)); setDraftStored(true) } catch { setError('O armazenamento de rascunho está cheio. Publique as alterações para não perdê-las.') }
    }, 500)
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => { window.clearTimeout(timer); window.removeEventListener('beforeunload', warn) }
  }, [planning, dirty])

  /* ---------- edição ---------- */
  const setPage = useCallback((key, value) => { setDraftStored(false); commit(p => ({ ...p, [key]: value }), `page:${key}`) }, [commit])
  const patchPage = useCallback(values => { setDraftStored(false); commit(p => ({ ...p, ...values })) }, [commit])
  const mapBlock = useCallback((id, fn, key) => { setDraftStored(false); commit(p => ({ ...p, blocks: p.blocks.map(b => b.id === id ? fn(b) : b) }), key) }, [commit])

  const api = useMemo(() => ({
    setProps: (id, patch) => mapBlock(id, b => ({ ...b, props: { ...b.props, ...patch } }), `props:${id}:${Object.keys(patch).join(',')}`),
    setStyle: (id, patch) => mapBlock(id, b => ({ ...b, style: { ...b.style, ...patch } }), `style:${id}:${Object.keys(patch).join(',')}`),
    setSpan: (id, span) => mapBlock(id, b => (b.span === span ? b : { ...b, span }), `span:${id}`),
    duplicate: id => {
      const copy = { current: null }
      setDraftStored(false)
      commit(p => {
        const index = p.blocks.findIndex(b => b.id === id)
        if (index < 0) return p
        copy.current = cloneBlock(p.blocks[index])
        return { ...p, blocks: [...p.blocks.slice(0, index + 1), copy.current, ...p.blocks.slice(index + 1)] }
      })
      if (copy.current) setSelectedId(copy.current.id)
    },
    remove: id => { setDraftStored(false); commit(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) })); setSelectedId(current => current === id ? null : current) },
    move: (id, toIndex) => { setDraftStored(false); commit(p => { const from = p.blocks.findIndex(b => b.id === id); if (from < 0 || from === toIndex) return p; const next = [...p.blocks]; const [item] = next.splice(from, 1); next.splice(toIndex, 0, item); return { ...p, blocks: next } }) },
    moveBy: (id, delta) => { setDraftStored(false); commit(p => { const from = p.blocks.findIndex(b => b.id === id); const to = from + delta; if (from < 0 || to < 0 || to >= p.blocks.length) return p; const next = [...p.blocks]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return { ...p, blocks: next } }) },
    insert: (type, index) => {
      const block = createBlock(type)
      setDraftStored(false)
      commit(p => {
        const at = index ?? (selectedId ? p.blocks.findIndex(b => b.id === selectedId) + 1 || p.blocks.length : p.blocks.length)
        return { ...p, blocks: [...p.blocks.slice(0, at), block, ...p.blocks.slice(at)] }
      })
      setSelectedId(block.id)
    },
  }), [commit, mapBlock, selectedId])

  const applyTemplate = key => {
    const template = templates[key]
    setDraftStored(false)
    commit(p => ({ ...p, ...template.page, blocks: template.build() }))
    setSelectedId(null)
  }

  const editText = useCallback(slot => {
    const el = typeof slot === 'string' ? document.querySelector(`[data-block-id="${CSS.escape(slot)}"]`) : slot
    if (!el) return
    const r = el.getBoundingClientRect()
    focusInlineAt(el, r.left + r.width / 2, r.top + r.height / 2)
  }, [])

  const { drag, indicator, resizing, startDrag, startResize, startBody, startRotate, startHeight } = useBuilderDrag({
    surfaceRef, blocks: planning?.blocks ?? [], selectedId, onMove: api.move, onInsert: api.insert, onResize: api.setSpan,
    onStyle: api.setStyle, onSelect: setSelectedId, onEditAt: (slot, x, y) => { if (!focusInlineAt(slot, x, y)) slot.focus() },
  })

  /* ---------- salvar ---------- */
  const save = async ({ force = false } = {}) => {
    if (status === 'saving' || !baseline || !planning) return
    const problem = validate(planning)
    if (problem) { setSelectedId(problem.page ? null : problem.id); setError(problem.message); return }
    window.clearTimeout(saveTimer.current)
    setStatus('saving'); setError(''); setConflict(false)
    const snapshot = structuredClone(planning)
    const config = { ...snapshot, revision: meta.revision + 1 }
    try {
      const updatedAt = await savePlanning(config, { expectedUpdatedAt: meta.updatedAt, force })
      setBaseline(snapshot); setMeta({ updatedAt, revision: config.revision }); setStatus('saved'); setDraft(null); localStorage.removeItem(draftKey)
      saveTimer.current = window.setTimeout(() => setStatus('ready'), 3000)
    } catch (err) {
      setStatus('ready')
      if (err.code === 'CONFLICT') setConflict(true)
      else setError('Não foi possível publicar. Seu rascunho foi mantido; tente novamente.')
    }
  }
  const saveRef = useRef(save)
  useEffect(() => { saveRef.current = save })

  /* ---------- atalhos ---------- */
  useEffect(() => {
    const onKey = event => {
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 's') { event.preventDefault(); saveRef.current() }
      else if (isTyping(event.target)) return
      else if (key === 'z') { event.preventDefault(); event.shiftKey ? history.redo() : history.undo() }
      else if (key === 'y') { event.preventDefault(); history.redo() }
      else if (key === 'd' && selectedId) { event.preventDefault(); api.duplicate(selectedId) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history, selectedId, api])

  const leave = destination => { if (!dirty || window.confirm('Você tem alterações não publicadas. Sair do editor?')) navigate(destination) }
  const testAsUser = () => {
    if (dirty) { try { localStorage.setItem(draftKey, JSON.stringify(planning)) } catch { setError('Não foi possível guardar seu rascunho. Publique as alterações antes de iniciar o teste.'); return } }
    startUserTest()
    navigate('/')
  }
  const replay = () => { setAnimate(true); setReplayKey(value => value + 1); window.clearTimeout(replayTimer.current); replayTimer.current = window.setTimeout(() => setAnimate(false), 6000) }

  if (!authenticated) return null
  const selected = planning?.blocks.find(block => block.id === selectedId) || null
  const editing = {
    selectedId, draggingId: drag?.kind === 'move' ? drag.id : null, animate,
    onSelect: setSelectedId,
    onHandleDown: (event, id) => { setSelectedId(id); startDrag(event, { kind: 'move', id, label: blockLabels[planning.blocks.find(b => b.id === id)?.type] }) },
    onResizeDown: (event, id) => { setSelectedId(id); startResize(event, id) },
    onMoveBy: api.moveBy, onDuplicate: api.duplicate, onRemove: api.remove,
    onBodyDown: startBody, onRotateDown: (event, id) => { setSelectedId(id); startRotate(event, id) }, onHeightDown: (event, id) => { setSelectedId(id); startHeight(event, id) },
    onStyle: api.setStyle, onProps: api.setProps, onEditText: editText,
    onNudge: (id, dx, dy) => { const b = planning.blocks.find(x => x.id === id); api.setStyle(id, { offsetX: (b.style.offsetX || 0) + dx, offsetY: (b.style.offsetY || 0) + dy }) },
  }
  const statusText = status === 'loading' ? 'Carregando sua call…' : status === 'error' ? 'Não foi possível carregar a call' : status === 'saving' ? 'Publicando…'
    : dirty ? `Alterações não publicadas${draftStored ? ' · rascunho guardado só neste navegador' : ''}`
      : status === 'saved' ? 'Publicado agora. Já está disponível para ela.' : meta.updatedAt ? `Publicado às ${timeLabel(meta.updatedAt)}` : 'Ainda não publicada'

  return <main className="studio-shell builder-shell">
    <header className="studio-header">
      <button type="button" className="text-button" onClick={() => leave('/')}><ArrowLeft size={16} />Voltar</button>
      <span className="studio-brand"><Heart size={16} fill="currentColor" />rebeca <span>/</span> editor de call</span>
      <div className="studio-header-actions">
        <button type="button" className="secondary-button" disabled={!planning} onClick={testAsUser}><Eye size={15} />Ver como ela</button>
        <button type="button" className="studio-save" disabled={!dirty || status === 'saving'} onClick={() => save()}><Save size={16} />{status === 'saving' ? 'Publicando…' : 'Publicar'}</button>
      </div>
    </header>
    <div className="builder-status">
      <div className="studio-status" role="status"><span className={dirty ? 'status-dot unsaved' : 'status-dot'} />{statusText}</div>
      {error && <div className="studio-notice" role="alert">{error}{status === 'error' && <button type="button" onClick={() => { setStatus('loading'); setError(''); setRetry(value => value + 1) }}>Tentar novamente</button>}</div>}
      {conflict && <div className="studio-notice" role="alert">Essa call foi alterada em outro lugar (outra aba ou aparelho) depois que você abriu o editor.
        <button type="button" onClick={() => { setConflict(false); setStatus('loading'); setRetry(value => value + 1) }}>Carregar a versão nova</button>
        <button type="button" onClick={() => save({ force: true })}>Publicar a minha mesmo assim</button></div>}
      {draft && <div className="studio-notice">Há um rascunho guardado neste navegador.
        <button type="button" onClick={() => { commit(normalizePlanning(draft)); setDraft(null) }}>Recuperar rascunho</button>
        <button type="button" onClick={() => { localStorage.removeItem(draftKey); setDraft(null) }}>Descartar</button></div>}
    </div>
    {planning && <div className="builder">
      <aside className="builder-library" aria-label="Biblioteca de blocos">
        <Library blocks={planning.blocks} selectedId={selectedId} onSelect={setSelectedId} onInsert={api.insert} onMoveBy={api.moveBy} onTemplate={applyTemplate}
          onPaletteDown={(event, type) => startDrag(event, { kind: 'new', type, label: blockLabels[type] })} />
      </aside>
      <section className="builder-stage" aria-label="Palco">
        <div className="stage-toolbar">
          <div className="stage-tools">
            <button type="button" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!history.canUndo} onClick={history.undo}><Undo2 size={16} /></button>
            <button type="button" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)" disabled={!history.canRedo} onClick={history.redo}><Redo2 size={16} /></button>
            <button type="button" className={!selected ? 'active' : ''} onClick={() => setSelectedId(null)}><Settings2 size={15} />Página</button>
            <button type="button" onClick={replay}><WandSparkles size={15} />Reproduzir animações</button>
          </div>
          <div className="stage-tools">
            <div className="device-switch">
              <button type="button" aria-label="Palco em tamanho de computador" aria-pressed={device === 'desktop'} className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={16} /></button>
              <button type="button" aria-label="Palco em tamanho de celular" aria-pressed={device === 'mobile'} className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={16} /></button>
            </div>
            <button type="button" onClick={() => setPreviewMode('page')}><Maximize2 size={15} />Tela cheia</button>
          </div>
        </div>
        <div className={`stage-surface ${device} ${drag ? 'is-dragging' : ''} ${resizing ? 'is-resizing' : ''}`} ref={surfaceRef}>
          <PlanningCanvas key={replayKey} planning={planning} editing={editing} ignorePast />
        </div>
        <p className="stage-help">Clique num bloco para selecionar e de novo no texto para digitar · arraste o bloco para posicioná-lo livremente · alça superior: trocar a ordem · borda direita: largura · círculo: girar · setas movem, Alt + setas reordenam.</p>
      </section>
      <aside className="builder-inspector" aria-label="Propriedades">
        {selected
          ? <BlockInspector block={selected} api={api} pageEnabled={planning.animationEnabled} onError={setError} callKey={planning.eventId || 'main'} />
          : <PageInspector planning={planning} set={setPage} patch={patchPage} onError={setError} onReplay={replay} onSplash={() => setPreviewMode('splash')} />}
      </aside>
    </div>}
    {selected && !drag && <QuickBar key={selected.id} block={selected} api={api} onEditText={editText} />}
    {drag && <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>{drag.label}</div>}
    {indicator && <div className="drop-indicator" style={indicator} />}
    {previewMode && planning && <CallPreview planning={planning} splash={previewMode === 'splash'} onClose={() => setPreviewMode(null)} />}
  </main>
}
export default Admin
