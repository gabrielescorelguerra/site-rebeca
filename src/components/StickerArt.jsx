import { useId } from 'react'

// Adesivos de papelaria, desenhados à mão em SVG, na paleta do site (sem emoji).
// Cada um tem a borda branca do corte (paint-order: stroke) e um brilho/sombra discretos.
const ROSE = '#d48a9d', DEEP = '#965365', WINE = '#7e3f52', SAGE = '#9fb8ae', MOSS = '#6f8f72', GOLD = '#d9ab5b', CREAM = '#fbf3ea', INK = '#5d4a52', SKY = '#a9c4d6'
const cut = { stroke: '#fff', strokeWidth: 6, strokeLinejoin: 'round', strokeLinecap: 'round', paintOrder: 'stroke' }
const ink = (color = INK, width = 1.4) => ({ fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round', strokeLinejoin: 'round' })

// Borda serrilhada de selo: círculos brancos ao longo do contorno.
const perforation = (x, y, w, h, r = 2.2, gap = 6) => {
  const dots = []
  for (let i = x; i <= x + w + 0.1; i += gap) dots.push([i, y], [i, y + h])
  for (let j = y + gap; j < y + h - 0.1; j += gap) dots.push([x, j], [x + w, j])
  return dots.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#fff" />)
}

const ART = {
  'selo-tulipa': id => <>
    <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dfe3" /><stop offset="1" stopColor="#efcdd5" /></linearGradient></defs>
    <rect x="13" y="8" width="54" height="64" rx="2" fill="#fff" />
    {perforation(13, 8, 54, 64)}
    <rect x="18" y="13" width="44" height="54" fill={`url(#${id}a)`} />
    <rect x="21" y="16" width="38" height="48" {...ink(ROSE, 0.8)} />
    <path d="M40 58V38M40 50c-5-1-8-4-9-8 5 0 8 3 9 8zM40 46c4-1 7-3 8-7-4 0-7 2-8 7z" {...ink(MOSS, 1.6)} />
    <path d="M32 26l3.5 4 4.5-6 4.5 6 3.5-4c1.5 6 0 10-3 12.5-3 2.5-7 2.5-10 0S30.5 32 32 26z" fill={ROSE} stroke={DEEP} strokeWidth=".8" />
    <text x="24" y="24" fontFamily="Georgia, serif" fontSize="7" fill={DEEP}>26</text>
    <text x="40" y="62.5" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="4.6" fill={DEEP}>correio do amor</text>
  </>,
  'selo-lua': id => <>
    <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7f9db0" /><stop offset="1" stopColor="#5e7d90" /></linearGradient></defs>
    <rect x="11" y="12" width="58" height="56" rx="2" fill="#fff" />
    {perforation(11, 12, 58, 56)}
    <rect x="16" y="17" width="48" height="46" fill={`url(#${id}a)`} />
    <path d="M47 26a12 12 0 1 0 6 20 10 10 0 0 1-6-20z" fill="#f4e7c9" />
    {[[25, 27, 1.3], [30, 50, 1], [55, 24, .9], [22, 40, .8], [57, 56, 1.1]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#f4e7c9" />)}
    <path d="M24 56l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.5-2.5 1.5.6-2.8-2.1-1.9 2.8-.3z" fill="#f4e7c9" />
    <text x="60" y="24" textAnchor="end" fontFamily="Georgia, serif" fontSize="6" fill="#f4e7c9">lua</text>
  </>,
  lacre: id => <>
    <defs><radialGradient id={`${id}a`} cx=".38" cy=".32" r=".75"><stop offset="0" stopColor="#c0657d" /><stop offset=".6" stopColor="#9a4a60" /><stop offset="1" stopColor="#6f3245" /></radialGradient></defs>
    <path {...cut} fill={`url(#${id}a)`} d="M40 9c6 0 8 4 13 5s10 1 12 6-1 9 1 14 6 8 4 13-7 6-9 10-2 10-7 12-9-1-14 0-8 5-13 3-6-6-10-9-9-3-11-8 2-9 0-14-5-8-3-13 7-5 10-9 2-9 7-11 8 1 13-1 4-3 7-3z" />
    <circle cx="40" cy="40" r="19" fill="none" stroke="#6f3245" strokeWidth="1.4" opacity=".55" />
    <circle cx="40" cy="40" r="19" fill="none" stroke="#d98ea1" strokeWidth=".8" opacity=".5" transform="translate(-.8 -.8)" />
    <path d="M40 51c-9-6-13-10-12-15 1-4 6-5 9-2l3 3 3-3c3-3 8-2 9 2 1 5-3 9-12 15z" fill="#7a3a4d" />
    <path d="M40 50c-8-5-11.5-9-11-13.5" fill="none" stroke="#d98ea1" strokeWidth="1" opacity=".55" />
    <ellipse cx="30" cy="24" rx="6" ry="3" fill="#fff" opacity=".22" transform="rotate(-30 30 24)" />
  </>,
  flor: () => <>
    <g {...cut} fill="none" strokeWidth="8"><path d="M40 72C40 55 38 40 33 26" /><circle cx="33" cy="20" r="10" /><path d="M39 52c8-4 14-4 20-1M37 42c-8-5-14-6-19-4" /></g>
    <path d="M40 72C40 55 38 40 33 26" {...ink(MOSS, 1.8)} />
    <path d="M39 52c8-4 14-4 20-1-6 4-13 4-20 1zM37 42c-8-5-14-6-19-4 6 4 12 6 19 4z" fill={SAGE} stroke={MOSS} strokeWidth=".9" />
    {[0, 51, 103, 154, 206, 257, 309].map(a => <ellipse key={a} cx="33" cy="12.5" rx="3.4" ry="6.6" fill="#fbf3ea" stroke="#e2c9cf" strokeWidth=".7" transform={`rotate(${a} 33 20)`} />)}
    <circle cx="33" cy="20" r="3.6" fill={GOLD} />
    <circle cx="32" cy="19" r="1.1" fill="#fff" opacity=".6" />
  </>,
  bilhete: () => <>
    <path {...cut} fill={CREAM} d="M8 22l64-6 2 10-1.5 2.2 2 2-1 2.8 2 2.4-1.4 2.6 2.4 3-2 2 1 9-64 6z" />
    <path d="M14 31h52M15 40h52M15 49h52" stroke="#ead6db" strokeWidth=".7" />
    <text x="40" y="44" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill={DEEP} transform="rotate(-5 40 40)">pra sempre</text>
    <path d="M25 49c9 2 22 1 30-2" {...ink(ROSE, 1.2)} transform="rotate(-5 40 40)" />
  </>,
  etiqueta: () => <>
    <path d="M16 12c6 2 10 6 12 12" {...ink('#fff', 6)} /><path d="M16 12c6 2 10 6 12 12" {...ink('#b08c6e', 1.4)} />
    <path {...cut} fill="#e8cfae" d="M27 20l34 8a4 4 0 0 1 3 4l-4 32a4 4 0 0 1-4.5 3.4L19 62a4 4 0 0 1-3-4.6l5-31z" />
    <circle cx="29" cy="28" r="3" fill="#fff" stroke="#b08c6e" strokeWidth="1" />
    <text x="41" y="52" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="15" fill={WINE} transform="rotate(8 41 45)">sim!</text>
  </>,
  polaroid: id => <>
    <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2c1a8" /><stop offset=".55" stopColor="#e7a0b2" /><stop offset="1" stopColor="#9b7fa6" /></linearGradient></defs>
    <g transform="rotate(-6 40 40)">
      <rect {...cut} strokeWidth="3" x="14" y="10" width="52" height="62" rx="1.5" fill="#fff" />
      <rect x="18" y="14" width="44" height="42" fill={`url(#${id}a)`} />
      <circle cx="40" cy="44" r="8" fill="#fbe1c5" opacity=".95" />
      <path d="M18 50c8-4 14-3 22 0s15 3 22-1v7H18z" fill="#6e5a7c" opacity=".7" />
      <text x="40" y="67" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="6" fill={INK}>nosso pôr do sol</text>
    </g>
  </>,
  ingresso: () => <>
    <g transform="rotate(-9 40 40)">
      <path {...cut} fill="#f3dfb8" d="M6 24h68v9a6 6 0 0 0 0 14v9H6v-9a6 6 0 0 0 0-14z" />
      <path d="M54 25v30" stroke="#c4a372" strokeWidth="1.2" strokeDasharray="2 2.6" />
      <rect x="11" y="29" width="38" height="22" fill="none" stroke="#c4a372" strokeWidth=".8" />
      <text x="30" y="39" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" letterSpacing=".6" fill={WINE}>ADMIT</text>
      <text x="30" y="48" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="8" fill={WINE}>two</text>
      <text x="64" y="44" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill={WINE} transform="rotate(-90 64 41)">nº 02</text>
    </g>
  </>,
  coracao: id => <>
    <defs><radialGradient id={`${id}a`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#f1b3c1" /><stop offset=".55" stopColor="#d9849a" /><stop offset="1" stopColor="#b55c74" /></radialGradient></defs>
    <path {...cut} strokeWidth="7" fill={`url(#${id}a)`} d="M40 67C21 54 12 44 12 31c0-9 7-16 15-16 6 0 10 3 13 8 3-5 7-8 13-8 8 0 15 7 15 16 0 13-9 23-28 36z" />
    <path d="M22 26c2-4 6-6 10-5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity=".75" />
    <circle cx="20" cy="33" r="1.6" fill="#fff" opacity=".7" />
  </>,
  estrela: id => <>
    <defs><linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6dc9c" /><stop offset=".45" stopColor="#dcae5c" /><stop offset=".6" stopColor="#f3d491" /><stop offset="1" stopColor="#b98a3e" /></linearGradient></defs>
    <path {...cut} strokeWidth="7" fill={`url(#${id}a)`} d="M40 8l8.6 19.4 21.1 2-15.9 14 4.6 20.7L40 53.4 21.6 64.1l4.6-20.7-15.9-14 21.1-2z" />
    <path d="M40 8l8.6 19.4L40 41zM69.7 29.4l-15.9 14L40 41zM58.4 64.1L40 53.4V41z" fill="#fff" opacity=".18" />
  </>,
  carta: () => <>
    <rect {...cut} x="9" y="18" width="62" height="42" rx="3" fill={CREAM} />
    <path d="M10 20l30 22 30-22" fill="#f3e3d6" stroke="#d9c2b4" strokeWidth="1" strokeLinejoin="round" />
    <path d="M10 58l22-18M70 58L48 40" stroke="#e3cfc2" strokeWidth="1" />
    <circle cx="40" cy="42" r="8" fill="#9a4a60" stroke="#7a3a4d" strokeWidth="1" />
    <path d="M40 47c-4-2.6-5.6-4.6-5-6.6.5-1.7 2.8-2.2 4.1-.8l.9.9.9-.9c1.3-1.4 3.6-.9 4.1.8.6 2-1 4-5 6.6z" fill="#d98ea1" />
    <path d="M52 52c4 0 9-1 12-3" {...ink(ROSE, 1)} />
  </>,
  tulipa: () => <>
    <g {...cut} fill="none" strokeWidth="8"><path d="M40 70V40" /><path d="M27 18l6 7 7-10 7 10 6-7c3 11 1 18-4 22-5 5-13 5-18 0-5-4-7-11-4-22z" /><path d="M40 60c-8-1-13-6-15-13 8 0 13 5 15 13zM41 55c7-2 11-6 13-12-7 0-11 4-13 12z" /></g>
    <path d="M40 70V40" {...ink(MOSS, 2.2)} />
    <path d="M40 60c-8-1-13-6-15-13 8 0 13 5 15 13zM41 55c7-2 11-6 13-12-7 0-11 4-13 12z" fill={SAGE} stroke={MOSS} strokeWidth="1" />
    <path d="M27 18l6 7 7-10 7 10 6-7c3 11 1 18-4 22-5 5-13 5-18 0-5-4-7-11-4-22z" fill={ROSE} stroke={DEEP} strokeWidth="1" />
    <path d="M40 16v20M33 26c1 6 3 10 7 12" {...ink(DEEP, .9)} opacity=".6" />
    <path d="M30 24c0 5 1 8 3 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".45" fill="none" />
  </>,
  cereja: () => <>
    <g {...cut} strokeWidth="7" fill="none"><path d="M28 50c3-14 10-26 22-34M50 16c-1 12-1 22 1 32" /></g>
    <path d="M28 50c3-14 10-26 22-34M50 16c-1 12-1 22 1 32" {...ink(MOSS, 2)} />
    <path d="M50 16c6-4 13-3 17 1-6 3-12 3-17-1z" fill={SAGE} stroke={MOSS} strokeWidth="1" />
    <circle {...cut} cx="26" cy="55" r="11" fill="#b94a63" /><circle {...cut} cx="51" cy="54" r="11" fill="#c4566e" />
    <ellipse cx="22" cy="51" rx="3" ry="2" fill="#fff" opacity=".6" transform="rotate(-30 22 51)" />
    <ellipse cx="47" cy="50" rx="3" ry="2" fill="#fff" opacity=".6" transform="rotate(-30 47 50)" />
  </>,
  cafe: () => <>
    <path {...cut} fill="#fff" d="M18 34h38v14c0 10-8 18-19 18s-19-8-19-18zM56 38c7 0 10 4 10 8s-4 8-10 8" />
    <path d="M18 34h38v6H18z" fill="#c69a7a" />
    <path d="M30 50c2 2 5 2 7 0 2 2 5 2 7 0" {...ink(ROSE, 1.3)} />
    <path d="M28 14c-3 4 3 7 0 12M37 11c-3 4 3 7 0 12M46 14c-3 4 3 7 0 12" {...ink('#c9b2b8', 1.6)} />
    <ellipse cx="37" cy="70" rx="22" ry="3" fill="#e8dcd6" />
  </>,
  aviao: () => <>
    <path {...cut} fill="#fff" d="M8 40l62-24-20 46-10-14-12 8 2-14z" />
    <path d="M8 40l62-24-40 22z" fill="#eef3f6" /><path d="M30 38l40-22-30 32z" fill={SKY} opacity=".55" />
    <path d="M30 38l-2 14 12-8" fill="#c9dbe6" />
    <path d="M8 40l62-24-20 46-10-14-12 8 2-14z" {...ink('#7f9db0', 1)} />
    <path d="M6 58c6-2 10-6 12-10" {...ink(ROSE, 1.2)} strokeDasharray="2 3" />
  </>,
  sol: id => <>
    <defs><radialGradient id={`${id}a`} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#f8dc9c" /><stop offset="1" stopColor="#dca453" /></radialGradient></defs>
    <g {...cut} fill={GOLD}>{[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => <path key={a} transform={`rotate(${a} 40 40)`} d="M37.5 8h5l-2.5 11z" />)}</g>
    <circle {...cut} cx="40" cy="40" r="15" fill={`url(#${id}a)`} />
    <path d="M34 42c3 4 9 4 12 0" {...ink(INK, 1.4)} /><circle cx="35" cy="37" r="1.3" fill={INK} /><circle cx="45" cy="37" r="1.3" fill={INK} />
    <circle cx="31" cy="42" r="2.2" fill={ROSE} opacity=".5" /><circle cx="49" cy="42" r="2.2" fill={ROSE} opacity=".5" />
  </>,
  lua: () => <>
    <path {...cut} strokeWidth="7" fill="#f4e7c9" d="M48 10a28 28 0 1 0 20 42A23 23 0 0 1 48 10z" />
    <circle cx="30" cy="44" r="3" fill="#e6d3ab" /><circle cx="38" cy="57" r="2" fill="#e6d3ab" /><circle cx="26" cy="30" r="1.6" fill="#e6d3ab" />
  </>,
  nuvem: () => <path {...cut} strokeWidth="7" fill="#fff" stroke="#fff" d="M22 58c-8 0-13-5-13-11s5-11 11-11c1-9 8-15 17-15 8 0 14 5 16 11 8 0 14 6 14 13s-6 13-14 13z" />,
  uau: () => <>
    <path {...cut} fill={ROSE} d="M40 7l5.5 8.5 9.8-3 1.2 10.1 9.9 2.3-4.4 9.2 6.6 7.6-8.8 4.6 1.4 10-10-.9-4.3 9.2-6.9-7.2-7.8 6.3-3.6-9.5-10-.8 2.6-9.8-7.7-6.5 8.6-5.2-.9-10 9.9.8 4.2-9.2z" />
    <circle cx="40" cy="40" r="17" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="2 2.5" opacity=".8" />
    <text x="40" y="45" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="15" fill="#fff">uau!</text>
  </>,
}

export default function StickerArt({ kind, className = '' }) {
  const id = useId().replace(/:/g, '')
  const art = ART[kind]
  if (!art) return null
  return <svg className={className} viewBox="0 0 80 80" aria-hidden="true">{art(`s${id}`)}</svg>
}
