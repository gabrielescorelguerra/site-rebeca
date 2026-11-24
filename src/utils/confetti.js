// Confete em CSS: some sozinho e não aparece para quem prefere menos movimento.
export function confetti(colors = ['#bd7184', '#f2c1cc', '#ffd98a', '#a8d5c8', '#c9b8f0']) {
  if (typeof document === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const layer = document.createElement('div')
  layer.className = 'confetti-layer'
  layer.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < 48; i += 1) {
    const piece = document.createElement('i')
    piece.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};--dx:${(Math.random() - 0.5) * 240}px;--rot:${Math.random() * 720}deg;animation-delay:${Math.random() * 0.25}s;animation-duration:${1.6 + Math.random() * 1.1}s`
    layer.appendChild(piece)
  }
  document.body.appendChild(layer)
  window.setTimeout(() => layer.remove(), 3200)
}
