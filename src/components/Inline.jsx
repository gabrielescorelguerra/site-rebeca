import { useContext, useLayoutEffect, useRef } from 'react'
import { EditingContext } from './blockStyle'

// Texto editável no próprio bloco (só no editor). Fora dele, mostra o texto normalmente.
export default function Inline({ block, field, placeholder, multiline = true }) {
  const editing = useContext(EditingContext)
  const ref = useRef(null)
  const value = block.props?.[field] ?? ''
  useLayoutEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.textContent !== value) el.textContent = value
  })
  if (!editing) return value
  return <span
    ref={ref} className="inline-edit" contentEditable="plaintext-only" suppressContentEditableWarning spellCheck
    role="textbox" aria-multiline={multiline} aria-label={placeholder} data-placeholder={placeholder}
    onInput={event => editing.onProps(block.id, { [field]: event.currentTarget.textContent })}
    onKeyDown={event => {
      event.stopPropagation()
      if (event.key === 'Escape' || (!multiline && event.key === 'Enter')) { event.preventDefault(); event.currentTarget.blur() }
    }}
  />
}

