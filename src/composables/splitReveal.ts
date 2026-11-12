import { gsap, SplitText } from '@/utils/gsap'

export type SplitMode = 'chars' | 'words' | 'lines'

export interface SplitRevealOptions {
  readonly mode?: SplitMode
  readonly stagger?: number
  readonly duration?: number
  readonly delay?: number
  /** Elemento que dispara la animación; `false` para animar al instante (hero) */
  readonly trigger?: Element | false
  readonly start?: string
}

const SPLIT_TYPE: Record<SplitMode, string> = {
  chars: 'words,chars',
  words: 'words',
  lines: 'lines',
}

const MASK_TYPE: Record<SplitMode, 'words' | 'lines'> = {
  chars: 'words',
  words: 'words',
  lines: 'lines',
}

/**
 * Divide un título en caracteres/palabras/líneas y los revela desde una
 * máscara al entrar en el viewport.
 *
 * `autoSplit` re-divide el texto cuando cambian las fuentes o el ancho del
 * contenedor; al devolver la animación desde `onSplit`, GSAP la mata y la
 * recrea conservando el progreso. Debe llamarse dentro de un contexto
 * (`useGsap`) para que el `revert()` del componente deshaga el split.
 */
export function splitReveal(target: HTMLElement, options: SplitRevealOptions = {}): SplitText {
  const mode = options.mode ?? 'chars'
  const trigger = options.trigger === undefined ? target : options.trigger

  return SplitText.create(target, {
    type: SPLIT_TYPE[mode],
    mask: MASK_TYPE[mode],
    // SplitText nombra cada máscara como `${clase}-mask` → .split-word-mask / .split-line-mask
    wordsClass: 'split-word',
    linesClass: 'split-line',
    autoSplit: true,
    aria: 'auto',
    onSplit(self: SplitText) {
      target.classList.add('is-split')
      const pieces = mode === 'chars' ? self.chars : mode === 'words' ? self.words : self.lines
      return gsap.from(pieces, {
        yPercent: 115,
        rotate: mode === 'lines' ? 0 : 4,
        duration: options.duration ?? 1.2,
        delay: options.delay ?? 0,
        stagger: options.stagger ?? (mode === 'chars' ? 0.022 : mode === 'words' ? 0.06 : 0.1),
        ease: 'expo.out',
        ...(trigger
          ? {
              scrollTrigger: {
                trigger,
                start: options.start ?? 'top 85%',
                once: true,
              },
            }
          : {}),
      })
    },
  })
}
