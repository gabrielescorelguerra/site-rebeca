// Uma folha de papel que vira: dividida em faixas verticais encadeadas (cada uma presa na anterior),
// cada faixa gira um pouco mais que a de trás. Assim a folha curva como papel, em vez de girar como um bloco.
export const SEGMENTS = 12
const BEND = 70 // curvatura total (graus) no meio da virada

const leafVars = (p, dir) => {
  const lift = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI)
  const sign = dir === 'forward' ? 1 : -1
  const bend = BEND * lift * sign
  return { a: -180 * p + bend / 2, s: -bend / (SEGMENTS - 1), shade: lift }
}

// Atualiza a folha direto no DOM (sem re-renderizar o React a cada movimento do dedo).
export function applyLeaf(el, p, dir) {
  if (!el) return
  const v = leafVars(p, dir)
  el.style.setProperty('--a', `${v.a.toFixed(2)}deg`)
  el.style.setProperty('--s', `${v.s.toFixed(2)}deg`)
  el.style.setProperty('--shade', v.shade.toFixed(3))
}

// Anima a folha de p0 até p1 (0 = deitada à direita, 1 = virada para a esquerda).
export function runLeaf(getEl, dir, p0, p1, ms, done) {
  const start = performance.now()
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
  let frame = 0
  const tick = now => {
    const t = Math.min(1, (now - start) / Math.max(ms, 1))
    applyLeaf(getEl(), p0 + (p1 - p0) * ease(t), dir)
    if (t < 1) frame = window.requestAnimationFrame(tick); else done()
  }
  frame = window.requestAnimationFrame(tick)
  return () => window.cancelAnimationFrame(frame)
}

export default function PaperLeaf({ ref, front, back, narrow = false }) {
  const segment = i => {
    if (i >= SEGMENTS) return null
    return <div className="bk-seg" style={{ '--i': i }}>
      <div className="bk-seg-face is-front"><div className="bk-seg-paper" style={{ transform: `translateX(${(-i * 100) / SEGMENTS}%)` }}>{front}</div></div>
      <div className="bk-seg-face is-back"><div className="bk-seg-paper" style={{ transform: `translateX(${(-(SEGMENTS - 1 - i) * 100) / SEGMENTS}%)` }}>{back}</div></div>
      {segment(i + 1)}
    </div>
  }
  return <div ref={ref} className={`bk-paper-leaf ${narrow ? 'is-narrow' : ''}`} aria-hidden="true" inert>{segment(0)}</div>
}
