import { Copy, Trash2 } from 'lucide-react'
import { blockLabels } from './blockMeta'

export default function MultiInspector({ blocks, selection, api, onSelect }) {
  const chosen = blocks.filter(block => selection.includes(block.id))
  return <div className="inspector">
    <div className="inspector-title"><h2>{chosen.length} selecionados</h2><p>Use as ferramentas acima do palco para alinhar e distribuir. Arraste para mover todos juntos.</p></div>
    <ul className="layers">
      {chosen.map(block => <li key={block.id}><button type="button" className="layer-main" onClick={() => onSelect(block.id)}><strong>{blockLabels[block.type]}</strong><span>{block.props?.text || block.props?.title || block.props?.label || ''}</span></button></li>)}
    </ul>
    <div className="inspector-footer">
      <button type="button" className="secondary-button" onClick={() => api.duplicateMany(selection)}><Copy size={15} />Duplicar</button>
      <button type="button" className="secondary-button danger" onClick={() => api.removeMany(selection)}><Trash2 size={15} />Excluir</button>
    </div>
  </div>
}
