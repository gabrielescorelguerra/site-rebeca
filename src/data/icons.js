import { BookOpen, Cake, Camera, Cat, Circle, Clapperboard, Cloud, Coffee, Cookie, Crown, Cuboid, Dice5, Film, Flame, Flower2, Gamepad2, Ghost, Gift, Headphones, Heart, IceCream, Joystick, Leaf, Moon, Music, PartyPopper, Phone, Pizza, Popcorn, Rocket, Smile, Sparkles, Square, Star, Sun, Sword, Trophy, Tv, Video, Zap } from 'lucide-react'

// Chaves antigas (blocks, gamepad…) foram mantidas para não quebrar chamadas já salvas.
export const icons = {
  heart: ['Coração', Heart], sparkles: ['Brilhos', Sparkles], star: ['Estrela', Star], flower: ['Flor', Flower2], moon: ['Lua', Moon], sun: ['Sol', Sun],
  cloud: ['Nuvem', Cloud], gift: ['Presente', Gift], smile: ['Sorriso', Smile], party: ['Festa', PartyPopper], cake: ['Bolo', Cake], icecream: ['Sorvete', IceCream],
  pizza: ['Pizza', Pizza], cookie: ['Biscoito', Cookie], coffee: ['Café', Coffee], popcorn: ['Pipoca', Popcorn], film: ['Filme', Film], clapper: ['Cinema', Clapperboard],
  tv: ['TV', Tv], camera: ['Câmera', Camera], video: ['Vídeo', Video], phone: ['Telefone', Phone], headphones: ['Fones', Headphones], music: ['Música', Music],
  book: ['Livro', BookOpen], leaf: ['Folha', Leaf], cat: ['Gatinho', Cat], crown: ['Coroa', Crown], flame: ['Fogo', Flame], zap: ['Raio', Zap],
  blocks: ['Blocos', Cuboid], gamepad: ['Controle', Gamepad2], sword: ['Espada', Sword], ghost: ['Fantasma', Ghost], rocket: ['Foguete', Rocket],
  dice: ['Dados', Dice5], trophy: ['Troféu', Trophy], joystick: ['Arcade', Joystick], circle: ['Círculo', Circle], square: ['Quadrado', Square],
}
export const iconOptions = Object.entries(icons).map(([key, [label]]) => [key, label])
