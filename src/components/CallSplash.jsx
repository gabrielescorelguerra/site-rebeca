import { Heart } from 'lucide-react'

export default function CallSplash() {
  return <main className="call-splash site-shell" role="status" aria-live="polite" aria-busy="true">
    <div className="splash-heart"><Heart size={38} strokeWidth={1.2} fill="currentColor" aria-hidden="true" /></div>
    <p className="eyebrow">só mais um instante</p>
    <h1>Tô com saudade de você.</h1>
    <p>Carregando nossa call…</p>
    <span className="splash-dots" aria-hidden="true"><i /><i /><i /></span>
  </main>
}
