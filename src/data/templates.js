import { createBlock } from './blocks.js'

function make(type, { span, props, style } = {}) {
  const block = createBlock(type)
  if (span) block.span = span
  block.props = { ...block.props, ...props }
  block.style = { ...block.style, ...style }
  return block
}

// Pontos de partida de layout. Substituem os blocos (dá para desfazer) e ajustam a moldura da página.
export const templates = {
  invite: {
    label: 'Convite clássico', note: 'Título, data, roteiro e bilhete numa moldura.',
    page: { panelEnabled: true, textAlign: 'left' },
    build: () => [
      make('text', { props: { text: 'nosso encontro', icon: 'heart' }, style: { size: 12, uppercase: true, spacing: 0.2, color: undefined } }),
      make('heading', { props: { text: 'Nossa próxima call', level: 1 } }),
      make('date'),
      make('countdown'),
      make('button', { span: 6 }),
      make('calendar', { span: 6 }),
      make('activities', { span: 8 }),
      make('links', { span: 4 }),
      make('note'),
    ],
  },
  poster: {
    label: 'Pôster centralizado', note: 'Ícone grande, título gigante e contagem em caixinhas.',
    page: { panelEnabled: false, textAlign: 'center' },
    build: () => [
      make('icon', { span: 12, props: { icon: 'sparkles', size: 72 }, style: { align: 'center', loop: 'float' } }),
      make('heading', { props: { text: 'Hoje tem a gente', level: 1 }, style: { size: 96, align: 'center', entrance: 'zoom' } }),
      make('date', { style: { align: 'center', size: 18 } }),
      make('countdown', { props: { variant: 'blocks' } }),
      make('divider', { props: { look: 'hearts' } }),
      make('button', { style: { align: 'center' } }),
    ],
  },
  scrapbook: {
    label: 'Álbum de recortes', note: 'Fotos inclinadas, bilhete e cartões soltos.',
    page: { panelEnabled: false, textAlign: 'left' },
    build: () => [
      make('heading', { span: 12, props: { text: 'Uma noite só nossa', level: 1 }, style: { size: 72, fontFamily: 'handwriting', rotate: -2 } }),
      make('image', { span: 5, style: { variant: 'paper-cut', padding: 10, rotate: -3, shape: 'soft' } }),
      make('note', { span: 7, style: { variant: 'bubblegum', rotate: 1.5 } }),
      make('activities', { span: 7, props: { layout: 'cards' }, style: { variant: 'soft', padding: 24 } }),
      make('image', { span: 5, style: { variant: 'paper-cut', padding: 10, rotate: 2.5, shape: 'soft' } }),
      make('date', { span: 12 }),
    ],
  },
}
templates.interactive = {
  label: 'Convite interativo', note: 'Confirmação, votação, pergunta, quiz e uma surpresa.',
  page: { panelEnabled: true, textAlign: 'left' },
  build: () => [
    make('heading', { props: { text: 'Você está convidada', level: 1 } }),
    make('date'),
    make('rsvp'),
    make('poll'),
    make('quiz'),
    make('question'),
    make('reveal'),
    make('surprise', { span: 12, style: { align: 'center' } }),
  ],
}
export const templateOptions = Object.entries(templates).map(([key, value]) => [key, value.label, value.note])
