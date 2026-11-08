import { useNavigate } from 'react-router-dom'
import { stopUserTest, useAccess } from '../lib/access'

export default function TestModeBar() {
  const { testing } = useAccess()
  const navigate = useNavigate()
  if (!testing) return null
  return <nav className="published-toolbar" aria-label="Modo de teste">
    <span>Modo de teste · usuário comum</span>
    <button type="button" className="text-button" onClick={() => { stopUserTest(); navigate('/admin') }}>Encerrar teste e voltar ao admin</button>
  </nav>
}
