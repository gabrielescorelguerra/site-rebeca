import { useEffect, useState } from 'react'
import { CalendarDays, Heart, LogOut } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { logout, useAccess } from './lib/access'
import { loadPlanning } from './data/planning'
import IconByKey from './components/IconByKey'
import { backgroundMotionKeyframe, fonts, legacyShape, motionVars, patternStyle, shadows, shapeRadius, variants, withAlpha } from './data/visuals'
import { BlockSlot } from './components/Blocks'
import { EditingContext, entranceStyle, loopStyle } from './components/blockStyle'
import CallSplash from './components/CallSplash'
import { callHasEnded } from './utils/callTime'
import { validLink } from './utils/url'

const iconCells = Array.from({ length: 48 }, (_, index) => index)

function safeImage(url) {
  return typeof url === 'string' && (validLink(url) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url))
}

export function BackgroundIconLayer({ planning }) {
  if (!planning.backgroundIconEnabled || !planning.backgroundIcon) return null
  const variety = ['heart', 'sparkles', 'star', 'flower', 'moon', 'music', 'gamepad', 'coffee', 'cat', 'crown']
  const keys = planning.backgroundIcon === 'random' ? variety : [planning.backgroundIcon]
  const spacing = planning.backgroundIconSpacing
  return <div
    className="planning-icons"
    style={{ gridAutoRows: `${spacing}px`, color: planning.backgroundIconColor, opacity: planning.backgroundIconOpacity, padding: `${spacing / 2}px`, gap: `${spacing / 2}px`, ...motionVars(planning) }}
    aria-hidden="true"
  >
    {iconCells.map(position => {
      return <IconByKey key={position} name={keys[position % keys.length]} size={planning.backgroundIconSize} strokeWidth={1.5} style={{ transform: `rotate(${planning.backgroundIconRotation}deg)` }} />
    })}
  </div>
}

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
    padding: `min(${planning.panelPadding}px, calc(4cqw + 14px))`,
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

export function PlanningCanvas({ planning, preview = false, editing = null, ignorePast = false, onBack, onLogout }) {
  const ended = callHasEnded(planning)
  const hidden = planning.hasPlannedCall === false || (planning.hidePast !== false && ended && !ignorePast)
  const motion = planning.animationEnabled && (!editing || editing.animate)
  const canvasStyle = {
    backgroundColor: planning.backgroundColor,
    ...(planning.backgroundGradient ? { backgroundImage: `linear-gradient(${planning.backgroundGradientAngle}deg, ${planning.backgroundColor}, ${planning.backgroundGradientColor})` } : {}),
    color: planning.textColor,
    '--accent-color': planning.accentColor,
    '--content-offset': `${planning.contentOffset}px`,
    fontFamily: fonts[planning.fontFamily] || fonts.sans,
    fontSize: `${planning.baseFontSize || 18}px`,
    '--block-gap': `${planning.blockGap ?? 20}px`,
    ...motionVars(planning),
  }
  const content = hidden && !(editing && planning.hasPlannedCall !== false)
    ? <CallEmpty ended={planning.hasPlannedCall !== false && ended} />
    : <>
      {editing && planning.hasPlannedCall === false && <p className="editing-banner">A call está desativada: ela verá “Sem call planejada”. Você ainda pode editar os blocos.</p>}
      <BlocksView planning={planning} />
    </>

  return <div className={`planning-canvas ${preview ? 'is-preview' : ''} ${editing ? 'is-editing' : ''}`} style={canvasStyle} onClick={() => editing?.onSelect(null)}>
    {safeImage(planning.backgroundImage) && <div className="planning-image" style={{ backgroundImage: `url(${JSON.stringify(planning.backgroundImage)})`, opacity: planning.backgroundImageOpacity, backgroundPosition: planning.backgroundImagePosition, filter: planning.backgroundImageBlur ? `blur(${planning.backgroundImageBlur}px)` : undefined, ...(motion && backgroundMotionKeyframe[planning.backgroundMotion] ? { animation: `${backgroundMotionKeyframe[planning.backgroundMotion]} var(--animation-duration) ease-in-out infinite` } : {}) }} />}
    {planning.backgroundPattern !== 'none' && <div className="planning-pattern" style={{ ...patternStyle(planning.backgroundPattern, planning.accentColor, planning.textColor), opacity: planning.backgroundPatternOpacity ?? 1 }} />}
    <BackgroundIconLayer planning={planning} />
    <header className="call-header">
      <span><Heart size={15} fill="currentColor" aria-hidden="true" />rebeca</span>
      {preview || editing ? <span style={{ color: planning.backButtonColor }}>voltar para o começo</span> : <span className="call-header-actions">
        <button type="button" style={{ color: planning.backButtonColor }} onClick={onBack}>voltar para o começo</button>
        {onLogout && <button type="button" style={{ color: planning.backButtonColor }} onClick={onLogout}><LogOut size={13} aria-hidden="true" />sair</button>}
      </span>}
    </header>
    <EditingContext.Provider value={editing}>
      <div className="call-content">{content}</div>
    </EditingContext.Provider>
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
    {admin && <nav className="published-toolbar" aria-label="Visualização do administrador"><span>Versão salva · é assim que os outros usuários veem</span><Link to="/admin">Voltar ao editor</Link></nav>}
    <PlanningCanvas planning={planning} onBack={() => navigate('/')} onLogout={() => { logout(); navigate('/') }} />
  </>
}

export default Planning
