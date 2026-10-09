import { useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { randomAffectionateName, randomAffectionatePhrase } from './utils/random'
import { ADMIN_AUTHENTICATED_KEY, AUTHENTICATED_KEY } from './data/planning'

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function App() {
  const [isOpening, setIsOpening] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true'
      || localStorage.getItem(AUTHENTICATED_KEY) === 'true',
  )
  const navigate = useNavigate()
  const mainMessage = useMemo(() => {
    const now = new Date()
    const name = randomAffectionateName()

    return `${getGreeting(now.getHours())}, ${name}`
  }, [])

  const subtitle = useMemo(() => {
    return `${randomAffectionatePhrase()}`
  }, [])

  const handleNextCall = () => {
    setIsOpening(true)
    const destination = localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true'
      ? '/admin'
      : localStorage.getItem(AUTHENTICATED_KEY) === 'true'
        ? '/planejamento'
        : '/autenticacao'
    navigate(destination)
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTHENTICATED_KEY)
    localStorage.removeItem(AUTHENTICATED_KEY)
    setIsAuthenticated(false)
  }

  return (
    <main className="welcome-shell site-shell flex min-h-svh flex-col px-6 py-6.5 text-[#31292d] sm:px-[6vw] sm:py-9.5">
      <div
        className="ambient-orb -right-28 -top-48 size-88 animate-[drift_12s_ease-in-out_infinite_alternate] sm:-right-28"
        aria-hidden="true"
      />
      <div
        className="ambient-orb -bottom-56 -left-36 size-88 animate-[drift_12s_-5s_ease-in-out_infinite_alternate]"
        aria-hidden="true"
      />

      <header className="page-transition flex items-center justify-end gap-4 text-[.72rem] uppercase tracking-[.16em] text-[#88777c]">
        <span className="flex items-center gap-4">
        <span className="font-semibold text-[#31292d]">rebeca</span>
        <Heart className="heart-beat size-4 text-[#bd7184]" strokeWidth={1.8} fill="currentColor" aria-hidden="true" />
        {isAuthenticated && (
          <button
            className="cursor-pointer transition-all duration-200 hover:-translate-x-1 hover:text-[#965365]"
            type="button"
            onClick={handleLogout}
          >
            logout
          </button>
        )}
        </span>
      </header>

      <div className="welcome-flower" aria-hidden="true"><svg viewBox="0 0 200 260" fill="none"><path d="M100 240V115M100 201C51 196 45 169 46 159C80 159 100 181 100 201ZM101 180C144 177 153 152 153 142C122 143 101 163 101 180Z" stroke="currentColor" strokeWidth="1.2"/><path d="M100 119C61 119 54 82 58 48C72 52 84 63 91 75L100 38L109 75C116 63 128 52 142 48C146 82 139 119 100 119Z" fill="#e9c9d2" stroke="currentColor" strokeWidth="1.2"/><path d="M100 119C83 103 85 88 91 75M100 119C117 103 115 88 109 75" stroke="currentColor" strokeWidth="1.2"/></svg></div>
      <section className="page-transition m-auto w-full max-w-190 text-center" aria-labelledby="welcome-title">
        <h1 id="welcome-title" className="mx-auto max-w-180 font-serif text-[clamp(3rem,8vw,6.7rem)] font-normal mb-8.5 leading-[.98] tracking-[-.06em] text-[#965365]">
          {mainMessage}
          <span className="text-[#bd7184]" aria-hidden="true">.</span>
        </h1>
        <p className="mx-auto mb-8.5 max-w-md text-[.96rem] leading-relaxed text-[#88777c]">
          {subtitle}
        </p>

        <button
          className="primary-button inline-flex min-w-55.5 cursor-pointer items-center justify-between gap-8 rounded-full border border-[#bd7184] bg-[#bd7184] px-5.25 py-3.75 text-[.82rem] tracking-[.03em] text-[#fffaf9] transition duration-220 ease-in-out hover:-translate-y-1 hover:bg-transparent hover:text-[#965365] disabled:cursor-wait sm:max-w-67.5 sm:w-full"
          type="button"
          onClick={handleNextCall}
          disabled={isOpening}
        >
          <span>Ver a próxima call</span>
          <span className={isOpening ? 'animate-[arrow-pulse_.7s_ease-in-out_infinite] text-[1.15rem] leading-none' : 'text-[1.15rem] leading-none'} aria-hidden="true">↗</span>
        </button>

        <div className="mt-7 flex items-center justify-center gap-3 text-[.68rem] uppercase tracking-[.16em] text-[#a8979b]" aria-live="polite">
          <span className="h-px w-6 bg-[#e8dfe0]" aria-hidden="true" />
          <span>feito com carinho</span>
          <span className="h-px w-6 bg-[#e8dfe0]" aria-hidden="true" />
        </div>
      </section>

      {/* <footer className="flex animate-[appear_.8s_.35s_ease_both] items-center justify-center gap-[9px] text-[.72rem] uppercase tracking-[.16em] text-[#88777c]">
        <span>feito com carinho</span>
        <span className="text-base text-[#bd7184]" aria-hidden="true">·</span>
        <span>2026</span>
      </footer> */}
      <footer className="welcome-footer"><span>um lugar para nossos próximos momentos</span></footer>
    </main>
  )
}

export default App
