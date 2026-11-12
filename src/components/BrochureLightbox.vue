<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Download, X } from '@lucide/vue'
import { useBrochureViewer } from '@/composables/useBrochureViewer'
import { useSmoothScroll } from '@/utils/smoothScroll'

const viewer = useBrochureViewer()
const smooth = useSmoothScroll()

const dialogRef = ref<HTMLDivElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)
let returnFocus: HTMLElement | null = null
let isLocked = false

function lock(): void {
  if (isLocked) return
  isLocked = true
  smooth.stop()
}

function unlock(): void {
  if (!isLocked) return
  isLocked = false
  smooth.start()
}

function onKeydown(event: KeyboardEvent): void {
  if (!viewer.active.value) return
  switch (event.key) {
    case 'Escape':
      viewer.close()
      break
    case 'ArrowRight':
      viewer.next()
      break
    case 'ArrowLeft':
      viewer.prev()
      break
    case 'Tab':
      trapFocus(event)
      break
  }
}

/** Mantiene el foco dentro del diálogo (accesibilidad de modales) */
function trapFocus(event: KeyboardEvent): void {
  const dialog = dialogRef.value
  if (!dialog) return
  const focusables = Array.from(
    dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
  )
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => viewer.active.value !== null,
  async (isOpen) => {
    if (isOpen) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      lock()
      await nextTick()
      closeRef.value?.focus()
    } else {
      unlock()
      returnFocus?.focus({ preventScroll: true })
      returnFocus = null
    }
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  viewer.close()
  unlock()
  returnFocus = null
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-500 ease-(--ease-out-expo)"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="viewer.active.value"
        ref="dialogRef"
        class="fixed inset-0 z-[90] flex flex-col bg-ink-950/92 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        :aria-label="viewer.active.value.title"
        data-lenis-prevent
        @click.self="viewer.close()"
      >
        <div class="container-wide flex items-center justify-between gap-4 py-4">
          <p class="min-w-0 truncate text-fluid-sm font-semibold text-paper">
            <span class="mr-3 text-paper/45">
              {{ (viewer.index.value ?? 0) + 1 }} / {{ viewer.total.value }}
            </span>
            {{ viewer.active.value.title }}
          </p>
          <div class="flex shrink-0 items-center gap-2">
            <a
              :href="viewer.active.value.src"
              :download="`${viewer.active.value.id}.webp`"
              class="glass flex h-11 items-center gap-2 rounded-full px-4 text-fluid-xs font-bold text-paper"
            >
              <Download class="size-4" aria-hidden="true" />
              <span class="hidden sm:inline">Descargar</span>
            </a>
            <button
              ref="closeRef"
              type="button"
              class="glass flex size-11 items-center justify-center rounded-full text-paper"
              aria-label="Cerrar"
              @click="viewer.close()"
            >
              <X class="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-6 sm:px-20" @click.self="viewer.close()">
          <Transition
            mode="out-in"
            enter-active-class="transition-[opacity,translate] duration-500 ease-(--ease-out-expo)"
            leave-active-class="transition-[opacity] duration-200"
            enter-from-class="opacity-0 translate-y-4"
            leave-to-class="opacity-0"
          >
            <img
              :key="viewer.active.value.id"
              :src="viewer.active.value.src"
              :width="viewer.active.value.width"
              :height="viewer.active.value.height"
              :alt="viewer.active.value.title"
              decoding="async"
              class="max-h-full max-w-full rounded-2xl object-contain shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
            />
          </Transition>

          <button
            v-if="viewer.total.value > 1"
            type="button"
            class="glass absolute left-2 flex size-11 items-center justify-center rounded-full text-paper sm:left-6"
            aria-label="Brochure anterior"
            @click="viewer.prev()"
          >
            <ChevronLeft class="size-5" aria-hidden="true" />
          </button>
          <button
            v-if="viewer.total.value > 1"
            type="button"
            class="glass absolute right-2 flex size-11 items-center justify-center rounded-full text-paper sm:right-6"
            aria-label="Brochure siguiente"
            @click="viewer.next()"
          >
            <ChevronRight class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
