import { useRef } from 'react'

// Escolha entre duas seções, com a pílula deslizando de uma opção para a outra.
export default function SectionSwitch({ options, value, onChange, label }) {
  const refs = useRef([])
  const index = Math.max(0, options.findIndex(option => option.key === value))
  const move = (event, i) => {
    const next = event.key === 'ArrowRight' ? i + 1 : event.key === 'ArrowLeft' ? i - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : null
    if (next === null) return
    event.preventDefault()
    const target = (next + options.length) % options.length
    onChange(options[target].key)
    refs.current[target]?.focus()
  }
  return <div className="section-switch" role="tablist" aria-label={label} style={{ '--i': index, '--n': options.length }}>
    {options.map((option, i) => <button key={option.key} ref={el => { refs.current[i] = el }} id={`tab-${option.key}`} role="tab" type="button" aria-selected={option.key === value} tabIndex={option.key === value ? 0 : -1} onKeyDown={event => move(event, i)} onClick={() => onChange(option.key)}>{option.label}</button>)}
  </div>
}
