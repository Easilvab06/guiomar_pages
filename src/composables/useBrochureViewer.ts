import { computed, readonly, ref, type ComputedRef, type DeepReadonly, type Ref } from 'vue'
import { BROCHURES } from '@/data/brochures'
import type { Brochure } from '@/types'

/**
 * Estado compartido del visor de brochures (singleton de módulo).
 * Cualquier sección puede abrir un brochure por id; el lightbox es el único
 * consumidor que lo renderiza.
 */
const activeIndex = ref<number | null>(null)
const playlist = ref<readonly string[]>(BROCHURES.map((b) => b.id))

const activeBrochure = computed<Brochure | null>(() => {
  if (activeIndex.value === null) return null
  const id = playlist.value[activeIndex.value]
  return id ? (BROCHURES.find((b) => b.id === id) ?? null) : null
})

function open(id: string, ids?: readonly string[]): void {
  if (ids && ids.length > 0) playlist.value = ids
  else playlist.value = BROCHURES.map((b) => b.id)
  const index = playlist.value.indexOf(id)
  activeIndex.value = index >= 0 ? index : null
}

function close(): void {
  activeIndex.value = null
}

function step(delta: 1 | -1): void {
  if (activeIndex.value === null) return
  const total = playlist.value.length
  activeIndex.value = (activeIndex.value + delta + total) % total
}

export interface BrochureViewer {
  readonly active: ComputedRef<Brochure | null>
  readonly index: DeepReadonly<Ref<number | null>>
  readonly total: ComputedRef<number>
  open: (id: string, ids?: readonly string[]) => void
  close: () => void
  next: () => void
  prev: () => void
}

export function useBrochureViewer(): BrochureViewer {
  return {
    active: activeBrochure,
    index: readonly(activeIndex),
    total: computed(() => playlist.value.length),
    open,
    close,
    next: () => step(1),
    prev: () => step(-1),
  }
}
