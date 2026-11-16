import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { PlanningCanvas } from '../Planning'

const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

// Renderiza a call fora da tela, numa largura fixa, e devolve onde cada bloco ficou.
// Serve para converter a grade em canvas (e o celular em coluna) sem mudar a aparência.
export async function measureLayout(planning, width, { forceGrid = false } = {}) {
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;visibility:hidden;pointer-events:none`
  document.body.append(host)
  const root = createRoot(host)
  try {
    flushSync(() => root.render(createElement(PlanningCanvas, { planning: { ...planning, animationEnabled: false }, ignorePast: true, forceGrid })))
    await frames()
    if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 800))])
    await frames()
    const canvas = host.querySelector('.planning-canvas')
    const content = host.querySelector('.call-content')
    const origin = canvas.getBoundingClientRect()
    const top = content.getBoundingClientRect().top
    const result = {}
    host.querySelectorAll('[data-block-id]').forEach(el => {
      const r = el.getBoundingClientRect()
      result[el.dataset.blockId] = { x: r.left - origin.left, y: r.top - top, w: r.width, h: r.height }
    })
    const panel = host.querySelector('.call-panel')?.getBoundingClientRect()
    return { frames: result, panel: panel ? { x: panel.left - origin.left, y: panel.top - top, w: panel.width, h: panel.height } : null, height: content.getBoundingClientRect().height }
  } finally {
    root.unmount()
    host.remove()
  }
}
