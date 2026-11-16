import { createContext } from 'react'
import { dropShadowCss, effectCss, entranceKeyframe, fonts, hoverOptions, loopKeyframe, shadows, shapeStyle, variants, withAlpha } from '../data/visuals'

// Contexto do editor: quando existe, os blocos ficam selecionáveis, arrastáveis e editáveis no lugar.
export const EditingContext = createContext(null)

const entranceSeconds = { slow: 1.8, relaxed: 1.2, normal: 0.8, fast: 0.5, turbo: 0.3 }
const alignJustify = { left: 'flex-start', center: 'center', right: 'flex-end' }

export function entranceStyle(planning, kind, delay = 0) {
  const keyframe = entranceKeyframe[kind]
  if (!keyframe) return undefined
  const seconds = entranceSeconds[planning.animationSpeed] || entranceSeconds.normal
  return { animation: `${keyframe} ${seconds}s cubic-bezier(.22,1,.36,1) backwards`, animationDelay: `${Math.max(0, delay)}s` }
}

export function loopStyle(kind) {
  const loop = loopKeyframe[kind]
  return loop ? { animation: `${loop[0]} var(--animation-duration) ${loop[1]} infinite` } : undefined
}

const textShadows = {
  soft: '0 2px 14px rgba(0,0,0,.28)', glow: '0 0 16px var(--accent-color), 0 0 2px var(--accent-color)', retro: '3px 3px 0 var(--accent-color)',
}

// Estilo da moldura/texto do bloco. O tamanho da fonte vai por variável (--fs) e é aplicado em px exatos,
// igual no editor e na página final; só em telas estreitas (container query) ele diminui.
export function boxStyle(block, planning) {
  const s = block.style || {}
  const variant = s.variant || 'none'
  const css = { ...(variants[variant]?.css || {}) }
  if (variant === 'custom') {
    const opacity = s.bgOpacity ?? 1
    css.background = s.bg2 ? `linear-gradient(${s.gradientAngle ?? 135}deg, ${withAlpha(s.bg || '#ffffff', opacity)}, ${withAlpha(s.bg2, opacity)})` : withAlpha(s.bg || '#ffffff', opacity)
    css.border = '1px solid color-mix(in srgb, currentColor 15%, transparent)'
  }
  if (s.borderWidth !== undefined) css.border = s.borderWidth > 0 ? `${s.borderWidth}px ${s.borderStyle || 'solid'} ${s.borderColor || 'var(--accent-color)'}` : 'none'
  if (s.shadow && s.shadow !== 'theme') css.boxShadow = shadows(planning.accentColor)[s.shadow]

  const shape = shapeStyle(s.shape || 'rounded', s.radius, s.padding ?? 0)
  if (shape.masked) { delete css.border; delete css.boxShadow; delete css.backdropFilter } // o recorte já define o contorno
  const framed = variant !== 'none'
  const userAlign = s.align && s.align !== 'inherit' ? s.align : null
  const align = userAlign || (shape.center ? 'center' : planning.textAlign || 'left')

  const style = {
    ...css,
    ...shape.css,
    padding: shape.padded ? shape.css.padding : (s.padding ?? (framed ? 20 : 0)),
    color: s.color || css.color,
    fontFamily: s.fontFamily && s.fontFamily !== 'inherit' ? fonts[s.fontFamily] : undefined,
    fontSize: !s.size && block.type === 'heading' ? '2.6em' : undefined,
    fontWeight: s.weight || undefined,
    fontStyle: s.italic ? 'italic' : undefined,
    textTransform: s.uppercase ? 'uppercase' : undefined,
    letterSpacing: s.spacing !== undefined ? `${s.spacing}em` : undefined,
    lineHeight: s.lineHeight || undefined,
    textAlign: align,
    opacity: s.opacity ?? undefined,
    minHeight: s.minHeight || undefined,
    filter: effectCss[s.effect] || undefined,
    backdropFilter: s.blur && !shape.masked ? `blur(${s.blur}px)` : css.backdropFilter,
    '--justify': alignJustify[align],
    ...(s.size ? { '--fs': s.size } : {}),
    ...(s.color ? { '--icon-color': s.color } : {}),
    ...(s.textEffect === 'outline' ? { WebkitTextStroke: '1.5px var(--accent-color)', color: 'transparent' } : s.textEffect && textShadows[s.textEffect] ? { textShadow: textShadows[s.textEffect] } : {}),
    ...(s.textGradient && s.color2 ? { '--tg': `linear-gradient(${s.gradientAngle ?? 90}deg, ${s.color || 'var(--accent-color)'}, ${s.color2})` } : {}),
  }
  return { style, masked: shape.masked, align }
}

// Posição livre: deslocamento e inclinação ficam em variáveis; o deslocamento encolhe em telas estreitas.
export function moverStyle(block, planning, masked) {
  const s = block.style || {}
  const style = {}
  if (s.offsetX || s.offsetY || s.rotate) {
    style.transform = `translate(calc(${s.offsetX || 0} * var(--offset-scale, 1) * 1px), calc(${s.offsetY || 0} * var(--offset-scale, 1) * 1px)) rotate(${s.rotate || 0}deg)`
  }
  if (s.maxWidth) style.maxWidth = `${s.maxWidth}px`
  if (s.place === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto' }
  else if (s.place === 'end') style.marginLeft = 'auto'
  // formas recortadas não têm borda: um contorno fino + sombra (drop-shadow) mantém o formato visível
  const drop = masked ? (s.shadow && s.shadow !== 'theme' ? dropShadowCss[s.shadow] || 'none' : 'drop-shadow(0 0 .7px color-mix(in srgb, var(--accent-color) 75%, transparent)) drop-shadow(0 10px 18px rgba(48,38,42,.12))') : null
  if (drop) style.filter = drop
  return style
}

const hoverKeys = new Set(hoverOptions.map(([key]) => key))

// Aparência comum do bloco (moldura, animações, alinhamento), usada pela grade e pelo canvas livre.
export function blockVisual(block, index, planning, editing) {
  const s = block.style || {}
  const animated = planning.animationEnabled && (!editing || editing.animate)
  const entrance = s.entrance && s.entrance !== 'inherit' ? s.entrance : planning.blockEntrance
  const hover = animated && hoverKeys.has(s.hover) && s.hover !== 'none' ? `hv-${s.hover}` : ''
  const delay = (Number(s.delay) || 0) + index * (Number(planning.blockStagger) || 0) + (Number(planning.animationDelay) || 0)
  const { style: boxCss, masked, align } = boxStyle(block, planning)
  const frameStyle = { ...boxCss, ...(animated && entrance !== 'none' ? entranceStyle(planning, entrance, delay) : {}) }
  const frameClass = `block-frame ${hover} ${s.size ? 'has-fs' : ''} ${s.textGradient && s.color2 ? 'has-tg' : ''}`
  return { animated, frameStyle, frameClass, masked, align, loop: animated ? loopStyle(s.loop) : undefined }
}

