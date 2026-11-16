// Coloca o cursor dentro do texto editável mais próximo do ponto clicado (ou no fim do primeiro).
export function focusInlineAt(root, x, y) {
  const fields = [...root.querySelectorAll('.inline-edit')]
  if (!fields.length) return false
  const hit = fields.find(el => { const r = el.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom }) || fields[0]
  hit.focus()
  const selection = window.getSelection()
  let range = null
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y)
    if (pos && hit.contains(pos.offsetNode)) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset) }
  } else if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y)
    if (r && hit.contains(r.startContainer)) range = r
  }
  if (!range) { range = document.createRange(); range.selectNodeContents(hit); range.collapse(false) }
  range.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(range)
  return true
}
