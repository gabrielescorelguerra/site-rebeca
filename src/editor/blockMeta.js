import { AlignLeft, CalendarCheck, Gift, ListTodo, Lock, MessageSquareText, Trophy, Vote, CalendarDays, CalendarPlus, Heading, Hourglass, Image, Link2, ListOrdered, Minus, MousePointerClick, MoveVertical, Smile, StickyNote } from 'lucide-react'

export const blockLabels = {
  heading: 'Título', text: 'Texto', date: 'Data e hora', countdown: 'Contagem', activities: 'Roteiro', links: 'Links', button: 'Botão',
  calendar: 'Agenda', note: 'Bilhete', image: 'Imagem', icon: 'Ícone', divider: 'Divisor', spacer: 'Espaço',
  rsvp: 'Confirmação', poll: 'Votação', question: 'Pergunta', checklist: 'Checklist', reveal: 'Segredo', quiz: 'Quiz', surprise: 'Surpresa',
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
  { type: 'rsvp', icon: CalendarCheck, hint: 'Ela confirma presença', interactive: true },
  { type: 'poll', icon: Vote, hint: 'Ela escolhe uma opção', interactive: true },
  { type: 'question', icon: MessageSquareText, hint: 'Ela responde com texto', interactive: true },
  { type: 'checklist', icon: ListTodo, hint: 'Ela marca o que fez', interactive: true },
  { type: 'quiz', icon: Trophy, hint: 'Pergunta com resposta certa', interactive: true },
  { type: 'reveal', icon: Lock, hint: 'Trancado por data ou senha', interactive: true },
  { type: 'surprise', icon: Gift, hint: 'Botão com chuva de corações', interactive: true },
]
