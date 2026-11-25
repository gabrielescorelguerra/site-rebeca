// Adesivos desenhados à mão, na paleta do site. O contorno branco grosso dá o efeito de adesivo recortado.
const C = { rose: '#d98fa2', deep: '#965365', sage: '#9fb8ae', gold: '#e3b866', sky: '#a9c4d6', cream: '#f8ece4', ink: '#5d4a52' }
const cut = { stroke: '#fff', strokeWidth: 7, strokeLinejoin: 'round', strokeLinecap: 'round', paintOrder: 'stroke' }
const line = { fill: 'none', stroke: C.ink, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

const ART = {
  coracao: { label: 'Coração', body: <><path {...cut} fill={C.rose} d="M32 52C16 41 9 32 10 23c1-7 7-11 13-10 4 1 7 3 9 7 2-4 5-6 9-7 6-1 12 3 13 10 1 9-6 18-22 29z" /><path d="M20 22c1-3 3-4 6-4" {...line} stroke="#fff" strokeWidth="2.4" /></> },
  tulipa: { label: 'Tulipa', body: <><path {...cut} fill={C.sage} d="M31 30c1 9 1 17 0 25h3c-1-8-1-16 0-25zM32 46c-6-1-10-5-12-10 6 0 10 4 12 10zM33 42c5-1 9-4 11-9-5 0-9 3-11 9z" /><path {...cut} fill={C.rose} d="M20 12l6 7 6-9 6 9 6-7c2 9 1 15-3 19-5 4-13 4-18 0-4-4-5-10-3-19z" /><path d="M32 12v16" {...line} stroke={C.deep} /></> },
  estrela: { label: 'Estrela', body: <path {...cut} fill={C.gold} d="M32 8l6.5 15 16 1.5-12 10.5 3.6 16L32 42.6 17.9 51l3.6-16-12-10.5 16-1.5z" /> },
  sol: { label: 'Sol', body: <><g {...cut} fill={C.gold}><circle cx="32" cy="32" r="11" />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <path key={a} transform={`rotate(${a} 32 32)`} d="M30 8h4l-2 9z" />)}</g><path d="M27 33c2 3 8 3 10 0" {...line} /><circle cx="28" cy="29" r="1.2" fill={C.ink} /><circle cx="36" cy="29" r="1.2" fill={C.ink} /></> },
  lua: { label: 'Lua', body: <><path {...cut} fill={C.sky} d="M40 9a23 23 0 1 0 14 34A19 19 0 0 1 40 9z" /><circle cx="27" cy="34" r="2" fill="#fff" opacity=".6" /><circle cx="33" cy="44" r="1.4" fill="#fff" opacity=".6" /></> },
  nuvem: { label: 'Nuvem', body: <path {...cut} fill="#fff" stroke="#e6d8dc" d="M18 46c-6 0-10-4-10-9s4-9 9-9c1-7 7-12 14-12 6 0 11 4 13 9 6 0 11 5 11 11s-5 10-11 10z" /> },
  aviao: { label: 'Avião', body: <><path {...cut} fill={C.sky} d="M8 34l48-18-16 34-8-12-12 6 4-10z" /><path d="M32 38l24-22" {...line} /></> },
  cafe: { label: 'Café', body: <><path {...cut} fill={C.cream} d="M14 26h30v12c0 8-6 14-15 14s-15-6-15-14zM44 30c6 0 8 3 8 6s-3 6-8 6" /><path d="M23 12c-2 3 2 5 0 8M30 10c-2 3 2 5 0 8M37 12c-2 3 2 5 0 8" {...line} stroke={C.deep} /><path d="M18 30h22" {...line} stroke="#b48a6a" strokeWidth="3" /></> },
  cereja: { label: 'Cerejas', body: <><path d="M24 40c2-12 8-22 18-28M42 12c0 10-2 20-2 26" {...line} stroke="#fff" strokeWidth="7" /><path d="M24 40c2-12 8-22 18-28M42 12c0 10-2 20-2 26" {...line} stroke="#6f8f72" strokeWidth="2.2" /><circle {...cut} cx="22" cy="44" r="9" fill="#c4566e" /><circle {...cut} cx="41" cy="43" r="9" fill="#c4566e" /><circle cx="19" cy="41" r="2" fill="#fff" opacity=".7" /></> },
  carta: { label: 'Carta', body: <><rect {...cut} x="9" y="16" width="46" height="32" rx="3" fill={C.cream} /><path d="M10 18l22 16 22-16" {...line} stroke={C.deep} /><path {...cut} strokeWidth="4" fill={C.rose} d="M32 40c-5-3-7-6-6-8 1-2 4-2 6 1 2-3 5-3 6-1 1 2-1 5-6 8z" /></> },
  ingresso: { label: 'Ingresso', body: <><path {...cut} fill={C.gold} d="M8 20h48v7a5 5 0 0 0 0 10v7H8v-7a5 5 0 0 0 0-10z" transform="rotate(-8 32 32)" /><g transform="rotate(-8 32 32)"><path d="M40 21v22" {...line} strokeDasharray="2 3" /><text x="14" y="35" fontFamily="Georgia, serif" fontSize="9" fill={C.ink}>admit 2</text></g></> },
  uau: { label: 'Uau!', body: <><path {...cut} fill={C.rose} d="M32 6l5 8 9-3 1 9 9 2-4 8 6 7-8 4 1 9-9-1-4 8-6-6-7 5-3-9-9-1 3-8-6-7 8-4-1-9 9 1 4-8z" /><text x="32" y="37" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="14" fill="#fff">uau!</text></> },
}

export default function StickerArt({ kind, className = '' }) {
  const art = ART[kind]
  if (!art) return null
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true">{art.body}</svg>
}
