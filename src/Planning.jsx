import { useEffect, useState } from 'react'
import { CalendarDays, Heart, LogOut } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { logout, useAccess } from './lib/access'
import { loadPlanning } from './data/planning'
import PageBackground from './components/PageBackground'
import { pageStyle } from './components/pageStyle'
import { CanvasStage } from './components/CanvasView'
import { legacyShape, motionVars, shadows, shapeRadius, variants, withAlpha } from './data/visuals'
import { BlockSlot } from './components/Blocks'
import { EditingContext, entranceStyle, loopStyle } from './components/blockStyle'
import { ResponsesContext, useResponsesStore } from './components/responsesContext'
import CallSplash from './components/CallSplash'
import { callHasEnded } from './utils/callTime'

function panelStyle(planning) {
  const base = variants[planning.style] ? planning.style : 'minimal'
  const { border, ...css } = variants[base].css
  if (base === 'custom') css.background = withAlpha(planning.panelColor, planning.panelOpacity)
  if (planning.panelShadow !== 'theme') css.boxShadow = shadows(planning.accentColor)[planning.panelShadow]
  const variantColor = border ? border.split(/\s+(?![^(]*\))/).pop() : 'color-mix(in srgb, currentColor 14%, transparent)'
  return {
    ...css,
    borderWidth: `${planning.panelBorderWidth}px`,
    borderStyle: planning.panelBorderStyle,
    borderColor: variantColor,
    borderRadius: shapeRadius(planning.panelShape === 'custom' ? 'custom' : legacyShape[planning.panelShape] || planning.panelShape, planning.panelRadius),
    '--panel-pad': `${planning.panelPadding}px`,
  }
}

function CallEmpty({ ended }) {
  return <section className="call-empty" aria-labelledby="no-call-title">
    <CalendarDays size={32} strokeWidth={1.4} aria-hidden="true" />
    <h1 id="no-call-title">{ended ? 'Nossa última call já aconteceu.' : 'Sem call planejada no momento.'}</h1>
    <p>Quando marcarmos a próxima, ela aparece aqui.</p>
  </section>
}

export function BlocksView({ planning }) {
  const animated = planning.animationEnabled
  const wrapperStyle = { maxWidth: `${planning.panelWidth}px`, ...motionVars(planning) }
  const grid = <BlocksGrid planning={planning} />
  if (!planning.panelEnabled) return <div className="call-wrapper" style={wrapperStyle}>{grid}</div>
  const hover = animated && planning.hoverAnimation && planning.hoverAnimation !== 'none' ? `hv-${planning.hoverAnimation}` : ''
  return <div className="call-wrapper" style={wrapperStyle}>
    <div style={animated ? loopStyle(planning.panelLoop) : undefined}>
      <section className={`call-panel editorial-panel ${hover}`} style={{ ...panelStyle(planning), ...(animated ? entranceStyle(planning, planning.panelEntrance, Number(planning.animationDelay) || 0) : {}) }}>
        {grid}
      </section>
    </div>
  </div>
}

function BlocksGrid({ planning }) {
  const textAlign = planning.textAlign || 'left'
  return <div className="blocks-grid" data-blocks-grid style={{ textAlign }}>
    {planning.blocks.map((block, index) => <BlockSlot key={block.id} block={block} index={index} planning={planning} />)}
    {!planning.blocks.length && <p className="blocks-empty">Esta call ainda não tem blocos.</p>}
  </div>
}

export function PlanningCanvas({ planning, preview = false, editing = null, ignorePast = false, persistResponses = false, forceGrid = false, onBack, onLogout }) {
  const responses = useResponsesStore({ callKey: planning.eventId || 'main', persist: persistResponses })
  const ended = callHasEnded(planning)
  const hidden = planning.hasPlannedCall === false || (planning.hidePast !== false && ended && !ignorePast)
  const motion = planning.animationEnabled && (!editing || editing.animate)
  const content = hidden && !(editing && planning.hasPlannedCall !== false)
    ? <CallEmpty ended={planning.hasPlannedCall !== false && ended} />
    : <>
      {editing && planning.hasPlannedCall === false && <p className="editing-banner">A call está desativada: ela verá “Sem call planejada”. Você ainda pode editar os blocos.</p>}
      {planning.layoutMode === 'canvas' && !forceGrid ? <CanvasStage planning={planning} /> : <BlocksView planning={planning} />}
    </>

  return <div className={`planning-canvas ${preview ? 'is-preview' : ''} ${editing ? 'is-editing' : ''}`} style={pageStyle(planning)} onClick={() => editing?.onSelect(null)}>
    <PageBackground planning={planning} motion={motion} />
    <header className="call-header">
      <span><Heart size={15} fill="currentColor" aria-hidden="true" />rebeca</span>
      {preview || editing ? <span style={{ color: planning.backButtonColor }}>voltar para o começo</span> : <span className="call-header-actions">
        <button type="button" style={{ color: planning.backButtonColor }} onClick={onBack}>voltar para o começo</button>
        {onLogout && <button type="button" style={{ color: planning.backButtonColor }} onClick={onLogout}><LogOut size={13} aria-hidden="true" />sair</button>}
      </span>}
    </header>
    <ResponsesContext.Provider value={responses}>
      <EditingContext.Provider value={editing}>
        <div className="call-content">{content}</div>
      </EditingContext.Provider>
    </ResponsesContext.Provider>
  </div>
}

function Planning() {
  const navigate = useNavigate()
  const { admin, authenticated } = useAccess()
  const [planning, setPlanning] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!authenticated) return
    let active = true
    loadPlanning().then(value => { if (active) setPlanning(value) })
      .catch(error => { if (active) setLoadError(/configurad/i.test(error?.message || '') ? 'O site ainda não está conectado ao banco de dados (Supabase).' : 'Verifique sua conexão e tente novamente.') })
    return () => { active = false }
  }, [authenticated, attempt])

  if (!authenticated) return <Navigate to="/autenticacao" state={{ from: '/planejamento' }} replace />
  if (loadError) return <main className="call-splash site-shell"><Heart size={32} aria-hidden="true" /><h1>Não foi possível carregar a call.</h1><p role="alert">{loadError}</p><button className="studio-save" onClick={() => { setLoadError(''); setPlanning(null); setAttempt(value => value + 1) }}>Tentar novamente</button><Link className="text-button" to="/">Voltar ao início</Link></main>
  if (!planning) return <CallSplash />
  return <>
    {admin && <nav className="published-toolbar" aria-label="Visualização do administrador"><span>Versão salva · é assim que ela vê (as respostas dos testes não são salvas)</span><Link to="/admin">Voltar ao editor</Link></nav>}
    <PlanningCanvas planning={planning} persistResponses={!admin} onBack={() => navigate('/')} onLogout={() => { logout(); navigate('/') }} />
  </>
}

export default Planning
