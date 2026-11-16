import { useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Eye, Trash2, Upload, WandSparkles } from 'lucide-react'
import { newId } from '../data/blocks'
import { themes } from '../data/themes'
import { uploadImage } from '../data/media'
import { backgroundMotionOptions, entranceOptions, fontOptions, hoverOptions, intensityOptions, legacyShape, loopOptions, panelShapeOptions, patternOptions, shadowOptions, speedOptions, variantOptions } from '../data/visuals'
import { iconOptions } from '../data/icons'
import { ColorField, Field, Range, SelectField, Segmented, TextField, Toggle } from './fields'

const motionPresets = {
  none: { animationEnabled: false },
  soft: { animationEnabled: true, blockEntrance: 'rise', panelEntrance: 'rise', panelLoop: 'none', animationSpeed: 'normal', animationIntensity: 'subtle' },
  playful: { animationEnabled: true, blockEntrance: 'bounce', panelEntrance: 'fade', panelLoop: 'none', animationSpeed: 'fast', animationIntensity: 'medium' },
  dramatic: { animationEnabled: true, blockEntrance: 'zoom', panelEntrance: 'fade', panelLoop: 'glow-soft', animationSpeed: 'relaxed', animationIntensity: 'high' },
  neon: { animationEnabled: true, blockEntrance: 'fade', panelEntrance: 'fade', panelLoop: 'glow-pulse', animationSpeed: 'normal', animationIntensity: 'medium' },
  game: { animationEnabled: true, blockEntrance: 'slide-left', panelEntrance: 'fade', panelLoop: 'none', animationSpeed: 'fast', animationIntensity: 'medium' },
  cinema: { animationEnabled: true, blockEntrance: 'fade', panelEntrance: 'fade', panelLoop: 'none', animationSpeed: 'slow', animationIntensity: 'subtle' },
  chaos: { animationEnabled: true, blockEntrance: 'glitch', panelEntrance: 'glitch', panelLoop: 'sway', animationSpeed: 'fast', animationIntensity: 'high' },
}
const presetOptions = [['soft', 'Suave'], ['playful', 'Divertida'], ['dramatic', 'Dramática'], ['neon', 'Neon pulsante'], ['game', 'Jogo'], ['cinema', 'Cinema'], ['chaos', 'Caos controlado'], ['none', 'Sem animação']]

const tabs = [['meeting', 'O encontro'], ['look', 'Aparência'], ['background', 'Fundo'], ['frame', 'Moldura'], ['motion', 'Movimento']]

function Meeting({ planning, set, patch }) {
  return <>
    <Toggle label="Call planejada" hint="Desligue para mostrar “Sem call planejada”. Seus blocos continuam salvos." checked={planning.hasPlannedCall !== false} onChange={value => set('hasPlannedCall', value)} />
    <Toggle label="Esconder depois que a call passar" hint="Duas horas após o fim, ela vê “nossa última call já aconteceu”." checked={planning.hidePast !== false} onChange={value => set('hidePast', value)} />
    <TextField label="Nome do encontro" hint="Usado no calendário e como título padrão." maxLength={120} value={planning.title} onChange={value => set('title', value)} />
    <Field label="Data e hora"><input className="admin-input" type="datetime-local" value={planning.date || ''} onChange={event => set('date', event.target.value)} /></Field>
    <Range label="Duração na agenda" value={planning.eventDuration ?? 60} min={15} max={240} step={15} unit=" min" onChange={value => set('eventDuration', value)} />
    <TextField label="Descrição na agenda" maxLength={200} value={planning.subtitle} onChange={value => set('subtitle', value)} />
    <button type="button" className="secondary-button" onClick={() => patch({ eventId: newId() })}>Tratar como nova call na agenda</button>
    <p className="section-help">Enquanto o encontro for o mesmo, mudar o horário atualiza o evento já adicionado à agenda dela. Use o botão acima ao marcar outra call de verdade.</p>
  </>
}

function Look({ planning, set, patch }) {
  return <>
    <h3>Temas prontos</h3>
    <div className="theme-grid">{themes.map(theme => <button type="button" className="theme-card" key={theme.name} onClick={() => patch({ backgroundColor: theme.colors[0], textColor: theme.colors[1], accentColor: theme.colors[2], planningLabelColor: theme.colors[2], backButtonColor: theme.colors[1], panelColor: theme.panelColor || '#ffffff', style: theme.style, fontFamily: theme.font, backgroundPattern: theme.pattern, panelShape: 'rounded', panelOpacity: theme.style === 'custom' ? 1 : 0.75, backgroundImage: '', backgroundIconEnabled: false, backgroundGradient: false })}>
      <span className="theme-sample" style={{ background: theme.colors[0], color: theme.colors[1] }}><span style={{ color: theme.colors[2] }}>♡</span><span style={{ fontFamily: theme.font === 'mono' ? 'monospace' : 'Georgia, serif' }}>Nossa próxima call</span><i style={{ background: theme.colors[2] }} /></span>
      <strong>{theme.name}</strong><small>{theme.note}</small>
    </button>)}</div>
    <h3>Cores</h3>
    <div className="field-grid">
      <ColorField label="Fundo" value={planning.backgroundColor} onChange={value => set('backgroundColor', value)} />
      <ColorField label="Texto" value={planning.textColor} onChange={value => set('textColor', value)} />
      <ColorField label="Destaque" value={planning.accentColor} onChange={value => set('accentColor', value)} />
      <ColorField label="Botão de voltar" value={planning.backButtonColor} onChange={value => set('backButtonColor', value)} />
    </div>
    <h3>Texto e espaço</h3>
    <SelectField label="Fonte da página" value={planning.fontFamily} onChange={value => set('fontFamily', value)} options={fontOptions} />
    <Range label="Tamanho base do texto" value={planning.baseFontSize ?? 18} min={12} max={32} unit=" px" onChange={value => set('baseFontSize', value)} />
    <Segmented label="Alinhamento padrão" value={planning.textAlign || 'left'} onChange={value => set('textAlign', value)} options={[['left', 'Esquerda', AlignLeft], ['center', 'Centro', AlignCenter], ['right', 'Direita', AlignRight]]} />
    <Range label="Largura do conteúdo" value={planning.panelWidth} min={480} max={1400} step={20} unit=" px" onChange={value => set('panelWidth', value)} />
    <Range label="Espaço entre blocos" value={planning.blockGap ?? 20} min={0} max={64} step={2} unit=" px" onChange={value => set('blockGap', value)} />
    <Range label="Distância do topo" value={planning.contentOffset} min={0} max={200} step={4} unit=" px" onChange={value => set('contentOffset', value)} />
  </>
}

function Background({ planning, set, onError }) {
  const [busy, setBusy] = useState(false)
  const pick = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try { set('backgroundImage', await uploadImage(file)); onError('') } catch (error) { onError(error.message) } finally { setBusy(false) }
  }
  return <>
    <Toggle label="Fundo em degradê" checked={planning.backgroundGradient} onChange={value => set('backgroundGradient', value)} />
    {planning.backgroundGradient && <>
      <ColorField label="Segunda cor" value={planning.backgroundGradientColor} onChange={value => set('backgroundGradientColor', value)} />
      <Range label="Direção" value={planning.backgroundGradientAngle} min={0} max={360} step={15} unit="°" onChange={value => set('backgroundGradientAngle', value)} />
    </>}
    <SelectField label="Textura" value={planning.backgroundPattern} onChange={value => set('backgroundPattern', value)} options={patternOptions} hint="As texturas usam a cor de destaque e ficam sobre a cor de fundo." />
    {planning.backgroundPattern !== 'none' && <Range label="Intensidade da textura" value={planning.backgroundPatternOpacity ?? 1} min={0.1} max={1} step={0.05} onChange={value => set('backgroundPatternOpacity', value)} />}
    <h3>Imagem de fundo</h3>
    <label className="upload-zone"><Upload size={20} /><strong>{busy ? 'Enviando…' : planning.backgroundImage ? 'Trocar imagem' : 'Enviar imagem'}</strong><small>JPG, PNG, WebP ou GIF · até 5 MB</small><input type="file" disabled={busy} accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} /></label>
    <TextField label="ou cole o endereço" type="url" placeholder="https://" value={planning.backgroundImage?.startsWith('data:') ? '' : planning.backgroundImage} onChange={value => set('backgroundImage', value)} hint={planning.backgroundImage?.startsWith('data:') ? 'Há uma imagem embutida de antes. Envie de novo para guardá-la no Storage.' : undefined} />
    {planning.backgroundImage && <button type="button" className="text-button" onClick={() => set('backgroundImage', '')}><Trash2 size={14} />Remover imagem</button>}
    {planning.backgroundImage && <>
      <Range label="Opacidade" value={planning.backgroundImageOpacity} min={0.05} max={1} step={0.05} onChange={value => set('backgroundImageOpacity', value)} />
      <Range label="Desfoque" value={planning.backgroundImageBlur} min={0} max={20} unit=" px" onChange={value => set('backgroundImageBlur', value)} />
      <SelectField label="Enquadramento" value={planning.backgroundImagePosition} onChange={value => set('backgroundImagePosition', value)} options={[['center', 'Centro'], ['top', 'Topo'], ['bottom', 'Base'], ['left', 'Esquerda'], ['right', 'Direita']]} />
      <SelectField label="Movimento" value={planning.backgroundMotion || 'none'} onChange={value => set('backgroundMotion', value)} options={backgroundMotionOptions} />
    </>}
    <h3>Ícones no fundo</h3>
    <Toggle label="Repetir um ícone no fundo" checked={planning.backgroundIconEnabled} onChange={value => set('backgroundIconEnabled', value)} />
    {planning.backgroundIconEnabled && <>
      <div className="field-grid"><SelectField label="Símbolo" value={planning.backgroundIcon} onChange={value => set('backgroundIcon', value)} options={[...iconOptions, ['random', 'Variado']]} /><ColorField label="Cor" value={planning.backgroundIconColor} onChange={value => set('backgroundIconColor', value)} /></div>
      <Range label="Tamanho" value={planning.backgroundIconSize} min={8} max={96} step={2} unit=" px" onChange={value => set('backgroundIconSize', value)} />
      <Range label="Opacidade" value={planning.backgroundIconOpacity} min={0.03} max={0.8} step={0.01} onChange={value => set('backgroundIconOpacity', value)} />
      <Range label="Espaçamento" value={planning.backgroundIconSpacing} min={30} max={180} step={6} unit=" px" onChange={value => set('backgroundIconSpacing', value)} />
      <Range label="Rotação" value={planning.backgroundIconRotation} min={-180} max={180} step={5} unit="°" onChange={value => set('backgroundIconRotation', value)} />
    </>}
  </>
}

function Frame({ planning, set }) {
  const shape = panelShapeOptions.some(([key]) => key === planning.panelShape) ? planning.panelShape : legacyShape[planning.panelShape] || 'rounded'
  return <>
    <Toggle label="Agrupar tudo numa moldura" hint="Desligue para deixar os blocos soltos sobre o fundo e dar a cada um sua própria moldura." checked={planning.panelEnabled !== false} onChange={value => set('panelEnabled', value)} />
    {planning.panelEnabled !== false && <>
      <SelectField label="Acabamento" value={planning.style} onChange={value => set('style', value)} options={variantOptions.filter(([key]) => key !== 'none')} />
      {planning.style === 'custom' && <div className="field-grid"><ColorField label="Cor" value={planning.panelColor} onChange={value => set('panelColor', value)} /><Range label="Opacidade" value={planning.panelOpacity} min={0.1} max={1} step={0.05} onChange={value => set('panelOpacity', value)} /></div>}
      <SelectField label="Forma" value={shape} onChange={value => set('panelShape', value)} options={panelShapeOptions} />
      {shape === 'custom' && <Range label="Raio dos cantos" value={planning.panelRadius ?? 32} min={0} max={80} unit=" px" onChange={value => set('panelRadius', value)} />}
      <SelectField label="Sombra" value={planning.panelShadow} onChange={value => set('panelShadow', value)} options={shadowOptions} />
      <div className="field-grid"><Range label="Espessura da borda" value={planning.panelBorderWidth} min={0} max={8} unit=" px" onChange={value => set('panelBorderWidth', value)} /><SelectField label="Traço" value={planning.panelBorderStyle} onChange={value => set('panelBorderStyle', value)} options={[['solid', 'Contínuo'], ['dashed', 'Tracejado'], ['dotted', 'Pontilhado'], ['double', 'Duplo']]} /></div>
      <Range label="Espaço interno" value={planning.panelPadding} min={8} max={96} step={2} unit=" px" onChange={value => set('panelPadding', value)} />
    </>}
  </>
}

function Motion({ planning, set, patch, onReplay }) {
  return <>
    <Toggle label="Ativar animações" hint="Quem pediu “reduzir movimento” no aparelho não vê animações." checked={planning.animationEnabled} onChange={value => set('animationEnabled', value)} />
    <SelectField label="Combinação pronta" value={planning.animationPreset || 'soft'} onChange={value => patch({ animationPreset: value, ...motionPresets[value] })} options={presetOptions} />
    <div className="field-grid">
      <SelectField label="Velocidade" value={planning.animationSpeed} onChange={value => set('animationSpeed', value)} options={speedOptions} />
      <SelectField label="Intensidade" value={planning.animationIntensity} onChange={value => set('animationIntensity', value)} options={intensityOptions} />
      <SelectField label="Entrada dos blocos" value={planning.blockEntrance || 'none'} onChange={value => set('blockEntrance', value)} options={entranceOptions} />
      <SelectField label="Entrada da moldura" value={planning.panelEntrance || 'none'} onChange={value => set('panelEntrance', value)} options={entranceOptions} />
      <SelectField label="Movimento da moldura" value={planning.panelLoop || 'none'} onChange={value => set('panelLoop', value)} options={loopOptions} />
      <SelectField label="Moldura ao passar o mouse" value={planning.hoverAnimation || 'none'} onChange={value => set('hoverAnimation', value)} options={hoverOptions} />
    </div>
    <Range label="Intervalo entre blocos" value={planning.blockStagger ?? 0.08} min={0} max={0.6} step={0.02} unit=" s" onChange={value => set('blockStagger', value)} />
    <Range label="Atraso inicial" value={planning.animationDelay ?? 0} min={0} max={3} step={0.1} unit=" s" onChange={value => set('animationDelay', value)} />
    <button type="button" className="secondary-button" onClick={onReplay}><WandSparkles size={15} />Reproduzir animações</button>
  </>
}

export default function PageInspector({ planning, set, patch, onError, onReplay, onSplash }) {
  const [tab, setTab] = useState('meeting')
  return <div className="inspector">
    <div className="inspector-title"><h2>Página</h2><p>Ajustes da call inteira. Clique num bloco para editá-lo.</p></div>
    <div className="inspector-tabs" role="tablist" aria-label="Seções da página">
      {tabs.map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} type="button" onClick={() => setTab(key)}>{label}</button>)}
    </div>
    <div className="inspector-body" key={tab}>
      {tab === 'meeting' && <Meeting planning={planning} set={set} patch={patch} />}
      {tab === 'look' && <Look planning={planning} set={set} patch={patch} />}
      {tab === 'background' && <Background planning={planning} set={set} onError={onError} />}
      {tab === 'frame' && <Frame planning={planning} set={set} />}
      {tab === 'motion' && <Motion planning={planning} set={set} patch={patch} onReplay={onReplay} />}
    </div>
    <div className="inspector-footer"><button type="button" className="secondary-button" onClick={onSplash}><Eye size={15} />Ver tela de carregamento</button></div>
  </div>
}
