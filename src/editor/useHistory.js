import { useCallback, useRef, useState } from 'react'

// Estado com desfazer/refazer. Edições com a mesma chave em sequência curta viram um passo só.
export function useHistory(initial) {
  const [present, setPresent] = useState(initial)
  const ref = useRef(initial)
  const past = useRef([])
  const future = useRef([])
  const last = useRef({ key: null, time: 0 })
  const [flags, setFlags] = useState({ canUndo: false, canRedo: false })
  const sync = () => setFlags({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 })

  const commit = useCallback((updater, key = null) => {
    const current = ref.current
    const next = typeof updater === 'function' ? updater(current) : updater
    if (next === current) return
    const now = Date.now()
    if (!(key && last.current.key === key && now - last.current.time < 900)) {
      past.current.push(current)
      if (past.current.length > 80) past.current.shift()
    }
    last.current = { key, time: now }
    future.current = []
    ref.current = next
    setPresent(next)
    sync()
  }, [])

  const reset = useCallback(value => {
    past.current = []; future.current = []; last.current = { key: null, time: 0 }
    ref.current = value
    setPresent(value)
    sync()
  }, [])

  const undo = useCallback(() => {
    if (!past.current.length) return
    future.current.push(ref.current)
    ref.current = past.current.pop()
    last.current = { key: null, time: 0 }
    setPresent(ref.current)
    sync()
  }, [])

  const redo = useCallback(() => {
    if (!future.current.length) return
    past.current.push(ref.current)
    ref.current = future.current.pop()
    last.current = { key: null, time: 0 }
    setPresent(ref.current)
    sync()
  }, [])

  return { present, commit, reset, undo, redo, canUndo: flags.canUndo, canRedo: flags.canRedo }
}
