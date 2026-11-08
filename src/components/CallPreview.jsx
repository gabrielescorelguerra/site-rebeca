import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { PlanningCanvas } from '../Planning'
import CallSplash from './CallSplash'

export default function CallPreview({ planning, splash, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    const overflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => { element.close(); document.body.style.overflow = overflow }
  }, [])
  return <dialog ref={dialog} className="real-preview" onCancel={onClose} aria-label={splash ? 'Prévia do carregamento' : 'Prévia em tela inteira'}>
    <div className="real-preview-toolbar"><span>{splash ? 'Tela de carregamento' : 'Prévia do rascunho · alterações ainda não salvas'}</span><button autoFocus type="button" onClick={onClose}><X size={16} />Voltar ao editor</button></div>
    {splash ? <CallSplash /> : <PlanningCanvas planning={planning} onBack={onClose} />}
  </dialog>
}
