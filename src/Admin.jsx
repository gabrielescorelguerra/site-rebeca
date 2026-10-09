import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowDown, ArrowUp, Check, Copy, Heart, Plus, Save, Trash2, Monitor, Smartphone, RotateCcw, Sparkles, Palette, Type, CalendarDays, ListOrdered, Link, Image, WandSparkles, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_AUTHENTICATED_KEY, defaultPlanning, loadPlanning, planningOptions, savePlanning } from './data/planning'
import { PlanningCanvas } from './Planning'
import { themes } from './data/themes'

const tabs = [['content', 'O encontro', CalendarDays], ['themes', 'Temas', Sparkles], ['appearance', 'Aparência', Palette], ['background', 'Fundo', Image], ['motion', 'Movimento', WandSparkles], ['activities', 'Atividades', ListOrdered], ['tools', 'Links e aplicativos', Link]]
const draftKey = 'rebecca-planning-draft-v2'
const motionPresets = {
  none: { animationEnabled: false, panelEntrance: 'none', panelLoop: 'none', iconAnimation: 'none', glowAnimation: 'none' },
  soft: { panelEntrance: 'rise', panelLoop: 'none', iconAnimation: 'float', animationSpeed: 'normal', animationIntensity: 'subtle', glowAnimation: 'none' },
  playful: { panelEntrance: 'bounce', panelLoop: 'none', iconAnimation: 'bounce', animationSpeed: 'fast', animationIntensity: 'medium', glowAnimation: 'none' },
  dramatic: { panelEntrance: 'zoom', panelLoop: 'none', iconAnimation: 'pulse', animationSpeed: 'relaxed', animationIntensity: 'high', glowAnimation: 'soft' },
  neon: { panelEntrance: 'fade', panelLoop: 'none', iconAnimation: 'pulse', animationSpeed: 'normal', animationIntensity: 'medium', glowAnimation: 'pulse' },
  game: { panelEntrance: 'slide-left', panelLoop: 'none', iconAnimation: 'swing', animationSpeed: 'fast', animationIntensity: 'medium', glowAnimation: 'none' },
  cinema: { panelEntrance: 'fade', panelLoop: 'none', iconAnimation: 'none', animationSpeed: 'slow', animationIntensity: 'subtle', glowAnimation: 'soft' },
  chaos: { panelEntrance: 'glitch', panelLoop: 'sway', iconAnimation: 'glitch', animationSpeed: 'fast', animationIntensity: 'high', glowAnimation: 'flicker' },
}

function Admin() {
  const navigate = useNavigate()
  const authenticated = localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true'
  const [planning, setPlanning] = useState(defaultPlanning)
  const [baseline, setBaseline] = useState(null)
  const [tab, setTab] = useState('content')
  const [device, setDevice] = useState('desktop')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [testKey, setTestKey] = useState(0)
  const [draft, setDraft] = useState(null)
  const [draftStored, setDraftStored] = useState(false)
  const saveTimer = useRef(null)
  const dirty = baseline !== null && JSON.stringify(planning) !== JSON.stringify(baseline)

  useEffect(() => {
    if (!authenticated) { navigate('/autenticacao', { replace: true }); return }
    let active = true
    loadPlanning().then(value => {
      if (!active) return
      setPlanning(value); setBaseline(value); setStatus('ready')
      try { const cached = JSON.parse(localStorage.getItem(draftKey)); if (cached && JSON.stringify(cached) !== JSON.stringify(value)) setDraft(cached) } catch { localStorage.removeItem(draftKey) }
    }).catch(err => { if (active) { setError(err.message || 'Não foi possível carregar a call.'); setStatus('error') } })
    return () => { active = false; window.clearTimeout(saveTimer.current) }
  }, [authenticated, navigate])

  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(planning)); setDraftStored(true) } catch { setError('O armazenamento de rascunho está cheio. Salve as alterações para não perdê-las.') }
    }, 500)
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => { window.clearTimeout(timer); window.removeEventListener('beforeunload', warn) }
  }, [planning, dirty])

  const update = (key, value) => { setDraftStored(false); setPlanning(current => ({ ...current, [key]: value })); if (status === 'saved') setStatus('ready') }
  const patch = values => { setDraftStored(false); setPlanning(current => ({ ...current, ...values })); setStatus('ready') }
  const save = async event => {
    event.preventDefault()
    if (status === 'saving' || !baseline) return
    if (!planning.title.trim() || !planning.date) { setTab('content'); setError('Preencha o título e a data do encontro.'); return }
    if (planning.activities.some(item => !item.name.trim())) { setTab('activities'); setError('Dê um nome a cada atividade antes de salvar.'); return }
    if (planning.tools.some(item => !item.name.trim() || (item.url && !/^https?:\/\//i.test(item.url)))) { setTab('tools'); setError('Preencha o nome de cada link e use um endereço iniciado por https:// ou http://.'); return }
    setStatus('saving'); setError('')
    const snapshot = structuredClone(planning)
    try {
      await savePlanning(snapshot); setBaseline(snapshot); setStatus('saved'); localStorage.removeItem(draftKey)
      saveTimer.current = window.setTimeout(() => setStatus('ready'), 3000)
    } catch { setStatus('ready'); setError('Não foi possível salvar. Seu rascunho foi mantido; tente novamente.') }
  }
  const select = (key, label, options = planningOptions[key]) => <label key={key}>{label}<select className="admin-input" value={planning[key]} onChange={e => update(key, e.target.value)}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
  const range = (key, label, min, max, step = 1, unit = '') => <label key={key} className="range-field"><span>{label}<output>{planning[key]}{unit}</output></span><input type="range" min={min} max={max} step={step} value={planning[key]} onChange={e => update(key, Number(e.target.value))} /></label>
  const toggle = (key, label, description) => <label className="toggle-field"><span>{label}{description && <small>{description}</small>}</span><input type="checkbox" checked={planning[key]} onChange={e => update(key, e.target.checked)} /></label>
  const text = (key, label) => <label key={key}>{label}<input className="admin-input" maxLength={120} value={planning[key]} onChange={e => update(key, e.target.value)} /></label>
  const color = (key, label) => <label key={key}>{label}<div className="color-field"><input aria-label={label} type="color" value={planning[key]} onChange={e => update(key, e.target.value)} /><span>{planning[key]}</span></div></label>
  const upload = event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 4 * 1024 * 1024) { setError('Escolha uma imagem JPG, PNG, WebP ou GIF de até 4 MB.'); return }
    const reader = new FileReader()
    reader.onload = () => { update('backgroundImage', reader.result); setError('') }
    reader.onerror = () => setError('Não foi possível ler a imagem. Tente outro arquivo.')
    reader.readAsDataURL(file)
  }
  const editItem = (collection, id, key, value) => update(collection, planning[collection].map(item => item.id === id ? { ...item, [key]: value } : item))
  const move = (index, direction) => { const items = [...planning.activities]; [items[index], items[index + direction]] = [items[index + direction], items[index]]; update('activities', items) }
  if (!authenticated) return null

  return <main className="studio-shell">
    <header className="studio-header"><button type="button" className="text-button" onClick={() => navigate('/')}><ArrowLeft size={16} />Voltar</button><span className="studio-brand"><Heart size={16} fill="currentColor" />um cantinho só nosso <span>/</span> painel da call</span><button className="text-button" type="button" onClick={() => { localStorage.removeItem(ADMIN_AUTHENTICATED_KEY); navigate('/autenticacao') }}>logout</button></header>
    <form onSubmit={save} className="studio-main">
      <div className="studio-heading"><div><p className="eyebrow">feito por você, para ela</p><h1>Um encontro com a nossa cara<span>.</span></h1><p>Planeje os detalhes. Dê seu toque. Deixe o carinho aparecer.</p></div><button className="studio-save" disabled={!baseline || status === 'saving' || !dirty} type="submit">{status === 'saved' ? <Check size={17} /> : <Save size={17} />}{status === 'saving' ? 'Salvando…' : status === 'saved' ? 'Alterações salvas' : 'Salvar alterações'}</button></div>
      <div className="studio-status" role="status"><span className={dirty ? 'status-dot unsaved' : 'status-dot'} />{status === 'loading' ? 'Carregando sua call…' : dirty ? `Alterações ainda não publicadas · ${draftStored ? 'rascunho salvo neste navegador' : 'salvando rascunho…'}` : 'Tudo em dia · sua call está salva'}{dirty && <button type="button" onClick={() => { setPlanning(baseline); localStorage.removeItem(draftKey); setStatus('ready') }}><RotateCcw size={13} />Desfazer alterações</button>}</div>
      {error && <div className="studio-notice" role="alert">{error}</div>}
      {draft && <div className="studio-notice">Você tem um rascunho deste navegador.<button type="button" onClick={() => { patch({ ...defaultPlanning, ...draft }); setDraft(null) }}>Recuperar rascunho</button><button type="button" onClick={() => { localStorage.removeItem(draftKey); setDraft(null) }}>Descartar rascunho</button></div>}
      <div className="studio-grid"><div className="studio-editor">
        <nav className="editor-tabs" aria-label="Seções do editor">{tabs.map(([key, label, Icon]) => <button type="button" key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)} aria-current={tab === key ? 'page' : undefined}><Icon size={16} />{label}</button>)}</nav>
        <fieldset disabled={!baseline || status === 'saving'} className="editor-card">
          <div className="editor-section-heading"><p className="eyebrow">os pequenos detalhes fazem a diferença</p><h2>{tabs.find(item => item[0] === tab)[1]}</h2></div>
          {tab === 'content' && <><label>Título da call<input className="admin-input" required maxLength={160} value={planning.title} onChange={e => update('title', e.target.value)} /></label><label>Uma mensagem para ela<textarea className="admin-input" rows={4} value={planning.subtitle} onChange={e => update('subtitle', e.target.value)} /></label><div className="field-grid"><label>Data e hora<input className="admin-input" required type="datetime-local" value={planning.date} onChange={e => update('date', e.target.value)} /></label><label>Mensagem de encerramento<input className="admin-input" value={planning.footerMessage} onChange={e => update('footerMessage', e.target.value)} /></label></div><div className="field-grid">{text('planningLabel', 'Etiqueta acima do título')}{text('activitiesLabel', 'Título das atividades')}{text('toolsLabel', 'Título dos links')}</div>{toggle('showPlanningLabel', 'Mostrar etiqueta acima do título')}{toggle('showDate', 'Mostrar data e hora')}{toggle('showCountdown', 'Contagem regressiva', 'O tempo que falta para nosso encontro.')}</>}
          {tab === 'themes' && <><p className="section-help">Um ponto de partida pensado com carinho. O tema muda só o visual; os detalhes do encontro continuam seus.</p><div className="theme-grid">{themes.map(theme => <button type="button" className="theme-card" key={theme.name} onClick={() => patch({ backgroundColor: theme.colors[0], textColor: theme.colors[1], accentColor: theme.colors[2], planningLabelColor: theme.colors[2], backButtonColor: theme.colors[1], panelColor: theme.panelColor || '#ffffff', style: theme.style, fontFamily: theme.font, backgroundPattern: theme.pattern, gameIcon: theme.icon, panelShape: 'rounded', panelOpacity: theme.style === 'custom' ? 1 : .75, backgroundImage: '', backgroundIconEnabled: false })}><span className="theme-sample" style={{ background: theme.colors[0], color: theme.colors[1] }}><span style={{ color: theme.colors[2] }}>♡</span><span style={{ fontFamily: theme.font === 'mono' ? 'monospace' : 'Georgia, serif' }}>Nós, sem pressa.</span><i style={{ background: theme.colors[2] }} /></span><strong>{theme.name}</strong><small>{theme.note}</small></button>)}</div></>}
          {tab === 'appearance' && <><h3><Palette size={16} />Paleta de cores</h3><div className="field-grid">{color('backgroundColor', 'Fundo')}{color('textColor', 'Texto')}{color('accentColor', 'Destaques')}{color('planningLabelColor', 'Etiqueta do encontro')}{color('backButtonColor', 'Botão de voltar')}{color('panelColor', 'Painel personalizado')}</div><h3><Type size={16} />Tipografia e composição</h3><div className="field-grid">{select('style', 'Acabamento', planningOptions.styles)}{select('fontFamily', 'Fonte', planningOptions.fonts)}{select('fontSize', 'Tamanho do texto', planningOptions.sizes)}{select('textAlign', 'Alinhamento', [['left', 'À esquerda'], ['center', 'Centralizado']])}{select('gameIcon', 'Ícone do encontro', planningOptions.gameIcons)}{select('panelShape', 'Formato', planningOptions.panelShapes)}</div>{range('titleSize', 'Tamanho do título', 32, 100, 2, ' px')}<div className="field-grid">{select('titleWeight', 'Peso do título', [['400', 'Normal'], ['600', 'Seminegrito'], ['700', 'Negrito']])}{select('panelShadow', 'Sombra do painel', [['theme', 'Do acabamento'], ['none', 'Sem sombra'], ['soft', 'Suave'], ['deep', 'Marcante'], ['glow', 'Brilho na cor de destaque']])}{select('panelBorderStyle', 'Borda', [['solid', 'Contínua'], ['dashed', 'Tracejada'], ['dotted', 'Pontilhada'], ['double', 'Dupla']])}</div>{range('titleSpacing', 'Espaçamento entre letras do título', -.08, .08, .01, ' em')}{range('textLineHeight', 'Altura das linhas', 1.2, 2.2, .1)}{range('panelBorderWidth', 'Espessura da borda', 0, 6, 1, ' px')}{range('panelWidth', 'Largura máxima', 600, 1200, 20, ' px')}{range('panelPadding', 'Respiro do painel', 20, 80, 2, ' px')}{range('panelOpacity', 'Opacidade do painel personalizado', .1, 1, .05)}{range('customFontSize', 'Texto em tamanho personalizado', 12, 32, 1, ' px')}<p className="section-help">A cor e a opacidade do painel se aplicam ao acabamento “Personalizado”.</p></>}
          {tab === 'background' && <>{toggle('backgroundGradient', 'Fundo em degradê', 'Combine a cor de fundo com uma segunda cor.')}{planning.backgroundGradient && <>{color('backgroundGradientColor', 'Segunda cor')}{range('backgroundGradientAngle', 'Direção do degradê', 0, 360, 15, '°')}</>}<div className="field-grid">{select('backgroundPattern', 'Textura', planningOptions.backgroundPatterns)}{select('backgroundImagePosition', 'Enquadramento da imagem', [['center', 'Centro'], ['top', 'Topo'], ['bottom', 'Base'], ['left', 'Esquerda'], ['right', 'Direita']])}</div><label className="upload-zone"><Image size={24} /><strong>{planning.backgroundImage ? 'Trocar imagem de fundo' : 'Escolha uma imagem especial'}</strong><small>JPG, PNG, WebP ou GIF · até 4 MB</small><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} /></label>{planning.backgroundImage && <button type="button" className="text-button" onClick={() => update('backgroundImage', '')}><Trash2 size={14} />Remover imagem</button>}{range('backgroundImageOpacity', 'Opacidade da imagem', .05, 1, .05)}{range('backgroundImageBlur', 'Desfoque', 0, 20, 1, ' px')}{toggle('backgroundIconEnabled', 'Ícones no fundo', 'Uma textura feita com seus símbolos favoritos.')}{planning.backgroundIconEnabled && <><div className="field-grid">{select('backgroundIcon', 'Símbolo', planningOptions.backgroundIcons)}{color('backgroundIconColor', 'Cor dos símbolos')}</div>{range('backgroundIconSize', 'Tamanho', 8, 96, 2, ' px')}{range('backgroundIconOpacity', 'Opacidade', .03, .8, .01)}{range('backgroundIconSpacing', 'Espaçamento', 30, 180, 6, ' px')}{range('backgroundIconRotation', 'Rotação', -180, 180, 5, '°')}</>}</>}
          {tab === 'motion' && <>{toggle('animationEnabled', 'Ativar animações', 'A preferência de movimento reduzido do dispositivo é respeitada.')}<label>Combinação de movimento<select className="admin-input" value={planning.animationPreset} onChange={e => patch({ animationEnabled: true, animationPreset: e.target.value, ...motionPresets[e.target.value] })}>{planningOptions.animationPresets.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><div className="field-grid">{select('animationSpeed', 'Velocidade', planningOptions.animationSpeeds)}{select('animationIntensity', 'Intensidade', planningOptions.animationIntensities)}{select('panelEntrance', 'Entrada', planningOptions.panelEntrances)}{select('panelLoop', 'Movimento contínuo', planningOptions.panelLoops)}{select('iconAnimation', 'Animação dos ícones', planningOptions.iconAnimations)}{select('hoverAnimation', 'Ao passar o mouse', planningOptions.hoverAnimations)}{select('backgroundMotion', 'Movimento da imagem', planningOptions.backgroundMotions)}{select('glowAnimation', 'Brilho', planningOptions.glowAnimations)}</div>{range('animationDelay', 'Atraso de entrada', 0, 3, .1, ' s')}{toggle('iconStagger', 'Variar o tempo dos ícones')}<button className="secondary-button" type="button" onClick={() => setTestKey(value => value + 1)}><WandSparkles size={16} />Reproduzir animações</button></>}
          {tab === 'activities' && <>{toggle('showDurations', 'Mostrar duração')}{toggle('showActivityNumbers', 'Numerar as atividades')}<div className="field-grid">{select('activityLayout', 'Apresentação do roteiro', [['list', 'Lista clássica'], ['cards', 'Cartões'], ['timeline', 'Linha do tempo']])}</div>{range('activityGap', 'Espaço entre atividades', 0, 32, 2, ' px')}<p className="section-help">Monte o roteiro do encontro. Você pode mudar a ordem, duplicar e acrescentar uma descrição.</p><div className="item-list">{planning.activities.map((item, index) => <div className="activity-editor" key={item.id}><div className="item-heading"><span>ATIVIDADE {String(index + 1).padStart(2, '0')}</span><div><button aria-label="Mover para cima" disabled={index === 0} type="button" onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button aria-label="Mover para baixo" disabled={index === planning.activities.length - 1} type="button" onClick={() => move(index, 1)}><ArrowDown size={15} /></button><button aria-label="Duplicar atividade" type="button" onClick={() => update('activities', [...planning.activities.slice(0, index + 1), { ...item, id: crypto.randomUUID() }, ...planning.activities.slice(index + 1)])}><Copy size={15} /></button><button aria-label="Excluir atividade" type="button" onClick={() => update('activities', planning.activities.filter(value => value.id !== item.id))}><Trash2 size={15} /></button></div></div><div className="field-grid"><label>Atividade<input className="admin-input" required value={item.name} onChange={e => editItem('activities', item.id, 'name', e.target.value)} /></label><label>Duração<input className="admin-input" placeholder="30 min" value={item.duration} onChange={e => editItem('activities', item.id, 'duration', e.target.value)} /></label></div><label>Descrição <span className="optional">opcional</span><textarea className="admin-input" rows={2} value={item.description || ''} onChange={e => editItem('activities', item.id, 'description', e.target.value)} /></label></div>)}</div><button type="button" className="secondary-button" onClick={() => update('activities', [...planning.activities, { id: crypto.randomUUID(), name: '', duration: '15 min', description: '' }])}><Plus size={16} />Adicionar atividade</button></>}
          {tab === 'tools' && <>{toggle('showTools', 'Mostrar aplicativos e links', 'Deixe tudo pronto para quando ela chegar.')}<div className="item-list">{planning.tools.map(item => <div className="activity-editor" key={item.id}><div className="item-heading"><span>LINK DO ENCONTRO</span><button aria-label="Excluir link" type="button" onClick={() => update('tools', planning.tools.filter(value => value.id !== item.id))}><Trash2 size={15} /></button></div><label>Nome<input className="admin-input" required value={item.name} onChange={e => editItem('tools', item.id, 'name', e.target.value)} /></label><label>Endereço<input className="admin-input" type="url" pattern="https?://.*" placeholder="https://" value={item.url} onChange={e => editItem('tools', item.id, 'url', e.target.value)} /></label></div>)}</div><button className="secondary-button" type="button" onClick={() => update('tools', [...planning.tools, { id: crypto.randomUUID(), name: '', url: '' }])}><Plus size={16} />Adicionar link</button></>}
        </fieldset>
      </div><aside className="preview-column"><div className="preview-toolbar"><div><Eye size={15} /><span>Assim ela vai ver</span><i /></div><div className="device-switch"><button type="button" aria-label="Prévia desktop" aria-pressed={device === 'desktop'} className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={16} /></button><button type="button" aria-label="Prévia celular" aria-pressed={device === 'mobile'} className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={16} /></button></div></div><div className={`preview-stage ${device}`}><PlanningCanvas planning={planning} key={testKey} preview /></div><p className="preview-caption"><Heart size={12} />Cada detalhe, um jeito de dizer que você se importa.</p></aside></div>
    </form>
  </main>
}
export default Admin
