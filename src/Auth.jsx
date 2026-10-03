import { useEffect, useState } from 'react'
import { ArrowLeft, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { randomAffectionatePhrase } from './utils/random'
import { ADMIN_AUTHENTICATED_KEY, AUTHENTICATED_KEY } from './data/planning'

const NORMAL_NAME = 'rebeca pereira da silva'
const ADMIN_NAME = 'admin'
const AUTHORIZED_BIRTH_DATE = '2006-07-04'

function Auth() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTHENTICATED_KEY) === 'true'
      || localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true',
  )

  useEffect(() => {
    if (localStorage.getItem(ADMIN_AUTHENTICATED_KEY) === 'true') {
      navigate('/admin', { replace: true })
    } else if (isAuthenticated) {
      navigate('/planejamento', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = (event) => {
    event.preventDefault()

    const normalizedName = name.trim().toLowerCase()

    if (birthDate !== AUTHORIZED_BIRTH_DATE
      || (normalizedName !== NORMAL_NAME && normalizedName !== ADMIN_NAME)) {
      setError('Confira os dados e tente novamente.')
      return
    }

    const isAdmin = normalizedName === ADMIN_NAME
    localStorage.setItem(isAdmin ? ADMIN_AUTHENTICATED_KEY : AUTHENTICATED_KEY, 'true')
    setError('')
    setIsAuthenticated(true)
    navigate(isAdmin ? '/admin' : '/planejamento')
  }

  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#fbf8f6] px-6 py-6.5 text-[#31292d] sm:px-[6vw] sm:py-9.5">
      <div
        className="pointer-events-none absolute -right-28 -top-48 -z-10 size-88 animate-[drift_12s_ease-in-out_infinite_alternate] rounded-full border border-[#bd7184]/16 after:absolute after:inset-[18%] after:rounded-full after:border after:border-[#bd7184]/13"
        aria-hidden="true"
      />

      <header className="flex items-center justify-between text-[.72rem] uppercase tracking-[.16em] text-[#88777c]">
        <button
          className="inline-flex cursor-pointer items-center gap-2 text-[#88777c] transition-all duration-200 hover:-translate-x-1 hover:text-[#965365]"
          type="button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Voltar
        </button>
        <span className="flex items-center gap-2.5">
          <span className="font-semibold text-[#31292d]">rebeca</span>
          <Heart className="size-4 text-[#bd7184]" strokeWidth={1.8} fill="currentColor" aria-hidden="true" />
        </span>
      </header>

      <section className="m-auto w-full max-w-[460px] animate-[rise_1s_.1s_ease_both]">
        {isAuthenticated ? (
          <div className="text-center">
            <Heart className="mx-auto mb-6 size-10 text-[#bd7184]" strokeWidth={1.4} fill="currentColor" aria-hidden="true" />
            <h1 className="font-serif text-5xl font-normal tracking-[-.05em] text-[#965365]">
              Você já está dentro.
            </h1>
            <p className="mt-5 text-[.96rem] text-[#88777c]">
              A próxima call espera por você.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 text-center text-[.74rem] uppercase tracking-[.2em] text-[#bd7184]">
              {randomAffectionatePhrase()}
            </p>
            <h1 className="text-center font-serif text-5xl font-normal leading-[.98] tracking-[-.05em] text-[#965365]">
              Login
            </h1>
            <p className="mt-5 text-center text-[.96rem] text-[#88777c]">
              Para acessar, responda essas perguntas óbvias.
            </p>

            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-[.72rem] uppercase tracking-[.12em] text-[#88777c]">
                Nome da pessoa mais bonita do mundo
                <input
                  className="mt-2 w-full rounded-2xl border border-[#e8dfe0] bg-transparent px-4 py-3.5 text-[#31292d] outline-none transition-colors placeholder:text-[#b7a8ac] focus:border-[#bd7184]"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Digite o nome"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="block text-[.72rem] uppercase tracking-[.12em] text-[#88777c]">
                Data de nascimento dela
                <input
                  className="mt-2 w-full rounded-2xl border border-[#e8dfe0] bg-transparent px-4 py-3.5 text-[#31292d] outline-none transition-colors focus:border-[#bd7184]"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  required
                />
              </label>

              {error && <p className="text-center text-sm text-[#965365]" role="alert">{error}</p>}

              <button
                className="w-full cursor-pointer rounded-full border border-[#bd7184] bg-[#bd7184] px-5 py-3.75 text-[.82rem] tracking-[.03em] text-[#fffaf9] transition duration-220 hover:-translate-y-1 hover:bg-transparent hover:text-[#965365] focus-visible:outline-2 focus-visible:outline-[#965365] focus-visible:outline-offset-4"
                type="submit"
              >
                Ver próxima call
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

export default Auth
