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
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#fbf8f6] px-6 py-6.5 text-[#31292d] sm:px-[6vw] sm:py-9.5">
      <div
        className="pointer-events-none absolute -right-28 -top-48 -z-10 size-88 animate-[drift_12s_ease-in-out_infinite_alternate] rounded-full border border-[#bd7184]/16 after:absolute after:inset-[18%] after:rounded-full after:border after:border-[#bd7184]/13 sm:-right-28"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-56 -left-36 -z-10 size-88 animate-[drift_12s_-5s_ease-in-out_infinite_alternate] rounded-full border border-[#bd7184]/16 after:absolute after:inset-[18%] after:rounded-full after:border after:border-[#bd7184]/13"
        aria-hidden="true"
      />

      <header className="flex animate-[appear_.8s_ease_both] items-center justify-end gap-4 text-[.72rem] uppercase tracking-[.16em] text-[#88777c]">
        <span className="font-semibold text-[#31292d]">rebeca</span>
        <Heart className="size-4 text-[#bd7184]" strokeWidth={1.8} fill="currentColor" aria-hidden="true" />
        {isAuthenticated && (
          <button
            className="cursor-pointer transition-all duration-200 hover:-translate-x-1 hover:text-[#965365]"
            type="button"
            onClick={handleLogout}
          >
            logout
          </button>
        )}
      </header>

      <section className="m-auto w-full max-w-190 animate-[rise_1s_.1s_ease_both] text-center" aria-labelledby="welcome-title">
        {/* <p className="mb-7 text-[.74rem] uppercase tracking-[.2em] text-[#bd7184] sm:mb-7">um cantinho só nosso</p> */}
        <h1 id="welcome-title" className="mx-auto max-w-180 font-serif text-[clamp(3rem,8vw,6.7rem)] font-normal mb-8.5 leading-[.98] tracking-[-.06em] text-[#965365]">
          {mainMessage}
          <span className="text-[#bd7184]" aria-hidden="true">.</span>
        </h1>
        {/* <p className="my-7 mb-8.5 text-[.96rem] text-[#88777c] sm:my-7 sm:mb-8.5">
          Tudo pronto para a gente se encontrar?
        </p> */}

        <button
          className="inline-flex min-w-55.5 cursor-pointer items-center justify-between gap-8 rounded-full border border-[#bd7184] bg-[#bd7184] px-5.25 py-3.75 text-[.82rem] tracking-[.03em] text-[#fffaf9] transition duration-220 ease-in-out hover:-translate-y-1 hover:bg-transparent hover:text-[#965365] focus-visible:outline-2 focus-visible:outline-[#965365] focus-visible:outline-offset-4 disabled:cursor-wait sm:max-w-67.5 sm:w-full"
          type="button"
          onClick={handleNextCall}
          disabled={isOpening}
        >
          <span>Ver a próxima call</span>
          <span className={isOpening ? 'animate-[arrow-pulse_.7s_ease-in-out_infinite] text-[1.15rem] leading-none' : 'text-[1.15rem] leading-none'} aria-hidden="true">↗</span>
        </button>

        <div className="mt-6.5 flex items-center justify-center gap-3 text-[.68rem] uppercase tracking-[.16em] text-[#a8979b]" aria-live="polite">
          <span className="h-px w-6 bg-[#e8dfe0]" aria-hidden="true" />
          <span>{subtitle}</span>
          <span className="h-px w-6 bg-[#e8dfe0]" aria-hidden="true" />
        </div>
      </section>

      {/* <footer className="flex animate-[appear_.8s_.35s_ease_both] items-center justify-center gap-[9px] text-[.72rem] uppercase tracking-[.16em] text-[#88777c]">
        <span>feito com carinho</span>
        <span className="text-base text-[#bd7184]" aria-hidden="true">·</span>
        <span>2026</span>
      </footer> */}
    </main>
  )
}

export default App
