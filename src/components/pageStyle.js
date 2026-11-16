import { fonts, motionVars } from '../data/visuals'

// Variáveis e cores da página (usadas pela página final e pela prancheta do editor).
export function pageStyle(planning) {
  return {
    backgroundColor: planning.backgroundColor,
    ...(planning.backgroundGradient ? { backgroundImage: `linear-gradient(${planning.backgroundGradientAngle}deg, ${planning.backgroundColor}, ${planning.backgroundGradientColor})` } : {}),
    color: planning.textColor,
    '--accent-color': planning.accentColor,
    '--content-offset': `${planning.contentOffset}px`,
    fontFamily: fonts[planning.fontFamily] || fonts.sans,
    fontSize: `${planning.baseFontSize || 18}px`,
    '--block-gap': `${planning.blockGap ?? 20}px`,
    ...motionVars(planning),
  }
}
