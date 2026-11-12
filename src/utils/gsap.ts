import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { Observer } from 'gsap/Observer'
import { SplitText } from 'gsap/SplitText'

/**
 * Punto único de registro de plugins. Todo el código importa GSAP desde
 * aquí para garantizar que los plugins estén registrados exactamente una vez
 * y evitar que el tree-shaking los elimine.
 */
gsap.registerPlugin(ScrollTrigger, Flip, Observer, SplitText)

gsap.defaults({ ease: 'expo.out', duration: 1.1 })

ScrollTrigger.config({
  // Evita recálculos cuando la barra de direcciones móvil aparece/desaparece
  ignoreMobileResize: true,
})

export { gsap, ScrollTrigger, Flip, Observer, SplitText }

export const MOTION_QUERY = '(prefers-reduced-motion: no-preference)'
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
export const DESKTOP_QUERY = '(min-width: 1024px)'
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}
