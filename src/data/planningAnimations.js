export const animationSpeeds = {
  slow: '14s',
  relaxed: '9s',
  normal: '5s',
  fast: '2.8s',
  turbo: '1.2s',
}

export const animationIntensities = {
  subtle: 0.35,
  low: 0.6,
  medium: 1,
  high: 1.45,
  extreme: 2,
}

export const entranceAnimations = {
  none: '',
  fade: 'animate-[planning-fade_var(--animation-duration)_var(--animation-ease)_both]',
  rise: 'animate-[planning-rise_var(--animation-duration)_var(--animation-ease)_both]',
  'slide-left': 'animate-[planning-slide-left_var(--animation-duration)_var(--animation-ease)_both]',
  'slide-right': 'animate-[planning-slide-right_var(--animation-duration)_var(--animation-ease)_both]',
  zoom: 'animate-[planning-zoom_var(--animation-duration)_var(--animation-ease)_both]',
  flip: 'animate-[planning-flip_var(--animation-duration)_var(--animation-ease)_both]',
  bounce: 'animate-[planning-bounce_var(--animation-duration)_var(--animation-ease)_both]',
  glitch: 'animate-[planning-glitch_var(--animation-duration)_var(--animation-ease)_both]',
}

export const loopAnimations = {
  none: '',
  float: 'animate-[planning-float_var(--animation-duration)_ease-in-out_infinite]',
  breathe: 'animate-[planning-breathe_var(--animation-duration)_ease-in-out_infinite]',
  sway: 'animate-[planning-sway_var(--animation-duration)_ease-in-out_infinite]',
  shake: 'animate-[planning-shake_var(--animation-duration)_ease-in-out_infinite]',
  spin: 'animate-[planning-spin_var(--animation-duration)_linear_infinite]',
}

export const iconAnimations = {
  none: '',
  float: 'animate-[planning-float_var(--animation-duration)_ease-in-out_infinite]',
  pulse: 'animate-[planning-pulse_var(--animation-duration)_ease-in-out_infinite]',
  spin: 'animate-[planning-spin_var(--animation-duration)_linear_infinite]',
  bounce: 'animate-[planning-bounce_var(--animation-duration)_ease-in-out_infinite]',
  swing: 'animate-[planning-swing_var(--animation-duration)_ease-in-out_infinite]',
  orbit: 'animate-[planning-orbit_var(--animation-duration)_linear_infinite]',
  glitch: 'animate-[planning-glitch_var(--animation-duration)_steps(2)_infinite]',
}

export const hoverAnimations = {
  none: '',
  lift: 'hover:-translate-y-2',
  scale: 'hover:scale-[1.025]',
  glow: 'hover:shadow-[0_0_30px_var(--accent-color)]',
  tilt: 'hover:rotate-1',
  jelly: 'hover:animate-[planning-jelly_.7s_ease]',
}
