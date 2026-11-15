import { useId } from 'react'
import { RotateCcw } from 'lucide-react'
import { iconOptions } from '../data/icons'
import IconByKey from '../components/IconByKey'

export function Field({ label, hint, children }) {
  return <label className="field">{label && <span className="field-label">{label}</span>}{children}{hint && <small className="field-hint">{hint}</small>}</label>
}

export function TextField({ label, value, onChange, hint, ...rest }) {
  return <Field label={label} hint={hint}><input className="admin-input" value={value ?? ''} onChange={event => onChange(event.target.value)} {...rest} /></Field>
}

export function TextArea({ label, value, onChange, hint, rows = 3, ...rest }) {
  return <Field label={label} hint={hint}><textarea className="admin-input" rows={rows} value={value ?? ''} onChange={event => onChange(event.target.value)} {...rest} /></Field>
}

export function SelectField({ label, value, onChange, options, hint }) {
  return <Field label={label} hint={hint}>
    <select className="admin-input" value={value ?? ''} onChange={event => onChange(event.target.value)}>
      {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </Field>
}

export function Toggle({ label, hint, checked, onChange }) {
  return <label className="toggle-field"><span>{label}{hint && <small>{hint}</small>}</span><input type="checkbox" checked={Boolean(checked)} onChange={event => onChange(event.target.checked)} /></label>
}

// value indefinido = automático (herda da página); o botão volta ao automático.
export function Range({ label, value, onChange, min, max, step = 1, unit = '', auto, fallback }) {
  const shown = value ?? fallback ?? min
  return <div className="range-field">
    <span className="field-label">{label}<output>{value === undefined && auto ? 'auto' : `${shown}${unit}`}</output>{auto && value !== undefined && <button type="button" className="reset-chip" aria-label={`Voltar ${label} para automático`} onClick={() => onChange(undefined)}><RotateCcw size={11} /></button>}</span>
    <input type="range" min={min} max={max} step={step} value={shown} onChange={event => onChange(Number(event.target.value))} aria-label={label} />
  </div>
}

export function ColorField({ label, value, onChange, auto, fallback = '#bd7184' }) {
  return <div className="field">
    <span className="field-label">{label}</span>
    <div className="color-field">
      <input aria-label={label} type="color" value={value || fallback} onChange={event => onChange(event.target.value)} />
      <span>{value || (auto ? 'automático' : fallback)}</span>
      {auto && value && <button type="button" className="reset-chip" aria-label={`Voltar ${label} para automático`} onClick={() => onChange(undefined)}><RotateCcw size={11} /></button>}
    </div>
  </div>
}

export function Segmented({ label, value, onChange, options }) {
  const name = useId()
  return <div className="field" role="radiogroup" aria-label={label}>
    {label && <span className="field-label">{label}</span>}
    <div className="segmented">
      {options.map(([key, text, Icon]) => <label key={key} className={value === key ? 'active' : ''} title={typeof text === 'string' ? text : undefined}>
        <input type="radio" name={name} checked={value === key} onChange={() => onChange(key)} />
        {Icon ? <Icon size={15} aria-hidden="true" /> : null}<span className={Icon ? 'sr-only' : ''}>{text}</span>
      </label>)}
    </div>
  </div>
}

export function IconPicker({ label = 'Ícone', value, onChange, allowNone }) {
  return <div className="field">
    <span className="field-label">{label}</span>
    <div className="icon-picker" role="listbox" aria-label={label}>
      {allowNone && <button type="button" role="option" aria-selected={!value} className={!value ? 'active' : ''} onClick={() => onChange('')} title="Nenhum">—</button>}
      {iconOptions.map(([key, name]) => {
        return <button type="button" role="option" aria-selected={value === key} key={key} className={value === key ? 'active' : ''} onClick={() => onChange(key)} title={name} aria-label={name}><IconByKey name={key} size={17} /></button>
      })}
    </div>
  </div>
}

export function Section({ title, children, open = false }) {
  return <details className="inspector-section" open={open}><summary>{title}</summary><div className="inspector-section-body">{children}</div></details>
}
