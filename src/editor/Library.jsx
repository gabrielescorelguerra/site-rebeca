import { useState } from 'react'
import { ArrowDown, ArrowUp, LayoutTemplate } from 'lucide-react'
import { blockLabels, blockMeta } from './blockMeta'
import { templateOptions } from '../data/templates'

function preview(block) {
  const p = block.props || {}
  return p.text || p.title || p.label || p.name || p.url || ''
}

export default function Library({ blocks, selectedId, onSelect, onPaletteDown, onInsert, onMoveBy, onTemplate }) {
  const [tab, setTab] = useState('add')
  return <div className="library">
    <div className="inspector-tabs" role="tablist" aria-label="Biblioteca">
      {[['add', 'Blocos'], ['layers', `Camadas (${blocks.length})`], ['templates', 'Modelos']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} type="button" onClick={() => setTab(key)}>{label}</button>)}
    </div>
    {tab === 'add' && <>
      <p className="section-help">Arraste um bloco para o palco ou clique para adicionar.</p>
      <div className="palette">
        {blockMeta.map(({ type, icon: Icon, hint }) => <button
          key={type} type="button" className="palette-item"
          onPointerDown={event => onPaletteDown(event, type)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onInsert(type, null) } }}
        ><Icon size={18} aria-hidden="true" /><strong>{blockLabels[type]}</strong><small>{hint}</small></button>)}
      </div>
    </>}
    {tab === 'layers' && <ol className="layers">
      {blocks.map((block, index) => <li key={block.id} className={selectedId === block.id ? 'active' : ''}>
        <button type="button" className="layer-main" onClick={() => onSelect(block.id)}><strong>{blockLabels[block.type]}</strong><span>{preview(block)}</span></button>
        <button type="button" aria-label="Mover para cima" disabled={index === 0} onClick={() => onMoveBy(block.id, -1)}><ArrowUp size={13} /></button>
        <button type="button" aria-label="Mover para baixo" disabled={index === blocks.length - 1} onClick={() => onMoveBy(block.id, 1)}><ArrowDown size={13} /></button>
      </li>)}
      {!blocks.length && <li className="section-help">Nenhum bloco ainda.</li>}
    </ol>}
    {tab === 'templates' && <div className="templates">
      <p className="section-help">Um ponto de partida de layout. Substitui os blocos atuais — dá para desfazer com Ctrl+Z.</p>
      {templateOptions.map(([key, label, note]) => <button key={key} type="button" className="template-card" onClick={() => onTemplate(key)}><LayoutTemplate size={18} aria-hidden="true" /><strong>{label}</strong><small>{note}</small></button>)}
    </div>}
  </div>
}
