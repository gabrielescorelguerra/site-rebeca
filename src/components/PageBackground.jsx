import IconByKey from './IconByKey'
import { backgroundMotionKeyframe, motionVars, patternStyle } from '../data/visuals'
import { validLink } from '../utils/url'

const iconCells = Array.from({ length: 48 }, (_, index) => index)
const variety = ['heart', 'sparkles', 'star', 'flower', 'moon', 'music', 'gamepad', 'coffee', 'cat', 'crown']

function safeImage(url) {
  return typeof url === 'string' && (validLink(url) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(url))
}

function IconLayer({ planning }) {
  if (!planning.backgroundIconEnabled || !planning.backgroundIcon) return null
  const keys = planning.backgroundIcon === 'random' ? variety : [planning.backgroundIcon]
  const spacing = planning.backgroundIconSpacing
  return <div className="planning-icons" style={{ gridAutoRows: `${spacing}px`, color: planning.backgroundIconColor, opacity: planning.backgroundIconOpacity, padding: `${spacing / 2}px`, gap: `${spacing / 2}px`, ...motionVars(planning) }} aria-hidden="true">
    {iconCells.map(position => <IconByKey key={position} name={keys[position % keys.length]} size={planning.backgroundIconSize} strokeWidth={1.5} style={{ transform: `rotate(${planning.backgroundIconRotation}deg)` }} />)}
  </div>
}

// Imagem, textura e ícones de fundo da página.
export default function PageBackground({ planning, motion }) {
  return <>
    {safeImage(planning.backgroundImage) && <div className="planning-image" style={{ backgroundImage: `url(${JSON.stringify(planning.backgroundImage)})`, opacity: planning.backgroundImageOpacity, backgroundPosition: planning.backgroundImagePosition, filter: planning.backgroundImageBlur ? `blur(${planning.backgroundImageBlur}px)` : undefined, ...(motion && backgroundMotionKeyframe[planning.backgroundMotion] ? { animation: `${backgroundMotionKeyframe[planning.backgroundMotion]} var(--animation-duration) ease-in-out infinite` } : {}) }} />}
    {planning.backgroundPattern !== 'none' && <div className="planning-pattern" style={{ ...patternStyle(planning.backgroundPattern, planning.accentColor, planning.textColor), opacity: planning.backgroundPatternOpacity ?? 1 }} />}
    <IconLayer planning={planning} />
  </>
}
