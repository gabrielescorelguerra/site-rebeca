import { AlignLeft, CalendarDays, CalendarPlus, Heading, Hourglass, Image, Link2, ListOrdered, Minus, MousePointerClick, MoveVertical, Smile, StickyNote } from 'lucide-react'

export const blockLabels = {
  heading: 'Título', text: 'Texto', date: 'Data e hora', countdown: 'Contagem', activities: 'Roteiro', links: 'Links', button: 'Botão',
  calendar: 'Agenda', note: 'Bilhete', image: 'Imagem', icon: 'Ícone', divider: 'Divisor', spacer: 'Espaço',
}

export const blockMeta = [
  { type: 'heading', icon: Heading, hint: 'Título grande' },
  { type: 'text', icon: AlignLeft, hint: 'Parágrafo ou frase' },
  { type: 'image', icon: Image, hint: 'Foto ou figura' },
  { type: 'date', icon: CalendarDays, hint: 'Dia e horário' },
  { type: 'countdown', icon: Hourglass, hint: 'Quanto falta' },
  { type: 'activities', icon: ListOrdered, hint: 'Lista do que vão fazer' },
  { type: 'links', icon: Link2, hint: 'Apps e sites' },
  { type: 'button', icon: MousePointerClick, hint: 'Entrar na call' },
  { type: 'calendar', icon: CalendarPlus, hint: 'Salvar na agenda' },
  { type: 'note', icon: StickyNote, hint: 'Mensagem especial' },
  { type: 'icon', icon: Smile, hint: 'Figurinha grande' },
  { type: 'divider', icon: Minus, hint: 'Linha ou corações' },
  { type: 'spacer', icon: MoveVertical, hint: 'Espaço em branco' },
]
