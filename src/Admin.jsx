import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Heart, Plus, Save, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_AUTHENTICATED_KEY, defaultPlanning, loadPlanning, planningOptions, savePlanning } from './data/planning'
import { BackgroundIconLayer, PlanningView } from './Planning'
import { planningPatterns } from './data/planningVisuals'

const backgroundPresets = [
  ['#fbf8f6', 'Pétala'],
  ['#fff1f4', 'Rosa'],
  ['#f2e7ff', 'Lavanda'],
  ['#e8f7f4', 'Menta'],
  ['#e8f2ff', 'Céu'],
  ['#fff4dc', 'Baunilha'],
  ['#171126', 'Noite neon'],
  ['#07151b', 'Cyber'],
  ['#30262a', 'Editorial'],
]

const adminFonts = {
  serif: 'Georgia, serif',
  sans: 'Inter, sans-serif',
  mono: '"Space Mono", monospace',
  rounded: '"Nunito", sans-serif',
  display: '"Bebas Neue", sans-serif',
  typewriter: '"Special Elite", monospace',
  pixel: '"Press Start 2P", monospace',
  handwriting: '"Caveat", cursive',
  condensed: '"Oswald", sans-serif',
}

function Admin() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true',
  )
  const [planning, setPlanning] = useState(defaultPlanning)
  const [saved, setSaved] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [animationTestKey, setAnimationTestKey] = useState(0)
  const [isPreviewPinned, setIsPreviewPinned] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) navigate('/autenticacao', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let active = true
    loadPlanning()
      .then((loadedPlanning) => {
        if (active) setPlanning(loadedPlanning)
      })
      .catch((error) => {
        console.error(error)
        if (active) setLoadError(error.message || 'Não foi possível carregar a configuração.')
      })
    return () => { active = false }
  }, [isAuthenticated])

  const update = (key, value) => setPlanning((current) => ({ ...current, [key]: value }))

  const handleSave = (event) => {
    event.preventDefault()
    savePlanning(planning)
      .then(() => {
        setSaved(true)
        window.setTimeout(() => setSaved(false), 2200)
      })
      .catch(() => setUploadError('Não foi possível salvar no Supabase.'))
  }

  const updateActivity = (id, key, value) => {
    update('activities', planning.activities.map((activity) => (
      activity.id === id ? { ...activity, [key]: value } : activity
    )))
  }

  const handleBackgroundImage = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Escolha um arquivo de imagem.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('A imagem precisa ter no máximo 4 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setUploadError('')
      update('backgroundImage', reader.result)
    }
    reader.readAsDataURL(file)
  }

  if (!isAuthenticated) return null
  if (loadError) return <main className="flex min-h-svh items-center justify-center px-6 text-center text-[#31292d]"><p>{loadError}</p></main>

  const adminStyle = {
    backgroundColor: planning.backgroundColor,
    color: planning.textColor,
    fontFamily: adminFonts[planning.fontFamily] || adminFonts.sans,
  }
  const sectionStyle = {
    backgroundColor: `${planning.backgroundColor}e8`,
    borderColor: planning.accentColor,
  }

  return (
    <main className="relative min-h-svh overflow-hidden px-5 py-6 sm:px-10" style={adminStyle}>
      {planning.backgroundImage && <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${planning.backgroundImage})`, opacity: planning.backgroundImageOpacity }} />}
      <div className="relative z-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <button className="flex cursor-pointer items-center gap-2 text-sm text-[#88777c] transition-all duration-200 hover:-translate-x-1 hover:text-[#965365]" type="button" onClick={() => navigate('/')}><ArrowLeft className="size-4" />Voltar</button>
        <span className="flex items-center gap-2 text-xs uppercase tracking-[.16em] text-[#965365]"><Heart className="size-4 text-[#bd7184]" fill="currentColor" />painel da call</span>
        <button className="cursor-pointer text-xs uppercase tracking-[.16em] text-[#88777c] transition-all duration-200 hover:translate-x-1 hover:text-[#965365]" type="button" onClick={() => { localStorage.removeItem(ADMIN_AUTHENTICATED_KEY); setIsAuthenticated(false) }}>logout</button>
      </header>

      <form className="mx-auto mt-12 max-w-6xl space-y-8" onSubmit={handleSave}>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs uppercase tracking-[.2em] text-[#bd7184]">configuração local</p><h1 className="mt-2 font-serif text-5xl font-normal tracking-[-.05em]">Planejamento</h1></div>
          <button className="flex cursor-pointer items-center gap-2 rounded-full bg-[#bd7184] px-5 py-3 text-sm text-white transition-all duration-200 hover:-translate-y-1 hover:bg-[#a96074]" type="submit">{saved ? <Check className="size-4" /> : <Save className="size-4" />}{saved ? 'Salvo' : 'Salvar alterações'}</button>
        </div>

        <section className={isPreviewPinned
          ? 'fixed inset-x-4 bottom-4 z-50 max-h-[82vh] overflow-auto rounded-3xl bg-[#31292d] p-4 text-[#fffaf9] shadow-[0_18px_50px_rgba(49,41,45,.35)] sm:inset-x-auto sm:right-6 sm:top-6 sm:bottom-auto sm:w-[min(560px,calc(100vw-3rem))] sm:p-6'
          : 'relative z-20 rounded-3xl bg-[#31292d] p-4 text-[#fffaf9] shadow-[0_12px_30px_rgba(49,41,45,.16)] sm:p-6'}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="text-xs uppercase tracking-[.2em] text-[#f0a8b8]">preview ao vivo</p><h2 className="mt-1 font-serif text-3xl font-normal">Assim ela vai ver</h2></div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className="cursor-pointer rounded-full border border-white/25 px-3 py-1 text-xs text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:text-white"
                type="button"
                onClick={() => setIsPreviewPinned((current) => !current)}
              >
                {isPreviewPinned ? 'desafixar preview' : 'fixar preview'}
              </button>
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60">preview ao vivo</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem]">
            <div className={`relative p-4 ${planningPatterns[planning.backgroundPattern] || ''}`} style={{ backgroundColor: planning.backgroundColor, color: planning.textColor, '--accent-color': planning.accentColor }}>
              {planning.backgroundImage && <div className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${planning.backgroundImage})`, opacity: planning.backgroundImageOpacity }} />}
              <BackgroundIconLayer planning={planning} />
              <div className="relative z-10">
              <div key={animationTestKey}>
                <PlanningView planning={planning} preview />
              </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border p-6 sm:grid-cols-2 sm:p-8" style={sectionStyle}>
          <label className="sm:col-span-2">Título<input className="admin-input" value={planning.title} onChange={(event) => update('title', event.target.value)} /></label>
          <label className="sm:col-span-2">Subtítulo<textarea className="admin-input min-h-24" value={planning.subtitle} onChange={(event) => update('subtitle', event.target.value)} /></label>
          <label>Data e hora<input className="admin-input" type="datetime-local" value={planning.date} onChange={(event) => update('date', event.target.value)} /></label>
          <label>Cor do fundo<div className="mt-2 flex flex-wrap gap-2">{backgroundPresets.map(([color, label]) => <button className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e8dfe0] px-2 py-1 text-xs transition-transform hover:scale-105" type="button" key={color} onClick={() => update('backgroundColor', color)}><span className="size-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />{label}</button>)}</div><div className="mt-3 flex gap-3"><input className="h-12 w-16 cursor-pointer rounded-lg border-0 p-1" type="color" value={planning.backgroundColor} onChange={(event) => update('backgroundColor', event.target.value)} /><input className="admin-input mt-0 flex-1" value={planning.backgroundColor} onChange={(event) => update('backgroundColor', event.target.value)} /></div></label>
          <label>Cor do texto<div className="mt-2 flex gap-3"><input className="h-12 w-16 cursor-pointer rounded-lg border-0 p-1" type="color" value={planning.textColor} onChange={(event) => update('textColor', event.target.value)} /><input className="admin-input mt-0 flex-1" value={planning.textColor} onChange={(event) => update('textColor', event.target.value)} /></div></label>
          <label>Cor de destaque<div className="mt-2 flex gap-3"><input className="h-12 w-16 cursor-pointer rounded-lg border-0 p-1" type="color" value={planning.accentColor} onChange={(event) => update('accentColor', event.target.value)} /><input className="admin-input mt-0 flex-1" value={planning.accentColor} onChange={(event) => update('accentColor', event.target.value)} /></div></label>
          <label>Cor do texto “planejamento da ligação”<div className="mt-2 flex gap-3"><input className="h-12 w-16 cursor-pointer rounded-lg border-0 p-1" type="color" value={planning.planningLabelColor} onChange={(event) => update('planningLabelColor', event.target.value)} /><input className="admin-input mt-0 flex-1" value={planning.planningLabelColor} onChange={(event) => update('planningLabelColor', event.target.value)} /></div></label>
          <label>Cor do texto “voltar para o começo”<div className="mt-2 flex gap-3"><input className="h-12 w-16 cursor-pointer rounded-lg border-0 p-1" type="color" value={planning.backButtonColor} onChange={(event) => update('backButtonColor', event.target.value)} /><input className="admin-input mt-0 flex-1" value={planning.backButtonColor} onChange={(event) => update('backButtonColor', event.target.value)} /></div></label>
          <label>Padrão do fundo<select className="admin-input" value={planning.backgroundPattern} onChange={(event) => update('backgroundPattern', event.target.value)}>{planningOptions.backgroundPatterns.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="sm:col-span-2 flex items-center gap-2"><input className="size-4 cursor-pointer accent-[#bd7184]" type="checkbox" checked={planning.backgroundIconEnabled} onChange={(event) => update('backgroundIconEnabled', event.target.checked)} />Ativar ícones repetidos no fundo</label>
          <label>Ícone repetido<select className="admin-input" value={planning.backgroundIcon} onChange={(event) => update('backgroundIcon', event.target.value)}>{planningOptions.backgroundIcons.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Cor dos ícones<div className="mt-2 flex gap-3"><input className="h-12 w-16 cursor-pointer rounded-lg border-0 p-1" type="color" value={planning.backgroundIconColor} onChange={(event) => update('backgroundIconColor', event.target.value)} /><input className="admin-input mt-0 flex-1" value={planning.backgroundIconColor} onChange={(event) => update('backgroundIconColor', event.target.value)} /></div></label>
          <label>Tamanho dos ícones<input className="mt-4 w-full cursor-pointer accent-[#bd7184]" type="range" min="8" max="96" step="2" value={planning.backgroundIconSize} onChange={(event) => update('backgroundIconSize', Number(event.target.value))} /></label>
          <label>Opacidade dos ícones<input className="mt-4 w-full cursor-pointer accent-[#bd7184]" type="range" min="0.03" max="0.8" step="0.01" value={planning.backgroundIconOpacity} onChange={(event) => update('backgroundIconOpacity', Number(event.target.value))} /></label>
          <label>Espaçamento<input className="mt-4 w-full cursor-pointer accent-[#bd7184]" type="range" min="30" max="180" step="6" value={planning.backgroundIconSpacing} onChange={(event) => update('backgroundIconSpacing', Number(event.target.value))} /></label>
          <label>Rotação<input className="mt-4 w-full cursor-pointer accent-[#bd7184]" type="range" min="-180" max="180" step="5" value={planning.backgroundIconRotation} onChange={(event) => update('backgroundIconRotation', Number(event.target.value))} /></label>
          <label>Estilo<select className="admin-input" value={planning.style} onChange={(event) => update('style', event.target.value)}>{planningOptions.styles.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Fonte<select className="admin-input" value={planning.fontFamily} onChange={(event) => update('fontFamily', event.target.value)}>{planningOptions.fonts.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Tamanho<select className="admin-input" value={planning.fontSize} onChange={(event) => update('fontSize', event.target.value)}>{planningOptions.sizes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Ícone do tema<select className="admin-input" value={planning.gameIcon} onChange={(event) => update('gameIcon', event.target.value)}>{planningOptions.gameIcons.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Formato do painel<select className="admin-input" value={planning.panelShape} onChange={(event) => update('panelShape', event.target.value)}>{planningOptions.panelShapes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="sm:col-span-2">Imagem de fundo<input className="admin-input cursor-pointer file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#bd7184] file:px-3 file:py-2 file:text-white" type="file" accept="image/*" onChange={handleBackgroundImage} />{uploadError && <span className="mt-2 block text-xs text-[#965365]">{uploadError}</span>}{planning.backgroundImage && <button className="mt-2 cursor-pointer text-xs text-[#965365] underline transition-opacity hover:opacity-60" type="button" onClick={() => update('backgroundImage', '')}>remover imagem</button>}</label>
          <label>Opacidade da imagem<input className="mt-4 w-full cursor-pointer accent-[#bd7184]" type="range" min="0.05" max="1" step="0.05" value={planning.backgroundImageOpacity} onChange={(event) => update('backgroundImageOpacity', Number(event.target.value))} /></label>
        </section>

        <section className="grid gap-5 rounded-3xl border p-6 sm:grid-cols-2 sm:p-8" style={sectionStyle}>
          <div className="sm:col-span-2 flex items-center justify-between gap-4">
            <div><p className="text-xs uppercase tracking-[.2em]" style={{ color: planning.accentColor }}>movimento</p><h2 className="mt-1 font-serif text-3xl">Animações</h2></div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                className="cursor-pointer rounded-full border border-[#bd7184] px-3 py-2 text-xs text-[#965365] transition-all duration-200 hover:-translate-y-1 hover:bg-[#bd7184] hover:text-white"
                type="button"
                onClick={() => setAnimationTestKey((current) => current + 1)}
              >
                testar animações
              </button>
              <label className="flex items-center gap-2"><input className="size-4 cursor-pointer accent-[#bd7184]" type="checkbox" checked={planning.animationEnabled} onChange={(event) => update('animationEnabled', event.target.checked)} />Ativar animações</label>
            </div>
          </div>
          <label>Preset de animação<select className="admin-input" value={planning.animationPreset} onChange={(event) => update('animationPreset', event.target.value)}>{planningOptions.animationPresets.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Velocidade<select className="admin-input" value={planning.animationSpeed} onChange={(event) => update('animationSpeed', event.target.value)}>{planningOptions.animationSpeeds.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Intensidade<select className="admin-input" value={planning.animationIntensity} onChange={(event) => update('animationIntensity', event.target.value)}>{planningOptions.animationIntensities.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Atraso de entrada<input className="mt-4 w-full cursor-pointer accent-[#bd7184]" type="range" min="0" max="3" step="0.1" value={planning.animationDelay} onChange={(event) => update('animationDelay', Number(event.target.value))} /></label>
          <label>Entrada do painel<select className="admin-input" value={planning.panelEntrance} onChange={(event) => update('panelEntrance', event.target.value)}>{planningOptions.panelEntrances.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Movimento contínuo<select className="admin-input" value={planning.panelLoop} onChange={(event) => update('panelLoop', event.target.value)}>{planningOptions.panelLoops.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Animação dos ícones<select className="admin-input" value={planning.iconAnimation} onChange={(event) => update('iconAnimation', event.target.value)}>{planningOptions.iconAnimations.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Hover do painel<select className="admin-input" value={planning.hoverAnimation} onChange={(event) => update('hoverAnimation', event.target.value)}>{planningOptions.hoverAnimations.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Movimento do fundo<select className="admin-input" value={planning.backgroundMotion} onChange={(event) => update('backgroundMotion', event.target.value)}>{planningOptions.backgroundMotions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Brilho animado<select className="admin-input" value={planning.glowAnimation} onChange={(event) => update('glowAnimation', event.target.value)}>{planningOptions.glowAnimations.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="flex items-center gap-2"><input className="size-4 cursor-pointer accent-[#bd7184]" type="checkbox" checked={planning.iconStagger} onChange={(event) => update('iconStagger', event.target.checked)} />Espalhar atraso entre ícones</label>
        </section>

        <section className="rounded-3xl border p-6 sm:p-8" style={sectionStyle}>
          <div className="flex items-center justify-between gap-4"><h2 className="font-serif text-3xl">Atividades</h2><label className="flex items-center gap-2 text-sm text-[#88777c]"><input type="checkbox" checked={planning.showDurations} onChange={(event) => update('showDurations', event.target.checked)} />Mostrar duração</label></div>
          <div className="mt-6 space-y-3">
            {planning.activities.map((activity) => <div className="flex gap-2" key={activity.id}><input className="admin-input" value={activity.name} onChange={(event) => updateActivity(activity.id, 'name', event.target.value)} /><input className="admin-input max-w-32" value={activity.duration} onChange={(event) => updateActivity(activity.id, 'duration', event.target.value)} /><button className="cursor-pointer px-3 text-[#965365] transition-transform duration-200 hover:scale-110" type="button" onClick={() => update('activities', planning.activities.filter((item) => item.id !== activity.id))}><Trash2 className="size-4" /></button></div>)}
            <button className="flex cursor-pointer items-center gap-2 text-sm text-[#965365] transition-all duration-200 hover:translate-x-1" type="button" onClick={() => update('activities', [...planning.activities, { id: Date.now(), name: 'Nova atividade', duration: '15 min' }])}><Plus className="size-4" />Adicionar atividade</button>
          </div>
        </section>

        <section className="rounded-3xl border p-6 sm:p-8" style={sectionStyle}>
          <label className="flex items-center gap-2 text-sm text-[#88777c]"><input type="checkbox" checked={planning.showTools} onChange={(event) => update('showTools', event.target.checked)} />Mostrar aplicativos e links</label>
          {planning.showTools && <div className="mt-6 space-y-3">{planning.tools.map((tool) => <div className="flex gap-2" key={tool.id}><input className="admin-input" value={tool.name} onChange={(event) => update('tools', planning.tools.map((item) => item.id === tool.id ? { ...item, name: event.target.value } : item))} /><input className="admin-input" value={tool.url} onChange={(event) => update('tools', planning.tools.map((item) => item.id === tool.id ? { ...item, url: event.target.value } : item))} placeholder="https://" /></div>)}</div>}
        </section>
      </form>
      </div>
    </main>
  )
}

export default Admin
