import { supabase } from '../lib/supabase'

export const PLANNING_KEY = 'rebecca-call-planning'
export const PLANNING_ROW_ID = 'main'
export const AUTHENTICATED_KEY = 'rebecca-authenticated'
export const ADMIN_AUTHENTICATED_KEY = 'rebecca-admin-authenticated'

export const defaultPlanning = {
  backgroundColor: '#fbf8f6',
  textColor: '#31292d',
  accentColor: '#bd7184',
  planningLabelColor: '#bd7184',
  backButtonColor: '#88777c',
  backgroundImage: '',
  backgroundImageOpacity: 0.28,
  backgroundPattern: 'none',
  backgroundIconEnabled: false,
  backgroundIcon: 'blocks',
  backgroundIconColor: '#bd7184',
  backgroundIconSize: 28,
  backgroundIconOpacity: 0.18,
  backgroundIconSpacing: 72,
  backgroundIconRotation: 0,
  animationEnabled: true,
  animationPreset: 'soft',
  animationSpeed: 'normal',
  animationIntensity: 'medium',
  animationDelay: 0,
  panelEntrance: 'rise',
  panelLoop: 'none',
  iconAnimation: 'float',
  iconStagger: true,
  hoverAnimation: 'lift',
  backgroundMotion: 'none',
  glowAnimation: 'none',
  panelShape: 'rounded',
  style: 'minimal',
  fontFamily: 'serif',
  fontSize: 'large',
  gameIcon: 'blocks',
  title: 'Nossa próxima call',
  subtitle: 'Um tempinho reservado para nós duas.',
  date: '2026-10-03T20:00',
  showDurations: true,
  showTools: false,
  activities: [
    { id: 1, name: 'Chegar e contar como foi o dia', duration: '15 min' },
    { id: 2, name: 'Jogar alguma coisa juntas', duration: '30 min' },
    { id: 3, name: 'Conversar sem pressa', duration: '20 min' },
  ],
  tools: [
    { id: 1, name: 'Discord', url: 'https://discord.com' },
    { id: 2, name: 'Jogo da noite', url: '' },
  ],
}

export const planningOptions = {
  backgroundPatterns: [
    ['none', 'Nenhum'],
    ['stars', 'Estrelas'],
    ['game', 'Ícones de jogo'],
    ['minecraft', 'Minecraft / blocos'],
    ['arcade', 'Arcade'],
    ['hearts', 'Corações'],
    ['grid', 'Grade'],
    ['dots', 'Pontilhado'],
    ['clouds', 'Nuvens'],
    ['space', 'Espaço / estrelas'],
    ['racing', 'Corrida'],
    ['dungeon', 'Dungeon'],
    ['pixel', 'Pixel art'],
    ['underwater', 'Submarino'],
    ['portal', 'Portal'],
  ],
  styles: [
    ['minimal', 'Minimalista'],
    ['soft', 'Suave'],
    ['editorial', 'Editorial'],
    ['neon', 'Neon'],
    ['cyberpunk', 'Cyberpunk'],
    ['vaporwave', 'Vaporwave'],
    ['glass', 'Glass'],
    ['three-d', '3D'],
    ['toy-3d', '3D divertido'],
    ['hologram', 'Holograma'],
    ['laser', 'Laser'],
    ['matrix', 'Matrix'],
    ['sunset', 'Pôr do sol'],
    ['bubblegum', 'Bubblegum'],
    ['metal', 'Metal'],
    ['paper-cut', 'Papel recortado'],
    ['terminal', 'Terminal'],
  ],
  fonts: [
    ['serif', 'Serifada'],
    ['sans', 'Sem serifa'],
    ['mono', 'Monoespaçada'],
    ['rounded', 'Arredondada'],
    ['display', 'Display'],
    ['typewriter', 'Máquina de escrever'],
    ['pixel', 'Pixel'],
    ['handwriting', 'Manuscrita'],
    ['condensed', 'Condensada'],
  ],
  sizes: [
    ['tiny', 'Muito compacto'],
    ['compact', 'Compacto'],
    ['medium', 'Médio'],
    ['large', 'Grande'],
    ['huge', 'Muito grande'],
    ['poster', 'Pôster'],
    ['hero', 'Heroico'],
    ['responsive', 'Responsivo'],
    ['maximum', 'Máximo'],
    ['micro', 'Micro'],
    ['cinema', 'Cinema'],
    ['book', 'Livro'],
    ['banner', 'Banner'],
    ['mobile', 'Mobile'],
    ['xl', 'Extra grande'],
    ['xxl', 'Gigante'],
    ['custom', 'Personalizado'],
  ],
  panelShapes: [
    ['rounded', 'Arredondado'],
    ['square', 'Quadrado'],
    ['soft-square', 'Quadrado suave'],
    ['circle', 'Circular'],
    ['heart', 'Coração'],
    ['triangle', 'Triângulo'],
    ['diamond', 'Diamante'],
    ['ticket', 'Ingresso'],
    ['pill', 'Pílula'],
    ['blob', 'Orgânico'],
    ['hexagon', 'Hexágono'],
    ['notched', 'Recortado'],
  ],
  gameIcons: [
    ['blocks', 'Blocos / Minecraft'],
    ['gamepad', 'Controle'],
    ['sword', 'Espada'],
    ['ghost', 'Fantasma'],
    ['rocket', 'Foguete'],
    ['dice', 'Dados'],
    ['trophy', 'Trofeu'],
    ['joystick', 'Arcade'],
    ['sparkles', 'Brilhos'],
    ['heart', 'Coração'],
    ['star', 'Estrela'],
    ['crown', 'Coroa'],
    ['flame', 'Fogo'],
    ['zap', 'Raio'],
    ['cat', 'Gatinho'],
    ['circle', 'Círculo'],
    ['square', 'Quadrado'],
    ['music', 'Música'],
    ['coffee', 'Café'],
  ],
  backgroundIcons: [
    ['blocks', 'Blocos'],
    ['gamepad', 'Controle'],
    ['sword', 'Espadas'],
    ['ghost', 'Fantasmas'],
    ['rocket', 'Foguetes'],
    ['dice', 'Dados'],
    ['trophy', 'Trofeus'],
    ['joystick', 'Arcade'],
    ['sparkles', 'Brilhos'],
    ['heart', 'Corações'],
    ['star', 'Estrelas'],
    ['crown', 'Coroas'],
    ['flame', 'Fogo'],
    ['zap', 'Raios'],
    ['cat', 'Gatinhos'],
    ['circle', 'Círculos'],
    ['square', 'Quadrados'],
    ['music', 'Notas musicais'],
    ['coffee', 'Cafés'],
    ['random', 'Variado'],
  ],
  animationPresets: [
    ['none', 'Sem animação'],
    ['soft', 'Suave'],
    ['playful', 'Divertida'],
    ['dramatic', 'Dramática'],
    ['neon', 'Neon pulsante'],
    ['game', 'Jogo'],
    ['cinema', 'Cinema'],
    ['chaos', 'Caos controlado'],
  ],
  animationSpeeds: [
    ['slow', 'Lenta'],
    ['relaxed', 'Relaxada'],
    ['normal', 'Normal'],
    ['fast', 'Rápida'],
    ['turbo', 'Turbo'],
  ],
  animationIntensities: [
    ['subtle', 'Sutil'],
    ['low', 'Leve'],
    ['medium', 'Média'],
    ['high', 'Alta'],
    ['extreme', 'Extrema'],
  ],
  panelEntrances: [
    ['none', 'Nenhuma'],
    ['fade', 'Aparecer'],
    ['rise', 'Subir'],
    ['slide-left', 'Entrar pela esquerda'],
    ['slide-right', 'Entrar pela direita'],
    ['zoom', 'Zoom'],
    ['flip', 'Virar'],
    ['bounce', 'Quicar'],
    ['glitch', 'Glitch'],
  ],
  panelLoops: [
    ['none', 'Nenhum'],
    ['float', 'Flutuar'],
    ['breathe', 'Respirar'],
    ['sway', 'Balançar'],
    ['shake', 'Tremer'],
    ['spin', 'Girar'],
  ],
  iconAnimations: [
    ['none', 'Parado'],
    ['float', 'Flutuar'],
    ['pulse', 'Pulsar'],
    ['spin', 'Girar'],
    ['bounce', 'Quicar'],
    ['swing', 'Balançar'],
    ['orbit', 'Orbitar'],
    ['glitch', 'Glitch'],
  ],
  hoverAnimations: [
    ['none', 'Nenhum'],
    ['lift', 'Elevar'],
    ['scale', 'Aumentar'],
    ['glow', 'Iluminar'],
    ['tilt', 'Inclinar'],
    ['jelly', 'Gelatina'],
  ],
  backgroundMotions: [
    ['none', 'Parado'],
    ['drift', 'Deriva'],
    ['zoom', 'Zoom lento'],
    ['rotate', 'Rotação'],
    ['parallax', 'Parallax'],
    ['wave', 'Ondulação'],
  ],
  glowAnimations: [
    ['none', 'Sem brilho'],
    ['soft', 'Brilho suave'],
    ['pulse', 'Brilho pulsante'],
    ['rainbow', 'Arco-íris'],
    ['flicker', 'Cintilante'],
  ],
}

export async function loadPlanning() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }

  const { data, error } = await supabase
    .from('planning_config')
    .select('config')
    .eq('id', PLANNING_ROW_ID)
    .maybeSingle()

  if (error) {
    console.error('Não foi possível carregar a configuração do Supabase.', error)
    throw error
  }

  return data?.config ? { ...defaultPlanning, ...data.config } : defaultPlanning
}

export async function savePlanning(planning) {
  if (!supabase) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }

  const { error } = await supabase
    .from('planning_config')
    .upsert({ id: PLANNING_ROW_ID, config: planning }, { onConflict: 'id' })

  if (error) {
    console.error('Não foi possível salvar a configuração no Supabase.', error)
    throw error
  }
}
