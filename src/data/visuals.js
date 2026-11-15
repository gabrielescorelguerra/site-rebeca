// Tudo aqui é CSS puro (objetos de estilo), sem classes geradas, para não quebrar em silêncio.

export const fonts = {
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

export const fontOptions = [
  ['serif', 'Serifada'], ['sans', 'Sem serifa'], ['mono', 'Monoespaçada'], ['rounded', 'Arredondada'],
  ['display', 'Display'], ['typewriter', 'Máquina de escrever'], ['pixel', 'Pixel'], ['handwriting', 'Manuscrita'], ['condensed', 'Condensada'],
]

export function withAlpha(hex, alpha = 1) {
  const clean = String(hex || '').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  if (!/^[0-9a-f]{6}$/i.test(full)) return hex
  const n = parseInt(full, 16)
  return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${alpha})`
}

/* ---------- Molduras (variantes) ---------- */
// Chaves legadas (minimal…terminal) foram mantidas para preservar chamadas já salvas.
export const variants = {
  none: { label: 'Sem moldura', css: {} },
  minimal: { label: 'Minimalista', css: { border: '1px solid #e8dfe0', background: 'rgba(255,255,255,.45)' } },
  soft: { label: 'Suave', css: { border: '1px solid #e7c5ce', background: '#fff5f6', color: '#31292d' } },
  outline: { label: 'Contorno', css: { border: '1.5px solid var(--accent-color)', background: 'transparent' } },
  accent: { label: 'Cor de destaque', css: { border: '1px solid var(--accent-color)', background: 'var(--accent-color)', color: '#fff' } },
  tint: { label: 'Tom suave do destaque', css: { border: '1px solid color-mix(in srgb, var(--accent-color) 30%, transparent)', background: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' } },
  dashed: { label: 'Tracejada', css: { border: '2px dashed color-mix(in srgb, var(--accent-color) 60%, transparent)', background: 'transparent' } },
  glass: { label: 'Vidro', css: { border: '1px solid rgba(255,255,255,.5)', background: 'rgba(255,255,255,.3)', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8), 0 20px 60px rgba(80,40,100,.15)' } },
  editorial: { label: 'Editorial', css: { border: '1px solid #30262a', background: '#30262a', color: '#fbf8f6' } },
  'paper-cut': { label: 'Papel recortado', css: { border: '1px solid #e8c6a5', background: '#fff7ed', color: '#4a3a30', boxShadow: '8px 8px 0 #e8c6a5, 16px 16px 0 #f3dfca' } },
  bubblegum: { label: 'Chiclete', css: { border: '1px solid #ff8edb', background: 'linear-gradient(to bottom right, #fff0fa, #b9e9ff)', color: '#4a2a40', boxShadow: '8px 8px 0 #ff8edb' } },
  'three-d': { label: '3D', css: { border: '1px solid var(--accent-color)', background: '#fffaf8', color: '#31292d', boxShadow: '10px 10px 0 var(--accent-color), 18px 18px 0 #e8dfe0' } },
  'toy-3d': { label: '3D divertido', css: { border: '1px solid #6b8cff', background: '#eef2ff', color: '#26335c', boxShadow: '0 12px 0 #6b8cff, 0 18px 28px rgba(107,140,255,.25)' } },
  sunset: { label: 'Pôr do sol', css: { border: '1px solid #ff9c6b', background: 'linear-gradient(to bottom right, #4c1d4d, #bd4d75, #ffad6b)', color: '#fff6ee', boxShadow: '0 20px 45px rgba(189,77,117,.4)' } },
  vaporwave: { label: 'Vaporwave', css: { border: '1px solid #ff78c8', background: 'linear-gradient(to bottom right, #28144f, #712b91, #0c6c88)', color: '#ffe9f7', boxShadow: '0 0 30px rgba(255,120,200,.4), 0 18px 50px rgba(12,108,136,.45)' } },
  neon: { label: 'Neon', css: { border: '1px solid #d46bff', background: '#171126', color: '#f6e9ff', boxShadow: '0 0 15px #ff2bd6, 0 0 45px rgba(123,44,255,.9), inset 0 0 30px rgba(0,229,255,.18)' } },
  cyberpunk: { label: 'Cyberpunk', css: { border: '1px solid #00e5ff', background: '#07151b', color: '#d9fbff', boxShadow: '8px 8px 0 #ff3cac, 0 0 35px rgba(0,229,255,.55), inset 0 0 0 2px #00e5ff' } },
  hologram: { label: 'Holograma', css: { border: '1px solid #75f5ff', background: 'linear-gradient(to bottom right, rgba(21,60,90,.85), rgba(109,31,135,.75))', color: '#e5fdff', boxShadow: '0 0 30px #75f5ff, inset 0 0 28px rgba(117,245,255,.4)' } },
  laser: { label: 'Laser', css: { border: '1px solid #ff315c', background: '#19070e', color: '#ffe6ec', boxShadow: '0 0 12px #ff315c, 0 0 38px rgba(255,49,92,.75), inset 0 -5px 0 #ff315c' } },
  matrix: { label: 'Matrix', css: { border: '1px solid #21ff72', background: '#031108', color: '#c9ffd9', boxShadow: '0 0 30px rgba(33,255,114,.5), inset 0 0 22px rgba(33,255,114,.16)' } },
  terminal: { label: 'Terminal', css: { border: '1px solid #45ff9b', background: '#080d0b', color: '#c9ffdf', boxShadow: '0 0 24px rgba(69,255,155,.45), inset 0 0 22px rgba(69,255,155,.16)' } },
  metal: { label: 'Metal', css: { border: '1px solid #b9c4d0', background: 'linear-gradient(to bottom right, #202832, #aeb9c5, #313b48)', color: '#f4f7fa', boxShadow: '8px 8px 0 #111820, inset 0 1px 0 #fff' } },
  custom: { label: 'Personalizada (cores livres)', css: {} },
}

export const variantOptions = Object.entries(variants).map(([key, value]) => [key, value.label])

/* ---------- Formas ---------- */
export const shapes = {
  rounded: '24px', soft: '12px', sharp: '0px', pill: '999px',
  arch: '999px 999px 18px 18px', blob: '38% 62% 54% 46% / 43% 38% 62% 57%', leaf: '0 56px 0 56px', ticket: '10px 28px 10px 28px',
}
export const shapeOptions = [
  ['rounded', 'Arredondada'], ['soft', 'Cantos suaves'], ['sharp', 'Reta'], ['pill', 'Pílula'],
  ['arch', 'Arco'], ['blob', 'Orgânica'], ['leaf', 'Folha'], ['ticket', 'Ingresso'], ['custom', 'Raio personalizado'],
]
// Formas antigas da moldura da página → formas seguras equivalentes.
export const legacyShape = {
  rounded: 'rounded', square: 'sharp', 'soft-square': 'soft', circle: 'rounded', heart: 'rounded', triangle: 'rounded',
  diamond: 'rounded', ticket: 'ticket', pill: 'pill', blob: 'blob', hexagon: 'leaf', notched: 'soft',
}
export function shapeRadius(shape, radius) {
  if (shape === 'custom') return `${Number.isFinite(Number(radius)) ? Number(radius) : 24}px`
  return shapes[shape] || shapes.rounded
}

export const shadows = (accent = '#bd7184') => ({
  none: 'none', soft: '0 18px 50px rgba(48,38,42,.07)', deep: '0 24px 60px rgba(48,38,42,.22)', glow: `0 0 35px ${withAlpha(accent, .35)}`,
})
export const shadowOptions = [['theme', 'Da moldura'], ['none', 'Sem sombra'], ['soft', 'Suave'], ['deep', 'Marcante'], ['glow', 'Brilho da cor de destaque']]

/* ---------- Texturas de fundo (todas válidas e na cor de destaque) ---------- */
const svg = markup => `url("data:image/svg+xml,${encodeURIComponent(markup)}")`
const HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 5 6.2 5c2 0 3.5 1.1 5.8 3.4C14.3 6.1 15.8 5 17.8 5 21 5 23.1 8.3 21.6 11.8 19.5 16.4 12 21 12 21z'

export const patternOptions = [
  ['none', 'Nenhuma'], ['stars', 'Estrelinhas'], ['sparkles', 'Brilhos'], ['hearts', 'Corações'], ['dots', 'Pontilhado'], ['grid', 'Grade'],
  ['lines', 'Listras'], ['checker', 'Xadrez'], ['waves', 'Ondas'], ['confetti', 'Confete'], ['clouds', 'Nuvens'], ['minecraft', 'Blocos'],
  ['arcade', 'Arcade'], ['game', 'Bolinhas de jogo'], ['pixel', 'Pixel art'], ['dungeon', 'Tijolos'], ['racing', 'Corrida'],
  ['space', 'Espaço'], ['underwater', 'Submarino'], ['portal', 'Portal'],
]

export function patternStyle(key, accent = '#bd7184', text = '#31292d') {
  const a = hex => withAlpha(hex, 1)
  const acc = a(accent)
  const soft = (alpha) => `color-mix(in srgb, ${acc} ${alpha}%, transparent)`
  const ink = (alpha) => `color-mix(in srgb, ${text} ${alpha}%, transparent)`
  switch (key) {
    case 'stars': return { backgroundImage: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><g fill="${accent}"><circle cx="12" cy="14" r="1.4" opacity=".7"/><circle cx="58" cy="30" r="1" opacity=".5"/><circle cx="34" cy="68" r="1.8" opacity=".6"/><circle cx="78" cy="76" r="1.1" opacity=".5"/></g></svg>`), backgroundSize: '90px 90px' }
    case 'sparkles': return { backgroundImage: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><g fill="${accent}" opacity=".55"><path d="M20 14l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M86 70l1.5 4.5 4.5 1.5-4.5 1.5L86 82l-1.5-4.5L80 76l4.5-1.5z"/></g></svg>`), backgroundSize: '120px 120px' }
    case 'hearts': return { backgroundImage: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path transform="translate(20 20) scale(.7)" fill="${accent}" opacity=".35" d="${HEART}"/></svg>`), backgroundSize: '64px 64px' }
    case 'dots': return { backgroundImage: `radial-gradient(circle, ${ink(22)} 1.2px, transparent 1.6px)`, backgroundSize: '18px 18px' }
    case 'grid': return { backgroundImage: `linear-gradient(${ink(9)} 1px, transparent 1px), linear-gradient(90deg, ${ink(9)} 1px, transparent 1px)`, backgroundSize: '32px 32px' }
    case 'lines': return { backgroundImage: `repeating-linear-gradient(135deg, ${soft(14)} 0 2px, transparent 2px 14px)` }
    case 'checker': return { backgroundImage: `conic-gradient(${soft(12)} 25%, transparent 0 50%, ${soft(12)} 0 75%, transparent 0)`, backgroundSize: '44px 44px' }
    case 'waves': return { backgroundImage: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="24"><path d="M0 12c10 0 10-8 20-8s10 8 20 8 10-8 20-8 10 8 20 8" fill="none" stroke="${accent}" stroke-width="1.5" opacity=".35"/></svg>`), backgroundSize: '80px 24px' }
    case 'confetti': return { backgroundImage: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><g fill="${accent}"><rect x="12" y="20" width="8" height="3" rx="1" transform="rotate(25 16 21)" opacity=".5"/><rect x="90" y="14" width="3" height="9" rx="1" transform="rotate(-20 91 18)" opacity=".4"/><circle cx="60" cy="70" r="3" opacity=".35"/><rect x="108" y="96" width="9" height="3" rx="1" transform="rotate(-35 112 97)" opacity=".5"/><rect x="26" y="104" width="3" height="8" rx="1" transform="rotate(30 27 108)" opacity=".4"/></g></svg>`), backgroundSize: '140px 140px' }
    case 'clouds': return { backgroundImage: 'radial-gradient(ellipse 60% 40% at 20% 10%, rgba(255,255,255,.75), transparent), radial-gradient(ellipse 50% 35% at 85% 30%, rgba(255,255,255,.6), transparent), radial-gradient(ellipse 70% 40% at 45% 80%, rgba(255,255,255,.5), transparent)' }
    case 'minecraft': return { backgroundImage: `conic-gradient(${soft(18)} 25%, transparent 0 50%, ${soft(18)} 0 75%, transparent 0)`, backgroundSize: '56px 56px' }
    case 'arcade': return { backgroundImage: `linear-gradient(90deg, ${soft(18)} 1px, transparent 1px), linear-gradient(${soft(18)} 1px, transparent 1px)`, backgroundSize: '24px 24px' }
    case 'game': return { backgroundImage: `radial-gradient(circle, ${soft(28)} 2px, transparent 2.5px)`, backgroundSize: '42px 42px' }
    case 'pixel': return { backgroundImage: `conic-gradient(${soft(14)} 25%, transparent 0 50%, ${soft(14)} 0 75%, transparent 0)`, backgroundSize: '20px 20px' }
    case 'dungeon': return { backgroundImage: `linear-gradient(${ink(16)} 2px, transparent 2px), linear-gradient(90deg, ${ink(16)} 2px, transparent 2px)`, backgroundSize: '64px 32px, 64px 32px', backgroundPosition: '0 0, 32px 0' }
    case 'racing': return { backgroundImage: `repeating-linear-gradient(135deg, ${ink(10)} 0 12px, transparent 12px 24px)` }
    case 'space': return { backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.9) 0 1px, transparent 1.5px), radial-gradient(circle, rgba(157,124,255,.8) 0 1px, transparent 1.5px)', backgroundSize: '47px 47px, 73px 73px', backgroundPosition: '0 0, 20px 30px' }
    case 'underwater': return { backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,.35) 0 6px, transparent 7px), radial-gradient(circle at 70% 40%, rgba(255,255,255,.25) 0 4px, transparent 5px), linear-gradient(to bottom, rgba(90,209,230,.12), rgba(20,108,157,.28))', backgroundSize: '160px 160px, 110px 110px, auto' }
    case 'portal': return { backgroundImage: 'conic-gradient(from 90deg at 50% 50%, rgba(0,229,255,.55), rgba(123,44,255,.55), rgba(255,60,172,.55), rgba(0,229,255,.55))' }
    default: return {}
  }
}

/* ---------- Movimento ---------- */
export const speeds = { slow: '14s', relaxed: '9s', normal: '5s', fast: '2.8s', turbo: '1.2s' }
export const intensities = { subtle: 0.35, low: 0.6, medium: 1, high: 1.45, extreme: 2 }
export const speedOptions = [['slow', 'Lenta'], ['relaxed', 'Relaxada'], ['normal', 'Normal'], ['fast', 'Rápida'], ['turbo', 'Turbo']]
export const intensityOptions = [['subtle', 'Sutil'], ['low', 'Leve'], ['medium', 'Média'], ['high', 'Alta'], ['extreme', 'Extrema']]

export const entranceOptions = [
  ['none', 'Nenhuma'], ['fade', 'Surgir'], ['rise', 'Subir'], ['slide-left', 'Entrar pela esquerda'], ['slide-right', 'Entrar pela direita'],
  ['zoom', 'Zoom'], ['flip', 'Virar'], ['bounce', 'Quicar'], ['glitch', 'Glitch'],
]
export const loopOptions = [
  ['none', 'Parado'], ['float', 'Flutuar'], ['breathe', 'Respirar'], ['sway', 'Balançar'], ['shake', 'Tremer'], ['spin', 'Girar'],
  ['pulse', 'Pulsar'], ['swing', 'Pêndulo'], ['glow-soft', 'Brilho suave'], ['glow-pulse', 'Brilho pulsante'], ['glow-rainbow', 'Arco-íris'], ['glow-flicker', 'Cintilar'],
]
export const hoverOptions = [['none', 'Nada'], ['lift', 'Elevar'], ['scale', 'Aumentar'], ['tilt', 'Inclinar'], ['glow', 'Iluminar'], ['jelly', 'Gelatina']]
export const backgroundMotionOptions = [['none', 'Parado'], ['drift', 'Deriva'], ['zoom', 'Zoom lento'], ['rotate', 'Rotação'], ['parallax', 'Balanço']]

export const entranceKeyframe = { fade: 'planning-fade', rise: 'planning-rise', 'slide-left': 'planning-slide-left', 'slide-right': 'planning-slide-right', zoom: 'planning-zoom', flip: 'planning-flip', bounce: 'planning-bounce', glitch: 'planning-glitch' }
export const loopKeyframe = {
  float: ['planning-float', 'ease-in-out'], breathe: ['planning-breathe', 'ease-in-out'], sway: ['planning-sway', 'ease-in-out'], shake: ['planning-shake', 'ease-in-out'],
  spin: ['planning-spin', 'linear'], pulse: ['planning-pulse', 'ease-in-out'], swing: ['planning-swing', 'ease-in-out'],
  'glow-soft': ['planning-glow-soft', 'ease-in-out'], 'glow-pulse': ['planning-glow-pulse', 'ease-in-out'], 'glow-rainbow': ['planning-glow-rainbow', 'linear'], 'glow-flicker': ['planning-glow-flicker', 'steps(2)'],
}
export const backgroundMotionKeyframe = { drift: 'planning-float', zoom: 'planning-breathe', rotate: 'planning-spin', parallax: 'planning-sway' }

export function motionVars(planning) {
  return {
    '--animation-duration': speeds[planning.animationSpeed] || speeds.normal,
    '--animation-intensity': intensities[planning.animationIntensity] ?? 1,
  }
}
