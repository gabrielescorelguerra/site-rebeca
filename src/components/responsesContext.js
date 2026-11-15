import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { loadResponses, saveResponse } from '../data/responses'

export const ResponsesContext = createContext(null)

// Guarda as respostas da call. Com persist=true grava no Supabase; senão fica só na memória (prévia/teste).
export function useResponsesStore({ callKey, persist }) {
  const [values, setValues] = useState({})
  const [statuses, setStatuses] = useState({})
  const pending = useRef({})

  useEffect(() => {
    if (!persist) return
    let active = true
    loadResponses(callKey).then(rows => {
      if (active) setValues(Object.fromEntries(Object.entries(rows).map(([id, row]) => [id, row.value])))
    }).catch(() => { /* sem respostas anteriores ou tabela ausente: segue em branco */ })
    return () => { active = false }
  }, [callKey, persist])

  const save = useCallback(async (blockId, value) => {
    setValues(current => ({ ...current, [blockId]: value }))
    if (!persist) { setStatuses(current => ({ ...current, [blockId]: 'local' })); return }
    pending.current[blockId] = value
    setStatuses(current => ({ ...current, [blockId]: 'saving' }))
    try {
      await saveResponse(callKey, blockId, value)
      if (pending.current[blockId] === value) setStatuses(current => ({ ...current, [blockId]: 'saved' }))
    } catch {
      setStatuses(current => ({ ...current, [blockId]: 'error' }))
    }
  }, [callKey, persist])

  return { values, statuses, save, persist }
}

export function useBlockResponse(blockId) {
  const store = useContext(ResponsesContext)
  return {
    value: store?.values[blockId],
    status: store?.statuses[blockId],
    persist: Boolean(store?.persist),
    save: value => store?.save(blockId, value),
  }
}
