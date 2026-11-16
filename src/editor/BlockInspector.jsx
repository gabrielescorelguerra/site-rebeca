import { useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Copy, Plus, Trash2, Upload } from 'lucide-react'
import { newId } from '../data/blocks'
import { effectOptions, entranceOptions, fontOptions, hoverOptions, loopOptions, shadowOptions, textEffectOptions, variantOptions } from '../data/visuals'
import { uploadImage } from '../data/media'
import { ColorField, Field, IconPicker, NumberField, Range, SelectField, Section, Segmented, ShapePicker, TextArea, TextField, Toggle } from './fields'
import { blockLabels } from './blockMeta'
import ResponsesPanel from './ResponsesPanel'

function ItemsEditor({ items = [], onChange, fields, makeItem, noun }) {
  const edit = (id, key, value) => onChange(items.map(item => item.id === id ? { ...item, [key]: value } : item))
  const move = (index, direction) => { const next = [...items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onChange(next) }
  return <div className="items-editor">
    {items.map((item, index) => <div className="activity-editor" key={item.id}>
      <div className="item-heading">
        <span>{noun.toUpperCase()} {String(index + 1).padStart(2, '0')}</span>
        <div>
          <button type="button" aria-label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={14} /></button>
          <button type="button" aria-label="Mover para baixo" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={14} /></button>
          <button type="button" aria-label="Duplicar" onClick={() => onChange([...items.slice(0, index + 1), { ...item, id: newId() }, ...items.slice(index + 1)])}><Copy size={14} /></button>
          <button type="button" aria-label="Excluir" onClick={() => onChange(items.filter(value => value.id !== item.id))}><Trash2 size={14} /></button>
        </div>
      </div>
      {fields.map(({ key, label, multiline, ...rest }) => multiline
        ? <TextArea key={key} label={label} rows={2} value={item[key]} onChange={value => edit(item.id, key, value)} {...rest} />
        : <TextField key={key} label={label} value={item[key]} onChange={value => edit(item.id, key, value)} {...rest} />)}
    </div>)}
    <button type="button" className="secondary-button" onClick={() => onChange([...items, makeItem()])}><Plus size={15} />Adicionar {noun}</button>
  </div>
}

function ImageFields({ props, set, onError }) {
  const [busy, setBusy] = useState(false)
  const pick = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try { set({ url: await uploadImage(file) }); onError('') } catch (error) { onError(error.message) } finally { setBusy(false) }
  }
  return <>
    <label className="upload-zone"><Upload size={20} /><strong>{busy ? 'Enviando…' : props.url ? 'Trocar imagem' : 'Enviar imagem'}</strong><small>JPG, PNG, WebP ou GIF · até 5 MB</small><input type="file" disabled={busy} accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} /></label>
    <TextField label="ou cole o endereço da imagem" type="url" placeholder="https://" value={props.url} onChange={url => set({ url })} />
    <TextField label="Descrição (para leitores de tela)" maxLength={160} value={props.alt} onChange={alt => set({ alt })} />
    <div className="field-grid">
      <SelectField label="Enquadramento" value={props.fit || 'cover'} onChange={fit => set({ fit })} options={[['cover', 'Preencher'], ['contain', 'Mostrar inteira']]} />
      <SelectField label="Proporção" value={props.ratio || '4/3'} onChange={ratio => set({ ratio })} options={[['auto', 'Original'], ['1/1', 'Quadrada'], ['4/3', '4:3'], ['3/4', 'Retrato 3:4'], ['16/9', 'Panorâmica 16:9']]} />
    </div>
    <TextField label="Legenda (opcional)" maxLength={160} value={props.caption} onChange={caption => set({ caption })} />
  </>
}

function ContentTab({ block, set, onError }) {
  const p = block.props
  switch (block.type) {
    case 'heading': return <>
      <TextArea label="Título" rows={2} maxLength={200} value={p.text} onChange={text => set({ text })} />
      <SelectField label="Importância (acessibilidade)" value={String(p.level || 2)} onChange={value => set({ level: Number(value) })} options={[['1', 'Título principal da página'], ['2', 'Subtítulo'], ['3', 'Título pequeno']]} />
    </>
    case 'text': return <>
      <TextArea label="Texto" rows={5} maxLength={2000} value={p.text} onChange={text => set({ text })} />
      <IconPicker label="Ícone antes do texto" allowNone value={p.icon} onChange={icon => set({ icon })} />
    </>
    case 'date': return <>
      <SelectField label="Formato" value={p.format || 'full'} onChange={format => set({ format })} options={[['full', 'Completo (sábado, 3 de outubro às 20:00)'], ['short', 'Curto (03/10/2026 20:00)'], ['day', 'Só o dia'], ['time', 'Só o horário']]} />
      <TextField label="Texto antes (opcional)" maxLength={60} placeholder="ex.: Nos vemos" value={p.prefix} onChange={prefix => set({ prefix })} />
      <p className="section-help">A data é a mesma para todos os blocos. Altere em “Página → O encontro”.</p>
    </>
    case 'countdown': return <>
      <SelectField label="Estilo" value={p.variant || 'text'} onChange={variant => set({ variant })} options={[['text', 'Frase'], ['blocks', 'Caixinhas']]} />
      <TextField label="Mensagem quando chegar a hora" maxLength={120} value={p.finished} onChange={finished => set({ finished })} />
    </>
    case 'activities': return <>
      <TextField label="Título da lista" maxLength={80} value={p.label} onChange={label => set({ label })} />
      <SelectField label="Apresentação" value={p.layout || 'list'} onChange={layout => set({ layout })} options={[['list', 'Lista'], ['cards', 'Cartões'], ['timeline', 'Linha do tempo']]} />
      <Toggle label="Numerar" checked={p.numbered} onChange={numbered => set({ numbered })} />
      <Toggle label="Mostrar duração" checked={p.showDurations} onChange={showDurations => set({ showDurations })} />
      <Range label="Espaço entre itens" value={p.gap ?? 12} min={0} max={40} step={2} unit=" px" onChange={gap => set({ gap })} />
      <ItemsEditor noun="atividade" items={p.items} onChange={items => set({ items })} makeItem={() => ({ id: newId(), name: '', duration: '15 min', description: '' })} fields={[{ key: 'name', label: 'Atividade', maxLength: 120 }, { key: 'duration', label: 'Duração', placeholder: '30 min', maxLength: 30 }, { key: 'description', label: 'Descrição (opcional)', multiline: true, maxLength: 300 }]} />
    </>
    case 'links': return <>
      <TextField label="Título da lista" maxLength={80} value={p.label} onChange={label => set({ label })} />
      <SelectField label="Apresentação" value={p.layout || 'list'} onChange={layout => set({ layout })} options={[['list', 'Lista'], ['chips', 'Botões pequenos']]} />
      <ItemsEditor noun="link" items={p.items} onChange={items => set({ items })} makeItem={() => ({ id: newId(), name: '', url: '' })} fields={[{ key: 'name', label: 'Nome', maxLength: 80 }, { key: 'url', label: 'Endereço', type: 'url', placeholder: 'https://' }]} />
    </>
    case 'button': return <>
      <TextField label="Texto do botão" maxLength={60} value={p.label} onChange={label => set({ label })} />
      <TextField label="Endereço (https://…)" type="url" placeholder="https://" value={p.url} onChange={url => set({ url })} />
      <SelectField label="Aparência" value={p.look || 'filled'} onChange={look => set({ look })} options={[['filled', 'Preenchido'], ['outline', 'Contorno'], ['ghost', 'Discreto']]} />
    </>
    case 'calendar': return <>
      <TextField label="Texto do botão" maxLength={60} value={p.label} onChange={label => set({ label })} />
      <TextField label="Nome do evento na agenda" hint="Vazio = nome do encontro." maxLength={120} value={p.eventTitle} onChange={eventTitle => set({ eventTitle })} />
    </>
    case 'note': return <>
      <TextField label="Título" maxLength={100} value={p.title} onChange={title => set({ title })} />
      <TextArea label="Mensagem" rows={5} maxLength={1000} value={p.text} onChange={text => set({ text })} />
      <IconPicker label="Ícone" value={p.icon} onChange={icon => set({ icon })} />
    </>
    case 'image': return <ImageFields props={p} set={set} onError={onError} />
    case 'icon': return <>
      <IconPicker value={p.icon} onChange={icon => set({ icon })} />
      <Range label="Tamanho" value={p.size ?? 56} min={16} max={220} step={4} unit=" px" onChange={size => set({ size })} />
    </>
    case 'divider': return <SelectField label="Estilo" value={p.look || 'line'} onChange={look => set({ look })} options={[['line', 'Linha'], ['dashed', 'Tracejada'], ['dots', 'Pontinhos'], ['hearts', 'Corações']]} />
    case 'spacer': return <Range label="Altura" value={p.height ?? 40} min={8} max={240} step={4} unit=" px" onChange={height => set({ height })} />
    case 'rsvp': return <>
      <TextField label="Pergunta" maxLength={160} value={p.question} onChange={question => set({ question })} />
      <TextField label="Mensagem depois de responder" maxLength={160} value={p.thanks} onChange={thanks => set({ thanks })} />
      <ItemsEditor noun="opção" items={p.options} onChange={options => set({ options })} makeItem={() => ({ id: newId(), label: '' })} fields={[{ key: 'label', label: 'Texto da opção', maxLength: 80 }]} />
    </>
    case 'poll': return <>
      <TextField label="Pergunta" maxLength={160} value={p.question} onChange={question => set({ question })} />
      <Toggle label="Pode escolher mais de uma" checked={p.multiple} onChange={multiple => set({ multiple })} />
      <TextField label="Mensagem depois de votar" maxLength={160} value={p.thanks} onChange={thanks => set({ thanks })} />
      <ItemsEditor noun="opção" items={p.options} onChange={options => set({ options })} makeItem={() => ({ id: newId(), label: '' })} fields={[{ key: 'label', label: 'Texto da opção', maxLength: 80 }]} />
    </>
    case 'question': return <>
      <TextField label="Pergunta" maxLength={200} value={p.prompt} onChange={prompt => set({ prompt })} />
      <TextField label="Dica dentro da caixa" maxLength={80} value={p.placeholder} onChange={placeholder => set({ placeholder })} />
      <TextField label="Texto do botão" maxLength={40} value={p.button} onChange={button => set({ button })} />
      <TextField label="Mensagem depois de enviar" maxLength={160} value={p.thanks} onChange={thanks => set({ thanks })} />
    </>
    case 'checklist': return <>
      <TextField label="Título" maxLength={80} value={p.label} onChange={label => set({ label })} />
      <ItemsEditor noun="item" items={p.items} onChange={items => set({ items })} makeItem={() => ({ id: newId(), name: '' })} fields={[{ key: 'name', label: 'Item', maxLength: 100 }]} />
    </>
    case 'quiz': return <>
      <TextField label="Pergunta" maxLength={200} value={p.question} onChange={question => set({ question })} />
      <SelectField label="Resposta certa" value={p.correctId} onChange={correctId => set({ correctId })} options={(p.options || []).map(option => [option.id, option.label || '(sem texto)'])} />
      <TextField label="Quando acertar" maxLength={120} value={p.right} onChange={right => set({ right })} />
      <TextField label="Quando errar" maxLength={120} value={p.wrong} onChange={wrong => set({ wrong })} />
      <ItemsEditor noun="opção" items={p.options} onChange={options => set({ options })} makeItem={() => ({ id: newId(), label: '' })} fields={[{ key: 'label', label: 'Texto da opção', maxLength: 80 }]} />
    </>
    case 'reveal': return <>
      <SelectField label="Como abre" value={p.mode || 'tap'} onChange={mode => set({ mode })} options={[['tap', 'Ao tocar'], ['date', 'Numa data e hora'], ['code', 'Com uma senha']]} />
      <TextField label={p.mode === 'code' ? 'Texto acima da senha' : p.mode === 'date' ? 'Texto enquanto trancado' : 'Texto do botão'} maxLength={80} value={p.button} onChange={button => set({ button })} />
      {p.mode === 'date' && <Field label="Abre em"><input className="admin-input" type="datetime-local" value={p.unlockAt || ''} onChange={event => set({ unlockAt: event.target.value })} /></Field>}
      {p.mode === 'code' && <><TextField label="Senha" maxLength={40} value={p.code} onChange={code => set({ code })} hint="É uma brincadeira: a senha fica no código da página e não protege nada importante." /><TextField label="Dica (opcional)" maxLength={100} value={p.hint} onChange={hint => set({ hint })} /></>}
      <TextField label="Título escondido" maxLength={100} value={p.title} onChange={title => set({ title })} />
      <TextArea label="Mensagem escondida" rows={4} maxLength={1000} value={p.text} onChange={text => set({ text })} />
    </>
    case 'surprise': return <>
      <TextField label="Texto do botão" maxLength={40} value={p.label} onChange={label => set({ label })} />
      <TextField label="Mensagem que aparece" maxLength={160} value={p.message} onChange={message => set({ message })} />
      <IconPicker label="O que cai na chuva" value={p.icon} onChange={icon => set({ icon })} />
    </>
    default: return null
  }
}

function FrameSection({ block, device, api }) {
  const f = block.frame?.[device] || { x: 0, y: 0, w: 400 }
  const set = patch => api.setFrames({ [block.id]: patch }, device, 'inspector')
  return <Section title="Posição e tamanho" open>
    <p className="section-help">Arraste o bloco no canvas; aqui você acerta os números. As medidas são da prancheta ({device === 'mobile' ? 'celular' : 'computador'}).</p>
    <div className="field-grid">
      <NumberField label="X (esquerda)" value={f.x} onChange={x => set({ x: x ?? 0 })} />
      <NumberField label="Y (topo)" value={f.y} onChange={y => set({ y: y ?? 0 })} />
      <NumberField label="Largura" value={f.w} min={24} onChange={w => set({ w: Math.max(24, w ?? 24) })} />
      <NumberField label="Altura" value={f.h} min={24} placeholder="auto" onChange={h => set({ h: h === undefined ? undefined : Math.max(24, h) })} />
    </div>
    <Range label="Giro" value={f.rot ?? 0} min={-180} max={180} step={1} unit="°" onChange={rot => set({ rot })} />
    <div className="field-grid">
      <button type="button" className="secondary-button" onClick={() => api.zOrder([block.id], 'front')}>Trazer p/ frente</button>
      <button type="button" className="secondary-button" onClick={() => api.zOrder([block.id], 'back')}>Enviar p/ trás</button>
    </div>
    <button type="button" className="secondary-button" onClick={() => set({ h: undefined, rot: 0 })}>Altura automática e sem giro</button>
  </Section>
}

function StyleTab({ block, style, setSpan, canvas, api }) {
  const s = block.style || {}
  const framed = (s.variant || 'none') !== 'none'
  const shapeMasked = ['heart', 'star', 'cloud', 'diamond', 'hexagon'].includes(s.shape)
  return <>
    {canvas ? <FrameSection block={block} device={canvas} api={api} /> : <Section title="Posição e tamanho" open>
      <p className="section-help">Arraste o bloco no palco para posicioná-lo; aqui você ajusta com precisão.</p>
      <Range label="Largura (colunas de 12)" value={block.span} min={1} max={12} onChange={setSpan} />
      <Range label="Largura máxima" auto value={s.maxWidth} fallback={600} min={80} max={1200} step={10} unit=" px" onChange={maxWidth => style({ maxWidth })} />
      {s.maxWidth && <Segmented label="Posição na coluna" value={s.place || 'start'} onChange={place => style({ place })} options={[['start', 'Início'], ['center', 'Centro'], ['end', 'Fim']]} />}
      <Range label="Altura mínima" auto value={s.minHeight} fallback={0} min={0} max={800} step={4} unit=" px" onChange={minHeight => style({ minHeight })} />
      <div className="field-grid">
        <Range label="Mover ← →" value={s.offsetX ?? 0} min={-600} max={600} step={2} unit=" px" onChange={offsetX => style({ offsetX })} />
        <Range label="Mover ↑ ↓" value={s.offsetY ?? 0} min={-600} max={600} step={2} unit=" px" onChange={offsetY => style({ offsetY })} />
      </div>
      <Range label="Giro" value={s.rotate ?? 0} min={-180} max={180} step={1} unit="°" onChange={rotate => style({ rotate })} />
      <Range label="Camada (frente / trás)" value={s.layer ?? 0} min={-5} max={5} onChange={layer => style({ layer })} />
      <button type="button" className="secondary-button" onClick={() => style({ offsetX: 0, offsetY: 0, rotate: 0, layer: 0, minHeight: undefined, maxWidth: undefined })}>Voltar à posição original</button>
      <Range label="Transparência" value={s.opacity ?? 1} min={0.1} max={1} step={0.05} onChange={opacity => style({ opacity })} />
    </Section>}
    {canvas && <Range label="Transparência" value={s.opacity ?? 1} min={0.1} max={1} step={0.05} onChange={opacity => style({ opacity })} />}
    <Section title="Formato e moldura" open>
      <ShapePicker value={s.shape} onChange={shape => style({ shape })} />
      {shapeMasked && <p className="section-help">Este formato recorta a moldura inteira, então a borda não aparece; o texto se ajusta dentro dele.</p>}
      {s.shape === 'custom' && <Range label="Raio dos cantos" value={s.radius ?? 24} min={0} max={80} unit=" px" onChange={radius => style({ radius })} />}
      <SelectField label="Moldura (cor e estilo)" value={s.variant || 'none'} onChange={variant => style({ variant })} options={variantOptions} />
      {s.variant === 'custom' && <>
        <div className="field-grid"><ColorField label="Cor" value={s.bg} fallback="#ffffff" onChange={bg => style({ bg })} /><ColorField label="2ª cor (degradê)" auto value={s.bg2} fallback="#f3d6df" onChange={bg2 => style({ bg2 })} /></div>
        {s.bg2 && <Range label="Ângulo do degradê" value={s.gradientAngle ?? 135} min={0} max={360} step={15} unit="°" onChange={gradientAngle => style({ gradientAngle })} />}
        <Range label="Opacidade do fundo" value={s.bgOpacity ?? 1} min={0} max={1} step={0.05} onChange={bgOpacity => style({ bgOpacity })} />
      </>}
      <Range label="Espaço interno extra" auto value={s.padding} fallback={framed ? 20 : 0} min={0} max={96} step={2} unit=" px" onChange={padding => style({ padding })} />
      {!shapeMasked && <>
        <Range label="Espessura da borda" auto value={s.borderWidth} fallback={0} min={0} max={8} unit=" px" onChange={borderWidth => style({ borderWidth })} />
        {s.borderWidth > 0 && <div className="field-grid"><ColorField label="Cor da borda" auto value={s.borderColor} fallback="#bd7184" onChange={borderColor => style({ borderColor })} /><SelectField label="Traço" value={s.borderStyle || 'solid'} onChange={borderStyle => style({ borderStyle })} options={[['solid', 'Contínuo'], ['dashed', 'Tracejado'], ['dotted', 'Pontilhado'], ['double', 'Duplo']]} /></div>}
        <Range label="Desfoque do fundo (vidro)" value={s.blur ?? 0} min={0} max={30} unit=" px" onChange={blur => style({ blur })} />
      </>}
      <SelectField label="Sombra" value={s.shadow || 'theme'} onChange={shadow => style({ shadow })} options={shadowOptions} />
    </Section>
    <Section title="Texto" open>
      <SelectField label="Fonte" value={s.fontFamily || 'inherit'} onChange={fontFamily => style({ fontFamily })} options={[['inherit', 'Da página'], ...fontOptions]} />
      <Range label="Tamanho" auto value={s.size} fallback={18} min={10} max={200} unit=" px" onChange={size => style({ size })} />
      <Segmented label="Alinhamento" value={s.align || 'inherit'} onChange={align => style({ align })} options={[['inherit', 'Auto'], ['left', 'Esquerda', AlignLeft], ['center', 'Centro', AlignCenter], ['right', 'Direita', AlignRight]]} />
      <div className="field-grid">
        <SelectField label="Peso" value={String(s.weight || '')} onChange={weight => style({ weight: weight ? Number(weight) : undefined })} options={[['', 'Padrão'], ['300', 'Fino'], ['400', 'Normal'], ['600', 'Seminegrito'], ['700', 'Negrito']]} />
        <ColorField label="Cor do texto" auto value={s.color} fallback="#31292d" onChange={color => style({ color })} />
      </div>
      <Toggle label="Itálico" checked={s.italic} onChange={italic => style({ italic })} />
      <Toggle label="Maiúsculas" checked={s.uppercase} onChange={uppercase => style({ uppercase })} />
      <Range label="Espaço entre letras" auto value={s.spacing} fallback={0} min={-0.08} max={0.5} step={0.01} unit=" em" onChange={spacing => style({ spacing })} />
      <Range label="Altura da linha" auto value={s.lineHeight} fallback={1.6} min={0.8} max={2.6} step={0.05} onChange={lineHeight => style({ lineHeight })} />
    </Section>
    <Section title="Efeitos">
      <SelectField label="Efeito no texto" value={s.textEffect || 'none'} onChange={textEffect => style({ textEffect })} options={textEffectOptions} />
      <Toggle label="Texto em degradê" hint="Usa a cor do texto e uma segunda cor." checked={s.textGradient} onChange={textGradient => style({ textGradient })} />
      {s.textGradient && <><ColorField label="Segunda cor do texto" value={s.color2} fallback="#d99aab" onChange={color2 => style({ color2 })} /><Range label="Ângulo" value={s.gradientAngle ?? 90} min={0} max={360} step={15} unit="°" onChange={gradientAngle => style({ gradientAngle })} /></>}
      <SelectField label="Filtro do bloco" value={s.effect || 'none'} onChange={effect => style({ effect })} options={effectOptions} hint="Útil para fotos: preto e branco, sépia, sonhador…" />
    </Section>
  </>
}

function MotionTab({ block, style, pageEnabled }) {
  const s = block.style || {}
  return <>
    {!pageEnabled && <p className="section-help">As animações estão desativadas na página (aba Movimento da página).</p>}
    <SelectField label="Entrada" value={s.entrance || 'inherit'} onChange={entrance => style({ entrance })} options={[['inherit', 'Padrão da página'], ...entranceOptions]} />
    <Range label="Atraso extra" value={s.delay ?? 0} min={0} max={5} step={0.1} unit=" s" onChange={delay => style({ delay })} />
    <SelectField label="Movimento contínuo" value={s.loop || 'none'} onChange={loop => style({ loop })} options={loopOptions} />
    <SelectField label="Ao passar o mouse" value={s.hover || 'none'} onChange={hover => style({ hover })} options={hoverOptions} />
    <p className="section-help">Use o botão “Reproduzir animações” acima do palco para ver o resultado.</p>
  </>
}

export default function BlockInspector({ block, api, pageEnabled, onError, callKey, canvas = null }) {
  const [tab, setTab] = useState('content')
  const set = patch => api.setProps(block.id, patch)
  const style = patch => api.setStyle(block.id, patch)
  return <div className="inspector">
    <div className="inspector-title"><h2>{blockLabels[block.type]}</h2></div>
    <div className="inspector-tabs" role="tablist" aria-label="Seções do bloco">
      {[['content', 'Conteúdo'], ['style', 'Estilo'], ['motion', 'Movimento']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} type="button" onClick={() => setTab(key)}>{label}</button>)}
    </div>
    <div className="inspector-body" key={`${block.id}-${tab}`}>
      {tab === 'content' && <>
        <ContentTab block={block} set={set} onError={onError} />
        {['rsvp', 'poll', 'question', 'checklist', 'quiz'].includes(block.type) && <ResponsesPanel block={block} callKey={callKey} />}
      </>}
      {tab === 'style' && <StyleTab block={block} style={style} setSpan={span => api.setSpan(block.id, span)} canvas={canvas} api={api} />}
      {tab === 'motion' && <MotionTab block={block} style={style} pageEnabled={pageEnabled} />}
    </div>
    <div className="inspector-footer">
      <button type="button" className="secondary-button" onClick={() => api.duplicate(block.id)}><Copy size={15} />Duplicar</button>
      <button type="button" className="secondary-button danger" onClick={() => api.remove(block.id)}><Trash2 size={15} />Excluir</button>
    </div>
  </div>
}
