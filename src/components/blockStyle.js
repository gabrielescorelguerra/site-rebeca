import { createContext } from 'react'
import { entranceKeyframe, fonts, loopKeyframe, shadows, shapeRadius, variants, withAlpha } from '../data/visuals'

// Contexto do editor: quando existe, os blocos ficam selecionáveis, arrastáveis e redimensionáveis.
export const EditingContext = createContext(null)

const entranceSeconds = { slow: 1.8, relaxed: 1.2, normal: 0.8, fast: 0.5, turbo: 0.3 }
const fluidSize = size => size > 28 ? `clamp(${Math.round(size * 0.5)}px, ${(size / 10).toFixed(1)}cqw, ${size}px)` : `${size}px`

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
  const style = {
    ...css,
    borderRadius: shapeRadius(s.shape || 'rounded', s.radius),
    padding: s.padding ?? (variant !== 'none' ? 20 : 0),
    color: s.color || css.color,
    fontFamily: s.fontFamily && s.fontFamily !== 'inherit' ? fonts[s.fontFamily] : undefined,
    fontSize: s.size ? fluidSize(s.size) : block.type === 'heading' ? '2.6em' : undefined,
    fontWeight: s.weight || undefined,
    fontStyle: s.italic ? 'italic' : undefined,
    textTransform: s.uppercase ? 'uppercase' : undefined,
    letterSpacing: s.spacing !== undefined ? `${s.spacing}em` : undefined,
    lineHeight: s.lineHeight || undefined,
    textAlign: s.align && s.align !== 'inherit' ? s.align : undefined,
    opacity: s.opacity ?? undefined,
    minHeight: s.minHeight || undefined,
    '--justify': { left: 'flex-start', center: 'center', right: 'flex-end' }[s.align && s.align !== 'inherit' ? s.align : planning.textAlign || 'left'],
    ...(s.color ? { '--icon-color': s.color } : {}),
  }
  return style
}

