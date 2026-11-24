import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Eye, Heart, Maximize2, Monitor, PanelLeft, PanelRight, Redo2, Save, Settings2, Smartphone, Undo2, WandSparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { loadPlanningRecord, savePlanning } from './data/planning'
import { toCard, updateLibrary } from './data/callLibrary'
import { cloneBlock, createBlock, newId, normalizePlanning } from './data/blocks'
import { DESIGN, autoArrange, contentBottom, ensureFrames, sizeFor, withFrame } from './data/canvasLayout'
import { legacyShape, variants } from './data/visuals'
import { measureLayout } from './editor/measureLayout'
import CanvasEditor from './editor/CanvasEditor'
import MultiInspector from './editor/MultiInspector'
import { templates } from './data/templates'
import { validLink } from './utils/url'
import { PlanningCanvas } from './Planning'
import CallPreview from './components/CallPreview'
import { startUserTest, useAccess } from './lib/access'
import { blockLabels } from './editor/blockMeta'
import BlockInspector from './editor/BlockInspector'
import PageInspector from './editor/PageInspector'
import Library from './editor/Library'
import QuickBar from './editor/QuickBar'
import { focusInlineAt } from './components/inlineEdit'
import { useBuilderDrag } from './editor/useBuilderDrag'
import { useHistory } from './editor/useHistory'

const draftKey = 'rebecca-planning-draft-v2'
const withEventId = planning => (planning.eventId ? planning : { ...planning, eventId: newId() })
const isTyping = target => target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
const timeLabel = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }

function validate(planning) {
  if (planning.hasPlannedCall === false) return null
  if (!planning.title.trim() || !planning.date || !Number.isFinite(new Date(planning.date).getTime())) return { message: 'Preencha o nome e a data do encontro em “Página → O encontro”.', page: true }
  for (const block of planning.blocks) {
    const p = block.props || {}
    const where = `${blockLabels[block.type]}: `
    if (block.type === 'button' && p.url && !validLink(p.url)) return { id: block.id, message: `${where}use um endereço começando com https:// ou http://.` }
    if (block.type === 'button' && p.url && !p.label?.trim()) return { id: block.id, message: `${where}escreva o texto do botão.` }
    if (block.type === 'image' && p.url && !validLink(p.url)) return { id: block.id, message: `${where}o endereço da imagem precisa começar com https://.` }
    if (['rsvp', 'poll', 'quiz'].includes(block.type) && (!p.options?.length || p.options.some(option => !option.label.trim()))) return { id: block.id, message: `${where}preencha o texto de todas as opções (e tenha pelo menos uma).` }
    if (block.type === 'quiz' && !p.options?.some(option => option.id === p.correctId)) return { id: block.id, message: `${where}escolha a resposta certa.` }
    if (block.type === 'checklist' && p.items?.some(item => !item.name.trim())) return { id: block.id, message: `${where}dê um nome a cada item.` }
    if (block.type === 'reveal' && p.mode === 'code' && !p.code?.trim()) return { id: block.id, message: `${where}defina a senha.` }
    if (block.type === 'reveal' && p.mode === 'date' && !Number.isFinite(new Date(p.unlockAt).getTime())) return { id: block.id, message: `${where}defina a data em que abre.` }
    if (block.type === 'activities' && p.items?.some(item => !item.name.trim())) return { id: block.id, message: `${where}dê um nome a cada atividade.` }
    if (block.type === 'links' && p.items?.some(item => !item.name.trim() || (item.url && !validLink(item.url)))) return { id: block.id, message: `${where}preencha o nome de cada link e use https:// ou http://.` }
  }
  return null
}

function Admin() {
  const navigate = useNavigate()
  const { admin: authenticated, testing } = useAccess()
  const history = useHistory(null)
  const { present: planning, commit } = history
  const [baseline, setBaseline] = useState(null)
  const [meta, setMeta] = useState({ updatedAt: null, revision: 0 })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [retry, setRetry] = useState(0)
  const [selection, setSelection] = useState([])
  const selectedId = selection.length === 1 ? selection[0] : null
  const setSelectedId = useCallback(value => setSelection(prev => {
    const current = prev.length === 1 ? prev[0] : null
    const next = typeof value === 'function' ? value(current) : value
    return next ? [next] : []
  }), [])
  const [busy, setBusy] = useState('')
  const [hidden, setHidden] = useState({ library: false, inspector: false })
  const canvasApiRef = useRef(null)
  const [device, setDevice] = useState('desktop')
  const [animate, setAnimate] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [previewMode, setPreviewMode] = useState(null)
  const [draft, setDraft] = useState(null)
  const [draftStored, setDraftStored] = useState(false)
  const [notice, setNotice] = useState('')
  const surfaceRef = useRef(null)
  const saveTimer = useRef(null)
  const replayTimer = useRef(null)
  const dirty = baseline !== null && planning !== null && JSON.stringify(planning) !== JSON.stringify(baseline)

  /* ---------- carregar ---------- */
  useEffect(() => {
    if (!authenticated) { navigate(testing ? '/' : '/autenticacao', { replace: true }); return }
    let active = true
    loadPlanningRecord().then(({ planning: loaded, updatedAt }) => {
      if (!active) return
      const value = withEventId(loaded)
      history.reset(value); setBaseline(structuredClone(value)); setMeta({ updatedAt, revision: Number(value.revision) || 0 }); setStatus('ready')
      try { const cached = JSON.parse(localStorage.getItem(draftKey)); if (cached && JSON.stringify(normalizePlanning(cached)) !== JSON.stringify(value)) setDraft(cached) } catch { localStorage.removeItem(draftKey) }
    }).catch(err => { if (active) { setError(err.message || 'Não foi possível carregar a call.'); setStatus('error') } })
    return () => { active = false; window.clearTimeout(saveTimer.current); window.clearTimeout(replayTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, testing, navigate, retry])

  /* ---------- rascunho local e aviso ao sair ---------- */
  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(planning)); setDraftStored(true) } catch { setError('O armazenamento de rascunho está cheio. Publique as alterações para não perdê-las.') }
    }, 500)
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => { window.clearTimeout(timer); window.removeEventListener('beforeunload', warn) }
  }, [planning, dirty])

  /* ---------- edição ---------- */
  const setPage = useCallback((key, value) => { setDraftStored(false); commit(p => ({ ...p, [key]: value }), `page:${key}`) }, [commit])
  const patchPage = useCallback(values => { setDraftStored(false); commit(p => ({ ...p, ...values })) }, [commit])
  const mapBlock = useCallback((id, fn, key) => { setDraftStored(false); commit(p => ({ ...p, blocks: p.blocks.map(b => b.id === id ? fn(b) : b) }), key) }, [commit])

  const api = useMemo(() => ({
    setProps: (id, patch) => mapBlock(id, b => ({ ...b, props: { ...b.props, ...patch } }), `props:${id}:${Object.keys(patch).join(',')}`),
    setStyle: (id, patch) => mapBlock(id, b => ({ ...b, style: { ...b.style, ...patch } }), `style:${id}:${Object.keys(patch).join(',')}`),
    setSpan: (id, span) => mapBlock(id, b => (b.span === span ? b : { ...b, span }), `span:${id}`),
    duplicate: id => {
      const copy = { current: null }
      setDraftStored(false)
      commit(p => {
        const index = p.blocks.findIndex(b => b.id === id)
        if (index < 0) return p
        copy.current = cloneBlock(p.blocks[index])
        return { ...p, blocks: [...p.blocks.slice(0, index + 1), copy.current, ...p.blocks.slice(index + 1)] }
      })
      if (copy.current) setSelectedId(copy.current.id)
    },
    remove: id => { setDraftStored(false); commit(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) })); setSelectedId(current => current === id ? null : current) },
    move: (id, toIndex) => { setDraftStored(false); commit(p => { const from = p.blocks.findIndex(b => b.id === id); if (from < 0 || from === toIndex) return p; const next = [...p.blocks]; const [item] = next.splice(from, 1); next.splice(toIndex, 0, item); return { ...p, blocks: next } }) },
    moveBy: (id, delta) => { setDraftStored(false); commit(p => { const from = p.blocks.findIndex(b => b.id === id); const to = from + delta; if (from < 0 || to < 0 || to >= p.blocks.length) return p; const next = [...p.blocks]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return { ...p, blocks: next } }) },
    // ----- canvas livre -----
    setFrames: (map, dev, key = 'frame') => {
      setDraftStored(false)
      commit(p => {
        const width = Number(p.canvas?.[dev]?.width) || DESIGN[dev].width
        const ensured = ensureFrames(p.blocks, dev, width)
        return { ...p, blocks: ensured.map(b => (map[b.id] ? withFrame(b, dev, map[b.id]) : b)) }
      }, `frame:${key}:${Object.keys(map).join(',')}`)
    },
    insertAt: (type, point, dev = 'desktop') => {
      const block = createBlock(type)
      const size = sizeFor(type)
      setDraftStored(false)
      commit(p => {
        const width = Number(p.canvas?.[dev]?.width) || DESIGN[dev].width
        const w = Math.min(size.w, width - 40)
        const x = point ? point.x - w / 2 : (width - w) / 2
        const y = point ? point.y - 24 : contentBottom(p.blocks, dev) + 40
        const frame = { x: Math.round(Math.max(0, Math.min(x, width - w))), y: Math.round(Math.max(0, y)), w, ...(size.h ? { h: size.h } : {}) }
        return { ...p, blocks: [...p.blocks, withFrame(block, dev, frame)] }
      })
      setSelection([block.id])
    },
    removeMany: ids => { setDraftStored(false); commit(p => ({ ...p, blocks: p.blocks.filter(b => !ids.includes(b.id)) })); setSelection([]) },
    duplicateMany: ids => {
      const created = []
      setDraftStored(false)
      commit(p => {
        const extra = p.blocks.filter(b => ids.includes(b.id)).map(b => { const c = cloneBlock(b); created.push(c.id); return c })
        return { ...p, blocks: [...p.blocks, ...extra] }
      })
      setSelection(created)
    },
    zOrder: (ids, op) => {
      setDraftStored(false)
      commit(p => {
        const picked = p.blocks.filter(b => ids.includes(b.id))
        const rest = p.blocks.filter(b => !ids.includes(b.id))
        if (op === 'front') return { ...p, blocks: [...rest, ...picked] }
        if (op === 'back') return { ...p, blocks: [...picked, ...rest] }
        const next = [...p.blocks]
        const order = op === 'forward' ? [...next.keys()].reverse() : [...next.keys()]
        for (const i of order) {
          const j = op === 'forward' ? i + 1 : i - 1
          if (ids.includes(next[i].id) && next[j] && !ids.includes(next[j].id)) [next[i], next[j]] = [next[j], next[i]]
        }
        return { ...p, blocks: next }
      })
    },
    insert: (type, index) => {
      const block = createBlock(type)
      setDraftStored(false)
      commit(p => {
        const at = index ?? (selectedId ? p.blocks.findIndex(b => b.id === selectedId) + 1 || p.blocks.length : p.blocks.length)
        return { ...p, blocks: [...p.blocks.slice(0, at), block, ...p.blocks.slice(at)] }
      })
      setSelectedId(block.id)
    },
  }), [commit, mapBlock, selectedId, setSelectedId])

  const canvasMode = planning?.layoutMode === 'canvas'
  const canvasWidth = Number(planning?.canvas?.desktop?.width) || DESIGN.desktop.width

  const applyTemplate = key => {
    const template = templates[key]
    setDraftStored(false)
    commit(p => {
      const blocks = template.build()
      return { ...p, ...template.page, blocks: p.layoutMode === 'canvas' ? autoArrange(blocks, Number(p.canvas?.desktop?.width) || DESIGN.desktop.width) : blocks }
    })
    setSelection([])
  }

  // Converte a grade em canvas medindo onde cada bloco aparece de verdade (sem mudar a aparência).
  const switchToCanvas = async () => {
    if (busy) return
    setBusy('Convertendo para o canvas…'); setError('')
    try {
      const firstTime = !planning.blocks.some(b => b.frame?.desktop)
      let blocks = planning.blocks
      let canvas = planning.canvas
      if (blocks.some(b => !b.frame?.desktop)) {
        const m = await measureLayout(planning, canvasWidth, { forceGrid: true })
        const dy = 40
        blocks = blocks.map(b => {
          const r = m.frames[b.id]
          if (b.frame?.desktop || !r) return b
          const fixed = ['image', 'shape', 'spacer'].includes(b.type)
          return withFrame(b, 'desktop', { x: Math.round(r.x + (b.style?.offsetX || 0)), y: Math.round(r.y + dy + (b.style?.offsetY || 0)), w: Math.round(r.w), ...(fixed ? { h: Math.round(r.h) } : {}), ...(b.style?.rotate ? { rot: b.style.rotate } : {}) })
        })
        if (firstTime && planning.panelEnabled && m.panel) {
          const panel = createBlock('shape')
          const custom = planning.style === 'custom'
          panel.style = {
            variant: planning.style || 'minimal', shape: planning.panelShape === 'custom' ? 'custom' : legacyShape[planning.panelShape] || planning.panelShape || 'rounded', radius: planning.panelRadius, padding: 0,
            ...(planning.panelShadow && planning.panelShadow !== 'theme' ? { shadow: planning.panelShadow } : {}),
            ...(planning.panelBorderWidth !== 1 || planning.panelBorderStyle !== 'solid' ? { borderWidth: planning.panelBorderWidth, borderStyle: planning.panelBorderStyle } : {}),
            ...(custom ? { bg: planning.panelColor, bgOpacity: planning.panelOpacity } : {}),
          }
          panel.frame = { desktop: { x: Math.round(m.panel.x), y: Math.round(m.panel.y + dy), w: Math.round(m.panel.w), h: Math.round(m.panel.h) } }
          const panelColor = variants[planning.style]?.css?.color
          blocks = [panel, ...blocks.map(b => (panelColor && b.type !== 'shape' && !b.style?.color ? { ...b, style: { ...b.style, color: panelColor } } : b))]
        }
        canvas = { ...canvas, desktop: { ...canvas.desktop, minHeight: Math.max(canvas.desktop.minHeight || 0, Math.ceil(m.height + dy + 80)) } }
      }
      setDraftStored(false)
      commit(p => ({ ...p, layoutMode: 'canvas', blocks, canvas }))
      setSelection([]); setDevice('desktop')
    } catch (err) {
      console.error(err)
      setError('Não consegui converter automaticamente. Tente de novo ou use “Organizar em linhas”.')
    } finally { setBusy('') }
  }
  const switchToGrid = () => { setDraftStored(false); commit(p => ({ ...p, layoutMode: 'grid' })); setSelection([]) }

  // Gera posições próprias para o celular, a partir de como a coluna única aparece hoje.
  const customizeMobile = async () => {
    if (busy) return
    setBusy('Preparando o layout do celular…'); setError('')
    try {
      const mobileWidth = Number(planning.canvas.mobile.width) || DESIGN.mobile.width
      const m = await measureLayout({ ...planning, layoutMode: 'canvas', canvas: { ...planning.canvas, mobile: { ...planning.canvas.mobile, custom: false } } }, mobileWidth)
      const blocks = planning.blocks.map(b => {
        const r = m.frames[b.id]
        if (!r) return b
        const fixed = ['image', 'shape', 'spacer'].includes(b.type)
        return withFrame(b, 'mobile', { x: Math.round(r.x), y: Math.round(r.y + 24), w: Math.round(r.w), ...(fixed ? { h: Math.round(r.h) } : {}) })
      })
      setDraftStored(false)
      commit(p => ({ ...p, blocks, canvas: { ...p.canvas, mobile: { ...p.canvas.mobile, custom: true } } }))
    } catch (err) { console.error(err); setError('Não consegui preparar o layout do celular.') } finally { setBusy('') }
  }
  const setMobileCustom = enabled => { if (enabled) customizeMobile(); else { setDraftStored(false); commit(p => ({ ...p, canvas: { ...p.canvas, mobile: { ...p.canvas.mobile, custom: false } } })); setDevice('desktop') } }
  const arrangeAll = () => { setDraftStored(false); commit(p => ({ ...p, blocks: autoArrange(p.blocks, Number(p.canvas?.desktop?.width) || DESIGN.desktop.width) })) }
  const fitHeight = () => {
    const el = canvasApiRef.current?.stage()?.querySelector('[data-canvas-page]')
    const bottom = el ? [...el.querySelectorAll('[data-canvas-block]')].reduce((max, b) => Math.max(max, b.offsetTop + b.offsetHeight), 0) : contentBottom(planning.blocks, 'desktop')
    setDraftStored(false)
    commit(p => ({ ...p, canvas: { ...p.canvas, desktop: { ...p.canvas.desktop, minHeight: Math.max(400, Math.ceil(bottom + 60)) } } }))
  }
  const insertBlock = (type, index) => (canvasMode ? api.insertAt(type, null, device) : api.insert(type, index))

  const editText = useCallback(slot => {
    const el = typeof slot === 'string' ? document.querySelector(`[data-block-id="${CSS.escape(slot)}"]`) : slot
    if (!el) return
    const r = el.getBoundingClientRect()
    focusInlineAt(el, r.left + r.width / 2, r.top + r.height / 2)
  }, [])

  const { drag, indicator, resizing, startDrag, startResize, startBody, startRotate, startHeight } = useBuilderDrag({
    surfaceRef, canvasApiRef: canvasMode ? canvasApiRef : null, blocks: planning?.blocks ?? [], selectedId, onMove: api.move, onInsert: insertBlock,
    onInsertAt: (type, point) => api.insertAt(type, point, device), onResize: api.setSpan,
    onStyle: api.setStyle, onSelect: setSelectedId, onEditAt: (slot, x, y) => { if (!focusInlineAt(slot, x, y)) slot.focus() },
  })

  /* ---------- salvar ---------- */
  const save = async ({ force = false } = {}) => {
    if (status === 'saving' || !baseline || !planning) return
    const problem = validate(planning)
    if (problem) { setSelectedId(problem.page ? null : problem.id); setError(problem.message); return }
    window.clearTimeout(saveTimer.current)
    setStatus('saving'); setError(''); setConflict(false)
    const snapshot = structuredClone(planning)
    const config = { ...snapshot, revision: meta.revision + 1 }
    try {
      const updatedAt = await savePlanning(config, { expectedUpdatedAt: meta.updatedAt, force })
      setBaseline(snapshot); setMeta({ updatedAt, revision: config.revision }); setStatus('saved'); setDraft(null); localStorage.removeItem(draftKey)
      saveTimer.current = window.setTimeout(() => setStatus('ready'), 3000)
    } catch (err) {
      setStatus('ready')
      if (err.code === 'CONFLICT') setConflict(true)
      else setError('Não foi possível publicar. Seu rascunho foi mantido; tente novamente.')
    }
  }
  const saveRef = useRef(save)
  useEffect(() => { saveRef.current = save })

  /* ---------- atalhos ---------- */
  useEffect(() => {
    const onKey = event => {
      const mod = event.ctrlKey || event.metaKey
      // canvas livre: setas, Delete e Esc agem nos blocos selecionados (quando não há campo em foco)
      if (!mod && canvasMode && selection.length && !isTyping(event.target) && !['SELECT', 'BUTTON'].includes(event.target.tagName)) {
        const step = event.shiftKey ? 10 : 1
        const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
        if (arrows[event.key]) {
          event.preventDefault()
          const rects = ensureFrames(planning.blocks, device, Number(planning.canvas[device].width) || DESIGN[device].width)
          api.setFrames(Object.fromEntries(rects.filter(b => selection.includes(b.id)).map(b => [b.id, { x: b.frame[device].x + arrows[event.key][0], y: b.frame[device].y + arrows[event.key][1] }])), device, 'nudge')
          return
        }
        if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); api.removeMany(selection); return }
        if (event.key === 'Escape') { setSelection([]); return }
      }
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 's') { event.preventDefault(); saveRef.current() }
      else if (isTyping(event.target)) return
      else if (key === 'z') { event.preventDefault(); event.shiftKey ? history.redo() : history.undo() }
      else if (key === 'y') { event.preventDefault(); history.redo() }
      else if (key === 'd' && canvasMode && selection.length) { event.preventDefault(); api.duplicateMany(selection) }
      else if (key === 'd' && selectedId) { event.preventDefault(); api.duplicate(selectedId) }
      else if (key === 'a' && canvasMode) { event.preventDefault(); setSelection(planning.blocks.map(b => b.id)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history, selectedId, selection, api, canvasMode, planning, device])

  /* ---------- cards guardados ---------- */
  const planningRef = useRef(null)
  useEffect(() => { planningRef.current = planning })

  const openCard = (loaded, card) => {
    if (dirty && !window.confirm('Abrir o card substitui o que está no editor (dá para desfazer com Ctrl+Z). Continuar?')) return
    setDraftStored(false); commit(() => loaded); setSelection([]); setError('')
    setNotice(`“${card.name}” aberto no editor. Publique para colocá-lo no ar.`)
  }
  const activateCard = async (loaded, card) => {
    if (status === 'saving' || !baseline) return
    const problem = validate(loaded)
    if (problem) { setError(`O card “${card.name}” não pode ir ao ar: ${problem.message.replace('“Página → O encontro”', 'o editor')}`); return }
    const warning = dirty ? '\n\nAs alterações não publicadas que estão no editor serão descartadas.' : ''
    if (!window.confirm(`Ativar “${card.name}”? Ela passa a ser a call que ela vê agora. A call atual fica guardada na aba Salvos.${warning}`)) return
    window.clearTimeout(saveTimer.current)
    setStatus('saving'); setError(''); setNotice(''); setConflict(false)
    const config = { ...loaded, revision: meta.revision + 1 }
    try {
      // guarda a call que está no ar antes de trocá-la
      const live = baseline
      if (live.hasPlannedCall !== false || live.blocks.length) {
        await updateLibrary(list => [toCard(live, `Anterior · ${live.title || 'sem nome'}`), ...list]).catch(err => { console.error(err); throw Object.assign(new Error('archive'), { code: 'ARCHIVE' }) })
      }
      const updatedAt = await savePlanning(config, { expectedUpdatedAt: meta.updatedAt })
      history.reset(config); setBaseline(structuredClone(config)); setMeta({ updatedAt, revision: config.revision }); setSelection([]); setDraft(null); localStorage.removeItem(draftKey); setDraftStored(false)
      setStatus('saved'); setNotice(`“${card.name}” está no ar.`)
      saveTimer.current = window.setTimeout(() => setStatus('ready'), 3000)
    } catch (err) {
      setStatus('ready')
      if (err.code === 'CONFLICT') setConflict(true)
      else if (err.code === 'ARCHIVE') setError('Não consegui guardar a call atual antes de trocar, então nada foi alterado. Tente de novo.')
      else setError('Não foi possível ativar o card. Nada foi alterado; tente novamente.')
    }
  }

  const leave = destination => { if (!dirty || window.confirm('Você tem alterações não publicadas. Sair do editor?')) navigate(destination) }
  const testAsUser = () => {
    if (dirty) { try { localStorage.setItem(draftKey, JSON.stringify(planning)) } catch { setError('Não foi possível guardar seu rascunho. Publique as alterações antes de iniciar o teste.'); return } }
    startUserTest()
    navigate('/')
  }
  const replay = () => { setAnimate(true); setReplayKey(value => value + 1); window.clearTimeout(replayTimer.current); replayTimer.current = window.setTimeout(() => setAnimate(false), 6000) }

  if (!authenticated) return null
  const selected = planning?.blocks.find(block => block.id === selectedId) || null
  const editing = {
    selectedId, draggingId: drag?.kind === 'move' ? drag.id : null, animate,
    onSelect: setSelectedId,
    onHandleDown: (event, id) => { setSelectedId(id); startDrag(event, { kind: 'move', id, label: blockLabels[planning.blocks.find(b => b.id === id)?.type] }) },
    onResizeDown: (event, id) => { setSelectedId(id); startResize(event, id) },
    onMoveBy: api.moveBy, onDuplicate: api.duplicate, onRemove: api.remove,
    onBodyDown: startBody, onRotateDown: (event, id) => { setSelectedId(id); startRotate(event, id) }, onHeightDown: (event, id) => { setSelectedId(id); startHeight(event, id) },
    onStyle: api.setStyle, onProps: api.setProps, onEditText: editText,
    onNudge: (id, dx, dy) => { const b = planning.blocks.find(x => x.id === id); api.setStyle(id, { offsetX: (b.style.offsetX || 0) + dx, offsetY: (b.style.offsetY || 0) + dy }) },
  }
  const statusText = status === 'loading' ? 'Carregando sua call…' : status === 'error' ? 'Não foi possível carregar a call' : status === 'saving' ? 'Publicando…'
    : dirty ? `Alterações não publicadas${draftStored ? ' · rascunho guardado só neste navegador' : ''}`
      : status === 'saved' ? 'Publicado agora. Já está disponível para ela.' : meta.updatedAt ? `Publicado às ${timeLabel(meta.updatedAt)}` : 'Ainda não publicada'

  return <main className="studio-shell builder-shell">
    <header className="studio-header">
      <button type="button" className="text-button" onClick={() => leave('/')}><ArrowLeft size={16} />Voltar</button>
      <span className="studio-brand"><Heart size={16} fill="currentColor" />rebeca <span>/</span> editor de call</span>
      <div className="studio-header-actions">
        <button type="button" className="secondary-button" disabled={!planning} onClick={testAsUser}><Eye size={15} />Ver como ela</button>
        <button type="button" className="studio-save" disabled={!dirty || status === 'saving'} onClick={() => save()}><Save size={16} />{status === 'saving' ? 'Publicando…' : 'Publicar'}</button>
      </div>
    </header>
    <div className="builder-status">
      <div className="studio-status" role="status"><span className={dirty ? 'status-dot unsaved' : 'status-dot'} />{statusText}</div>
      {error && <div className="studio-notice" role="alert">{error}{status === 'error' && <button type="button" onClick={() => { setStatus('loading'); setError(''); setRetry(value => value + 1) }}>Tentar novamente</button>}</div>}
      {notice && !error && <div className="studio-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>Ok</button></div>}
      {conflict && <div className="studio-notice" role="alert">Essa call foi alterada em outro lugar (outra aba ou aparelho) depois que você abriu o editor.
        <button type="button" onClick={() => { setConflict(false); setStatus('loading'); setRetry(value => value + 1) }}>Carregar a versão nova</button>
        <button type="button" onClick={() => save({ force: true })}>Publicar a minha mesmo assim</button></div>}
      {draft && <div className="studio-notice">Há um rascunho guardado neste navegador.
        <button type="button" onClick={() => { commit(normalizePlanning(draft)); setDraft(null) }}>Recuperar rascunho</button>
        <button type="button" onClick={() => { localStorage.removeItem(draftKey); setDraft(null) }}>Descartar</button></div>}
    </div>
    {planning && <div className={`builder ${hidden.library ? 'hide-library' : ''} ${hidden.inspector ? 'hide-inspector' : ''}`}>
      <aside className="builder-library" aria-label="Biblioteca de blocos">
        <Library blocks={planning.blocks} selectedId={selectedId} onSelect={setSelectedId} onInsert={insertBlock} onMoveBy={canvasMode ? (id, delta) => api.zOrder([id], delta < 0 ? 'backward' : 'forward') : api.moveBy} onTemplate={applyTemplate} cards={{ current: () => planningRef.current, onOpen: openCard, onActivate: activateCard }}
          onPaletteDown={(event, type) => startDrag(event, { kind: 'new', type, label: blockLabels[type] })} />
      </aside>
      <section className="builder-stage" aria-label="Palco">
        <div className="stage-toolbar">
          <div className="stage-tools">
            <button type="button" aria-label="Desfazer" title="Desfazer (Ctrl+Z)" disabled={!history.canUndo} onClick={history.undo}><Undo2 size={16} /></button>
            <button type="button" aria-label="Refazer" title="Refazer (Ctrl+Shift+Z)" disabled={!history.canRedo} onClick={history.redo}><Redo2 size={16} /></button>
            <button type="button" className={!selected ? 'active' : ''} onClick={() => setSelectedId(null)}><Settings2 size={15} />Página</button>
            <button type="button" onClick={replay}><WandSparkles size={15} />Reproduzir animações</button>
            <div className="mode-switch" role="group" aria-label="Modo de edição">
              <button type="button" aria-pressed={!canvasMode} onClick={switchToGrid}>Grade</button>
              <button type="button" aria-pressed={canvasMode} disabled={Boolean(busy)} onClick={canvasMode ? undefined : switchToCanvas}>Canvas livre</button>
            </div>
          </div>
          <div className="stage-tools">
            <div className="device-switch">
              <button type="button" aria-label="Palco em tamanho de computador" aria-pressed={device === 'desktop'} className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={16} /></button>
              <button type="button" aria-label="Palco em tamanho de celular" aria-pressed={device === 'mobile'} className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={16} /></button>
            </div>
            <button type="button" aria-pressed={!hidden.library} onClick={() => setHidden(h => ({ ...h, library: !h.library }))}><PanelLeft size={15} />Blocos</button>
            <button type="button" aria-pressed={!hidden.inspector} onClick={() => setHidden(h => ({ ...h, inspector: !h.inspector }))}><PanelRight size={15} />Propriedades</button>
            <button type="button" onClick={() => setPreviewMode('page')}><Maximize2 size={15} />Tela cheia</button>
          </div>
        </div>
        {busy && <p className="canvas-banner" role="status">{busy}</p>}
        {!canvasMode && !busy && <div className="canvas-banner">
          <span><strong>Novo: canvas livre.</strong> Posicione, redimensione e gire qualquer bloco como no Canva, com o resultado grande na tela. Sua call é convertida sem mudar a aparência — dá para voltar à grade quando quiser.</span>
          <button type="button" className="secondary-button" onClick={switchToCanvas}>Usar canvas livre</button>
        </div>}
        {canvasMode && device === 'mobile' && !planning.canvas.mobile.custom && <div className="canvas-banner">
          <span>No celular, os blocos aparecem em coluna, na ordem em que estão no computador. Quer posicionar cada um à mão?</span>
          <button type="button" className="secondary-button" disabled={Boolean(busy)} onClick={customizeMobile}>Personalizar o celular</button>
        </div>}
        {canvasMode && !(device === 'mobile' && !planning.canvas.mobile.custom)
          ? <CanvasEditor key={`${replayKey}:${device}`} planning={planning} device={device} selection={selection} setSelection={setSelection} api={api} animate={animate} canvasApiRef={canvasApiRef} onGesture={{ editAt: (id, x, y) => { const el = document.querySelector(`[data-block-id="${CSS.escape(id)}"]`); if (el) focusInlineAt(el, x, y) } }} />
          : <div className={`stage-surface ${device} ${drag ? 'is-dragging' : ''} ${resizing ? 'is-resizing' : ''}`} ref={surfaceRef}>
            <PlanningCanvas key={replayKey} planning={planning} editing={canvasMode ? null : editing} ignorePast />
          </div>}
        <p className="stage-help">{canvasMode
          ? 'Clique para selecionar (Shift soma) · arraste para mover · alças nos cantos e lados redimensionam · bolinha de cima gira · clique de novo ou duplo clique no texto para digitar · setas empurram 1 px (Shift 10) · Alt solta o ímã · Ctrl + roda dá zoom.'
          : 'Clique num bloco para selecionar e de novo no texto para digitar · arraste o bloco para posicioná-lo livremente · alça superior: trocar a ordem · borda direita: largura · círculo: girar · setas movem, Alt + setas reordenam.'}</p>
      </section>
      <aside className="builder-inspector" aria-label="Propriedades">
        {selection.length > 1
          ? <MultiInspector blocks={planning.blocks} selection={selection} api={api} onSelect={setSelectedId} />
          : selected
            ? <BlockInspector block={selected} api={api} pageEnabled={planning.animationEnabled} onError={setError} callKey={planning.eventId || 'main'} canvas={canvasMode ? device : null} />
            : <PageInspector planning={planning} set={setPage} patch={patchPage} onError={setError} onReplay={replay} onSplash={() => setPreviewMode('splash')} canvasActions={{ arrange: arrangeAll, fitHeight, setMobileCustom, toGrid: switchToGrid }} />}
      </aside>
    </div>}
    {selected && !drag && <QuickBar key={selected.id} block={selected} api={api} onEditText={editText} canvas={canvasMode} />}
    {drag && <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>{drag.label}</div>}
    {indicator && (indicator.ghost ? <div className="drop-ghost" style={{ left: indicator.left, top: indicator.top, width: indicator.width, height: indicator.height }} /> : <div className="drop-indicator" style={indicator} />)}
    {previewMode && planning && <CallPreview planning={planning} splash={previewMode === 'splash'} onClose={() => setPreviewMode(null)} />}
  </main>
}
export default Admin
