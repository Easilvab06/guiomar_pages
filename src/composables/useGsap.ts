import { onMounted, onUnmounted, type Ref } from 'vue'
import { gsap } from '@/utils/gsap'

export type MatchMediaSetup = (mm: gsap.MatchMedia, scope: HTMLElement) => void

/**
 * Encapsula todas las animaciones de un componente en un `gsap.matchMedia`
 * con alcance (scope) en su elemento raíz.
 *
 * `mm.revert()` en `onUnmounted` mata cada tween, timeline, ScrollTrigger,
 * Observer y SplitText creados dentro del setup y restaura los estilos
 * inline originales. Es la limpieza correcta a nivel de componente:
 * `ScrollTrigger.killAll()` aquí destruiría también los triggers de
 * componentes hermanos que siguen montados (se reserva para el proveedor raíz).
 */
export function useGsap(scope: Readonly<Ref<HTMLElement | null>>, setup: MatchMediaSetup): void {
  let mm: gsap.MatchMedia | null = null

  onMounted(() => {
    const el = scope.value
    if (!el) return
    mm = gsap.matchMedia(el)
    setup(mm, el)
  })

  onUnmounted(() => {
    mm?.revert()
    mm = null
  })
}
