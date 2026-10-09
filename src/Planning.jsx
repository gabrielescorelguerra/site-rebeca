import { CalendarDays, Cat, Circle, CircleDashed, Coffee, Clock3, Crown, Cuboid, Dice5, ExternalLink, Flame, Gamepad2, Ghost, Heart, Joystick, Music, Rocket, Sparkles, Star, Square, Sword, Trophy, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultPlanning, loadPlanning } from './data/planning'
import { planningPatterns } from './data/planningVisuals'
import { animationIntensities, animationSpeeds, entranceAnimations, hoverAnimations, iconAnimations, loopAnimations } from './data/planningAnimations'

const fonts = {
  sans: 'Inter, ui-sans-serif, sans-serif',
  serif: 'Georgia, serif',
  mono: '"Space Mono", monospace',
  rounded: '"Nunito", sans-serif',
  display: '"Bebas Neue", sans-serif',
  typewriter: '"Special Elite", monospace',
  pixel: '"Press Start 2P", monospace',
  handwriting: '"Caveat", cursive',
  condensed: '"Oswald", sans-serif',
}

const sizes = {
  micro: 'text-[.65rem]', tiny: 'text-xs sm:text-sm', compact: 'text-sm sm:text-base',
  medium: 'text-base sm:text-lg', large: 'text-lg sm:text-xl', huge: 'text-xl sm:text-2xl',
  poster: 'text-2xl sm:text-3xl', hero: 'text-3xl sm:text-4xl',
  responsive: 'text-[clamp(.9rem,2vw,1.5rem)]', maximum: 'text-2xl sm:text-5xl',
  cinema: 'text-xl sm:text-3xl', book: 'text-base sm:text-xl', banner: 'text-2xl sm:text-4xl',
  mobile: 'text-sm sm:text-xl', xl: 'text-3xl sm:text-6xl', xxl: 'text-4xl sm:text-8xl',
  custom: 'text-[clamp(1rem,4vw,3rem)]',
}

const styles = {
  minimal: 'border-[#e8dfe0] bg-white/45', soft: 'border-[#e7c5ce] bg-[#fff5f6]',
  editorial: 'border-[#30262a] bg-[#30262a]', neon: 'border-[#d46bff] bg-[#171126] shadow-[0_0_15px_#ff2bd6,0_0_45px_rgba(123,44,255,.9),inset_0_0_30px_rgba(0,229,255,.18)]',
  cyberpunk: 'border-[#00e5ff] bg-[#07151b] shadow-[8px_8px_0_#ff3cac,0_0_35px_rgba(0,229,255,.55),inset_0_0_0_2px_#00e5ff]',
  vaporwave: 'border-[#ff78c8] bg-gradient-to-br from-[#28144f] via-[#712b91] to-[#0c6c88] shadow-[0_0_30px_rgba(255,120,200,.4),0_18px_50px_rgba(12,108,136,.45)]',
  glass: 'border-white/50 bg-white/30 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_20px_60px_rgba(80,40,100,.15)]',
  'three-d': 'border-[#bd7184] bg-[#fffaf8] shadow-[10px_10px_0_#bd7184,18px_18px_0_#e8dfe0]',
  'toy-3d': 'border-[#6b8cff] bg-[#eef2ff] shadow-[0_12px_0_#6b8cff,0_18px_28px_rgba(107,140,255,.25)]',
  hologram: 'border-[#75f5ff] bg-gradient-to-br from-[#153c5a]/80 to-[#6d1f87]/70 shadow-[0_0_30px_#75f5ff,inset_0_0_28px_rgba(117,245,255,.4)]',
  laser: 'border-[#ff315c] bg-[#19070e] shadow-[0_0_12px_#ff315c,0_0_38px_rgba(255,49,92,.75),inset_0_-5px_0_#ff315c]',
  matrix: 'border-[#21ff72] bg-[#031108] shadow-[0_0_30px_rgba(33,255,114,.5),inset_0_0_22px_rgba(33,255,114,.16)]',
  sunset: 'border-[#ff9c6b] bg-gradient-to-br from-[#4c1d4d] via-[#bd4d75] to-[#ffad6b] shadow-[0_20px_45px_rgba(189,77,117,.4)]',
  bubblegum: 'border-[#ff8edb] bg-gradient-to-br from-[#fff0fa] to-[#b9e9ff] shadow-[8px_8px_0_#ff8edb]',
  metal: 'border-[#b9c4d0] bg-gradient-to-br from-[#202832] via-[#aeb9c5] to-[#313b48] shadow-[8px_8px_0_#111820,inset_0_1px_0_#fff]',
  'paper-cut': 'border-[#e8c6a5] bg-[#fff7ed] shadow-[8px_8px_0_#e8c6a5,16px_16px_0_#f3dfca]',
  terminal: 'border-[#45ff9b] bg-[#080d0b] shadow-[0_0_24px_rgba(69,255,155,.45),inset_0_0_22px_rgba(69,255,155,.16)]',
}

const panelShapes = {
  rounded: { borderRadius: '2rem' }, square: { borderRadius: 0 }, 'soft-square': { borderRadius: '1rem' },
  circle: { borderRadius: '50%' }, heart: { borderRadius: '42% 42% 48% 48%' },
  triangle: { borderRadius: '35% 35% 1rem 1rem' }, diamond: { borderRadius: '32% 32% 32% 32%' },
  ticket: { borderRadius: '1.5rem', borderLeft: 0, borderRight: 0 }, pill: { borderRadius: '999px' },
  blob: { borderRadius: '38% 62% 54% 46% / 43% 38% 62% 57%' },
  hexagon: { borderRadius: '1rem 3rem 1rem 3rem' }, notched: { borderRadius: '1rem 0 1rem 0' },
}

const shapeDecorations = {
  heart: 'polygon(50% 92%, 5% 42%, 5% 22%, 15% 8%, 32% 8%, 50% 25%, 68% 8%, 85% 8%, 95% 22%, 95% 42%)',
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  hexagon: 'polygon(12% 0%, 88% 0%, 100% 50%, 88% 100%, 12% 100%, 0% 50%)',
  notched: 'polygon(0 18px, 18px 18px, 18px 0, calc(100% - 18px) 0, calc(100% - 18px) 18px, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 18px calc(100% - 18px), 0 calc(100% - 18px))',
}

const gameIcons = {
  blocks: Cuboid, gamepad: Gamepad2, sword: Sword, ghost: Ghost, rocket: Rocket,
  dice: Dice5, trophy: Trophy, joystick: Joystick, sparkles: Sparkles, heart: Heart,
  star: Star, crown: Crown, flame: Flame, zap: Zap, cat: Cat, circle: Circle,
  square: Square, music: Music, coffee: Coffee,
}

const backgroundMotions = {
  none: '',
  drift: 'animate-[planning-float_var(--animation-duration)_ease-in-out_infinite]',
  zoom: 'animate-[planning-breathe_var(--animation-duration)_ease-in-out_infinite]',
  rotate: 'animate-[planning-spin_var(--animation-duration)_linear_infinite]',
  parallax: 'animate-[planning-sway_var(--animation-duration)_ease-in-out_infinite]',
  wave: 'animate-[planning-sway_var(--animation-duration)_ease-in-out_infinite]',
}

const glowAnimations = {
  none: '',
  soft: 'animate-[planning-glow-soft_var(--animation-duration)_ease-in-out_infinite]',
  pulse: 'animate-[planning-glow-pulse_var(--animation-duration)_ease-in-out_infinite]',
  rainbow: 'animate-[planning-glow-rainbow_var(--animation-duration)_linear_infinite]',
  flicker: 'animate-[planning-glow-flicker_var(--animation-duration)_steps(2)_infinite]',
}

const iconPositions = Array.from({ length: 48 }, (_, index) => index)

export function BackgroundIconLayer({ planning }) {
  if (!planning.backgroundIconEnabled || !planning.backgroundIcon) return null

  const Icon = gameIcons[planning.backgroundIcon] || CircleDashed
  const randomIcons = planning.backgroundIcon === 'random'
    ? Object.values(gameIcons).slice(0, 10)
    : [Icon]

  const iconAnimation = planning.animationEnabled ? iconAnimations[planning.iconAnimation] : ''

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 grid grid-cols-6 content-start overflow-hidden"
      style={{
        gridAutoRows: `${planning.backgroundIconSpacing}px`,
        color: planning.backgroundIconColor,
        opacity: planning.backgroundIconOpacity,
        padding: `${planning.backgroundIconSpacing / 2}px`,
        '--animation-duration': animationSpeeds[planning.animationSpeed] || animationSpeeds.normal,
        '--animation-intensity': animationIntensities[planning.animationIntensity] || 1,
        gap: `${planning.backgroundIconSpacing / 2}px`,
      }}
      aria-hidden="true"
    >
      {iconPositions.map((position) => {
        const IconComponent = randomIcons[position % randomIcons.length]
        return (
          <IconComponent
            className={`justify-self-center self-center ${iconAnimation}`}
            key={position}
            size={planning.backgroundIconSize}
            strokeWidth={1.5}
            style={{ transform: `rotate(${planning.backgroundIconRotation}deg)`, animationDelay: planning.iconStagger ? `${(position % 12) * 0.12}s` : '0s' }}
          />
        )
      })}
    </div>
  )
}

export function PlanningView({ planning }) {
  const date = new Date(planning.date)
  const formattedDate = Number.isNaN(date.getTime()) ? 'Nosso encontro ainda não tem data' : date.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })
  const Icon = gameIcons[planning.gameIcon] || CircleDashed
  const duration = animationSpeeds[planning.animationSpeed] || animationSpeeds.normal
  const intensity = animationIntensities[planning.animationIntensity] || animationIntensities.medium
  const animationStyle = planning.animationEnabled
    ? { '--animation-duration': duration, '--animation-ease': planning.animationPreset === 'dramatic' ? 'cubic-bezier(.2,.9,.2,1.4)' : 'cubic-bezier(.22,1,.36,1)', '--animation-intensity': intensity }
    : {}
  const shadows = { none: 'none', soft: '0 18px 50px #30262a12', deep: '0 24px 60px #30262a35', glow: `0 0 35px ${planning.accentColor}50` }
  const panelStyle = { ...(panelShapes[planning.panelShape] || panelShapes.rounded), borderWidth: `${planning.panelBorderWidth}px`, borderStyle: planning.panelBorderStyle, ...(planning.panelShadow !== 'theme' ? { boxShadow: shadows[planning.panelShadow] } : {}), '--activity-gap': `${planning.activityGap}px`, '--text-line-height': planning.textLineHeight, color: planning.textColor, '--accent-color': planning.accentColor, fontFamily: fonts[planning.fontFamily] || fonts.sans, textAlign: planning.textAlign, maxWidth: `${planning.panelWidth}px`, '--panel-padding': `${planning.panelPadding}px`, '--title-size': `${planning.titleSize}px`, ...(planning.fontSize === 'custom' ? { fontSize: `${planning.customFontSize}px`, '--custom-font-size': `${planning.customFontSize}px` } : {}), ...(planning.style === 'custom' ? { backgroundColor: `color-mix(in srgb, ${planning.panelColor} ${planning.panelOpacity * 100}%, transparent)`, borderColor: `${planning.accentColor}40` } : {}), ...animationStyle }
  const panelAnimation = planning.animationEnabled ? entranceAnimations[planning.panelEntrance] : ''
  const panelLoop = planning.animationEnabled ? loopAnimations[planning.panelLoop] : ''
  const hoverAnimation = planning.animationEnabled ? hoverAnimations[planning.hoverAnimation] : ''
  const glowAnimation = planning.animationEnabled ? glowAnimations[planning.glowAnimation] : ''

  return (
    <div className={`call-animation-wrapper ${panelAnimation}`} style={{ ...animationStyle, animationDelay: `${planning.animationDelay || 0}s` }}><div className={panelLoop} style={animationStyle}><section className={`call-panel editorial-panel relative mx-auto w-full max-w-5xl border p-7 sm:p-14 transition-all duration-500 ${planning.style === 'custom' ? '' : styles[planning.style] || styles.minimal} ${sizes[planning.fontSize] || sizes.medium} ${hoverAnimation} ${glowAnimation}`} style={{ ...panelStyle, animationDelay: `${planning.animationDelay || 0}s` }}>
      {shapeDecorations[planning.panelShape] && <div className="pointer-events-none absolute inset-0 -z-0 opacity-10" style={{ clipPath: shapeDecorations[planning.panelShape], backgroundColor: planning.accentColor }} />}
      <div className="call-intro relative z-10">
        {planning.showPlanningLabel && <div className="mb-7 flex items-center gap-2 text-xs uppercase tracking-[.2em]" style={{ color: planning.planningLabelColor || planning.accentColor }}><Icon className={planning.animationEnabled ? iconAnimations[planning.iconAnimation] : ''} style={{ animationDelay: '0.2s', '--animation-duration': duration }} size={16} aria-hidden="true" />{planning.planningLabel}</div>}
        <h1 className="call-title font-normal leading-[1.06]" style={{ fontWeight: planning.titleWeight, letterSpacing: `${planning.titleSpacing}em` }}>{planning.title}</h1>
        <p className="mt-6 max-w-xl opacity-65">{planning.subtitle}</p>
        {planning.showDate && <div className="call-date mt-8 flex flex-wrap gap-4 text-sm opacity-70"><span className="flex items-center gap-2"><CalendarDays className="size-4" />{formattedDate}</span></div>}
        {planning.showCountdown && <Countdown date={planning.date} />}
      </div>
      <div className={`relative z-10 mt-12 grid gap-8 border-t border-current/10 pt-8 ${planning.showTools ? 'call-with-tools' : ''}`}>
        <div><h2 className="text-xs uppercase tracking-[.2em] opacity-55">{planning.activitiesLabel}</h2><ol className={`call-activities mt-5 layout-${planning.activityLayout}`} >{planning.activities.map((activity, index) => <li className="flex items-center justify-between gap-4 border-b border-current/10 py-4" key={activity.id}><span className="flex items-center gap-4">{planning.showActivityNumbers && <span className="activity-number text-sm text-[color:var(--accent-color)]">{String(index + 1).padStart(2, '0')}</span>}<span>{activity.name}{activity.description && <small className="activity-description">{activity.description}</small>}</span></span>{planning.showDurations && <span className="flex shrink-0 items-center gap-1 text-sm opacity-55"><Clock3 className="size-3.5" />{activity.duration}</span>}</li>)}</ol></div>
        {planning.showTools && <aside className="border-t border-current/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8"><h2 className="text-xs uppercase tracking-[.2em] opacity-55">{planning.toolsLabel}</h2><div className="mt-5 space-y-3">{planning.tools.map((tool) => <a className="flex items-center justify-between border-b border-current/10 py-3 transition-colors hover:text-[color:var(--accent-color)]" href={/^https?:\/\//i.test(tool.url) ? tool.url : undefined} target="_blank" rel="noreferrer" key={tool.id}>{tool.name}<ExternalLink className="size-4" /></a>)}</div></aside>}
      </div>
      {planning.footerMessage && <p className="call-footer"><Heart size={13} />{planning.footerMessage}</p>}
    </section></div></div>
  )
}

function Planning() {
  const navigate = useNavigate()
  const [planning, setPlanning] = useState(defaultPlanning)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
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
  }, [])

  if (loadError) {
    return <main className="flex min-h-svh items-center justify-center px-6 text-center text-[#31292d]"><p>{loadError}</p></main>
  }

  return <PlanningCanvas planning={planning} onBack={() => navigate('/')} />
}

function Countdown({ date }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer) }, [])
  const remaining = new Date(date).getTime() - now
  if (!Number.isFinite(remaining) || remaining <= 0) return null
  const minutes = Math.floor(remaining / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor(minutes % 1440 / 60)
  return <p className="call-countdown">♡ falta{minutes >= 60 ? 'm' : ''} {days > 0 ? `${days}d ` : ''}{hours > 0 ? `${hours}h ` : ''}{minutes % 60}min para nós</p>
}

export function PlanningCanvas({ planning, preview = false, onBack }) {
  return <div className={`planning-canvas ${preview ? 'is-preview' : ''} ${planningPatterns[planning.backgroundPattern] || ''}`} style={{ backgroundColor: planning.backgroundColor, ...(planning.backgroundGradient ? { backgroundImage: `linear-gradient(${planning.backgroundGradientAngle}deg, ${planning.backgroundColor}, ${planning.backgroundGradientColor})` } : {}), color: planning.textColor, '--accent-color': planning.accentColor, fontFamily: fonts[planning.fontFamily] || fonts.sans }}>
    {planning.backgroundImage && <div className={`planning-image ${planning.animationEnabled ? backgroundMotions[planning.backgroundMotion] : ''}`} style={{ backgroundImage: `url(${planning.backgroundImage})`, opacity: planning.backgroundImageOpacity, backgroundPosition: planning.backgroundImagePosition, filter: `blur(${planning.backgroundImageBlur}px)`, '--animation-duration': animationSpeeds[planning.animationSpeed] || animationSpeeds.normal }} />}
    <BackgroundIconLayer planning={planning} />
    <header className="call-header"><span><Heart size={15} fill="currentColor" />rebeca</span>{preview ? <span style={{ color: planning.backButtonColor }}>voltar para o começo</span> : <button type="button" style={{ color: planning.backButtonColor }} onClick={onBack}>voltar para o começo</button>}</header>
    <div className="call-content"><PlanningView planning={planning} /></div>
  </div>
}

export default Planning
